"""
Incident Intelligence - Real Pathway RAG Pipeline
==================================================
Uses YAML configuration pattern from llm-app reference.

Run in WSL2 Ubuntu with:
    source ~/pathway-env/bin/activate
    cd /mnt/c/Users/shubh/Downloads/shubh/pathway
    python app.py
"""

import os
import json
import time
import logging
import threading
import requests
from datetime import datetime
from typing import List, Dict, Any
from warnings import warn

import pathway as pw
from pathway.xpacks.llm.question_answering import SummaryQuestionAnswerer
from pathway.xpacks.llm.servers import QASummaryRestServer
from pydantic import BaseModel, ConfigDict, InstanceOf
from dotenv import load_dotenv
from aiohttp import web
import asyncio

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv(dotenv_path='/mnt/c/Users/shubh/Downloads/shubh/.env')

# Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
POLLING_INTERVAL = int(os.environ.get("PATHWAY_POLL_INTERVAL", "5"))
CACHE_DIR = os.path.expanduser("~/pathway-cache")
INCIDENTS_PORT = 8082  # Separate port for incidents API

# Pathway license
pw.set_license_key("demo-license-key-with-telemetry")

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Global incidents cache (updated by poller)
cached_incidents: List[Dict[str, Any]] = []


def fetch_incidents_from_supabase() -> List[Dict[str, Any]]:
    """Fetch all incidents from Supabase REST API."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("Supabase credentials not configured")
        return []
    
    try:
        url = f"{SUPABASE_URL}/rest/v1/incidents"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        params = {
            "select": "*",
            "order": "created_at.desc",  # Order by when added to DB, not incident timestamp
            "limit": "1000",  # Explicit high limit to get all incidents
            "deleted_at": "is.null"  # Exclude soft-deleted incidents
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        incidents = response.json()
        logger.info(f"✓ Fetched {len(incidents)} incidents from Supabase")
        return incidents
        
    except Exception as e:
        logger.error(f"Error fetching from Supabase: {e}")
        return []


def format_incident_as_text(incident: Dict[str, Any]) -> str:
    """
    Format an incident as plain text for RAG.
    Clean format without internal tags to prevent AI confusion.
    """
    incident_id = incident.get("incident_id", incident.get("id", "unknown"))
    
    return f"""Incident ID: {incident_id}
