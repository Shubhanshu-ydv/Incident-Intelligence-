import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Monitor, Server, Database, Brain, Cpu } from 'lucide-react';

// Icon mapping for each node type
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    ui: Monitor,
    fastapi: Server,
    pathway: Cpu,
    llm: Brain,
    supabase: Database,
};

export interface FlowNodeData {
    label: string;
    nodeType: 'ui' | 'fastapi' | 'pathway' | 'llm' | 'supabase';
    status: 'idle' | 'active' | 'completed' | 'skipped';
}

function FlowNodeComponent({ data }: NodeProps<FlowNodeData>) {
    const Icon = iconMap[data.nodeType] || Monitor;

    const getNodeClass = () => {
        const base = 'flow-node-rf';
        switch (data.status) {
            case 'active':
                return `${base} active`;
            case 'completed':
                return `${base} completed`;
            case 'skipped':
                return `${base} skipped`;
            default:
                return base;
        }
    };

    return (
        <div className={getNodeClass()}>
            {/* Input handle - hidden for first node */}
            {data.nodeType !== 'ui' && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="flow-handle"
                />
            )}

            <div className="flow-node-content">
                <Icon className="flow-node-icon" />
                <span className="flow-node-label">{data.label}</span>
            </div>

            {/* Output handle - hidden for terminal nodes */}
            {data.nodeType !== 'llm' && (
                <Handle
                    type="source"
                    position={data.nodeType === 'fastapi' ? Position.Right : Position.Right}
                    id="main"
                    className="flow-handle"
                />
            )}

            {/* Extra handle for Supabase connection from FastAPI */}
            {data.nodeType === 'fastapi' && (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="supabase"
                    className="flow-handle"
                />
            )}

            {/* Top handle for Supabase to receive from FastAPI */}
            {data.nodeType === 'supabase' && (
                <Handle
                    type="target"
                    position={Position.Top}
                    className="flow-handle"
                />
            )}
        </div>
    );
}

export const FlowNode = memo(FlowNodeComponent);