Title: {incident.get('title', 'N/A')}
Status: {incident.get('status', 'N/A')}
Severity: {incident.get('severity', 'N/A')}
Location: {incident.get('location', 'N/A')}
Description: {incident.get('description', 'N/A')}
Timestamp: {incident.get('timestamp', 'N/A')}
---"""


def write_incidents_to_files(cache_dir: str):
    """Write incidents to individual text files for Pathway to read."""
    os.makedirs(cache_dir, exist_ok=True)
    
    incidents = fetch_incidents_from_supabase()
    
    if not incidents:
        # Create a placeholder file
        placeholder = os.path.join(cache_dir, "placeholder.txt")
        with open(placeholder, "w") as f:
            f.write("No incidents loaded yet. Waiting for data from Supabase.")
        return
    
    # Clear old files
    for f in os.listdir(cache_dir):
        if f.endswith(".txt"):
            os.remove(os.path.join(cache_dir, f))
    
    # RUNTIME VALIDATION: Check for legacy IDs
    import re
    canonical_pattern = re.compile(r'^INC-\d{8}-\d{6}$')
    legacy_pattern = re.compile(r'^INC-\d+$')
    
    legacy_count = 0
    valid_count = 0
    
    # Write each incident as a text file
    for inc in incidents:
        inc_id = inc.get("incident_id", inc.get("id", "unknown"))
        
        # VALIDATION: Detect legacy IDs
        if legacy_pattern.match(inc_id) and not canonical_pattern.match(inc_id):
            logger.warning(f"⚠️  LEGACY ID DETECTED: {inc_id} - This should be migrated!")
            legacy_count += 1
            continue  # Skip writing legacy incidents to cache
        
        filepath = os.path.join(cache_dir, f"{inc_id}.txt")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(format_incident_as_text(inc))
        valid_count += 1
    
    logger.info(f"📁 Wrote {valid_count} incident files to {cache_dir}")
    
    if legacy_count > 0:
        logger.error(f"❌ SKIPPED {legacy_count} incidents with legacy IDs - Run migration!")


def start_supabase_poller(cache_dir: str):
    """Start background thread to poll Supabase."""
    global cached_incidents
    last_hash = ""
    
    def poll_loop():
        global cached_incidents
        nonlocal last_hash
        while True:
            try:
                incidents = fetch_incidents_from_supabase()
                if incidents:
                    current_hash = str(hash(json.dumps(incidents, sort_keys=True, default=str)))
                    if current_hash != last_hash:
                        cached_incidents = incidents  # Update global cache
                        write_incidents_to_files(cache_dir)
                        last_hash = current_hash
            except Exception as e:
                logger.error(f"Polling error: {e}")
            time.sleep(POLLING_INTERVAL)
    
    thread = threading.Thread(target=poll_loop, daemon=True)
    thread.start()
    logger.info(f"📡 Started Supabase polling (interval: {POLLING_INTERVAL}s)")


class App(BaseModel):
    """Pathway RAG Application using YAML config."""
    question_answerer: InstanceOf[SummaryQuestionAnswerer]
    host: str = "0.0.0.0"
    port: int = 8081
    
    with_cache: bool | None = None
    persistence_backend: pw.persistence.Backend | None = None
    persistence_mode: pw.PersistenceMode | None = pw.PersistenceMode.UDF_CACHING
    terminate_on_error: bool = False
    
    model_config = ConfigDict(extra="forbid", arbitrary_types_allowed=True)
    
    def run(self) -> None:
        server = QASummaryRestServer(
            self.host, self.port, self.question_answerer
        )
        
        if self.persistence_mode is None:
            if self.with_cache is True:
                warn("`with_cache` is deprecated.", DeprecationWarning)
                persistence_mode = pw.PersistenceMode.UDF_CACHING
            else:
                persistence_mode = None
        else:
            persistence_mode = self.persistence_mode
        
        if persistence_mode is not None:
            if self.persistence_backend is None:
                persistence_backend = pw.persistence.Backend.filesystem("./Cache")
            else:
                persistence_backend = self.persistence_backend
            persistence_config = pw.persistence.Config(
                persistence_backend,
                persistence_mode=persistence_mode,
            )
        else:
            persistence_config = None
        
        logger.info(f"🚀 Starting Pathway RAG Server on {self.host}:{self.port}")
        logger.info(f"📍 Endpoint: POST http://localhost:{self.port}/v2/answer")
        
        pw.run(
            persistence_config=persistence_config,
            terminate_on_error=self.terminate_on_error,
            monitoring_level=pw.MonitoringLevel.NONE,
        )


# ============================================================
# Incidents REST API (separate from Pathway RAG server)
# ============================================================

async def handle_incidents(request):
    """Return cached incidents as JSON."""
    return web.json_response(cached_incidents)


async def handle_health(request):
    """Health check."""
    return web.json_response({
        "status": "ok",
        "incidents_count": len(cached_incidents)
    })


def start_incidents_api():
    """Start aiohttp server for incidents API on separate port."""
    def run_server():
        app = web.Application()
        app.router.add_get('/incidents', handle_incidents)
        app.router.add_get('/health', handle_health)
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        runner = web.AppRunner(app)
        loop.run_until_complete(runner.setup())
        
        site = web.TCPSite(runner, 'localhost', INCIDENTS_PORT)
        loop.run_until_complete(site.start())
        
        logger.info(f"📋 Incidents API running on http://localhost:{INCIDENTS_PORT}/incidents")
        loop.run_forever()
    
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()


def main():
    """Main entry point."""
    global cached_incidents
    
    print("=" * 60)
    print("🚀 Incident Intelligence - REAL Pathway RAG Pipeline")
    print("=" * 60)
    print(f"Pathway Version: {pw.__version__}")
    print(f"Supabase: {SUPABASE_URL[:40]}..." if SUPABASE_URL else "Supabase: Not configured")
    print(f"Cache: {CACHE_DIR}")
    print("=" * 60)
    
    # Initial data fetch
    write_incidents_to_files(CACHE_DIR)
    cached_incidents = fetch_incidents_from_supabase()  # Initialize cache
    
    # Start background poller
    start_supabase_poller(CACHE_DIR)
    
    # Start incidents REST API on port 8082
    start_incidents_api()
    
    # Load YAML config and run Pathway RAG on port 8081
    yaml_path = os.path.join(os.path.dirname(__file__), "app.yaml")
    
    try:
        with open(yaml_path) as f:
            config = pw.load_yaml(f)
        app = App(**config)
        app.run()
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
    except Exception as e:
        logger.error(f"Pipeline error: {e}")
        raise


if __name__ == "__main__":
    main()
