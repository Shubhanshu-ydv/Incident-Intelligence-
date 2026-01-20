import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Background,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Send, MessageSquare, Sparkles, Info, Clock, Activity } from 'lucide-react';
import { apiClient } from '../api/client';
import { FlowNode, FlowNodeData } from './FlowNode';
import { BinaryRainBackground } from './BinaryRainBackground';

// Flow types based on query classification
type FlowType = 'greeting' | 'keyword' | 'reasoning' | 'crud';
type NodeStatus = 'idle' | 'active' | 'completed' | 'skipped';

// Query classification patterns
const GREETING_PATTERNS = [
    /^(hi|hello|hey|hii+|helo+)[\s!.,?]*$/i,
    /^(good\s*)?(morning|afternoon|evening|night)[\s!.,?]*$/i,
    /^(howdy|hiya|yo|sup)[\s!.,?]*$/i,
    /^how\s*(are|r)\s*(you|u|ya)[\s!.,?]*$/i,
    /^what'?s\s*up[\s!.,?]*$/i,
    /^(who|what)\s*(are|r)\s*(you|u)[\s!.,?]*$/i,
    /^(help|help me)[\s!.,?]*$/i,
    /^(thanks?|thank\s*you|ty)[\s!.,?]*$/i,
    /^(bye|goodbye|see\s*you?|later)[\s!.,?]*$/i,
];

const KEYWORD_PATTERNS = [
    /^(show|list|find|get|display|fetch)\s+(all\s+)?(incidents?|issues?|problems?|records?)/i,
    /^(critical|high|medium|low)\s+(incidents?|issues?)/i,
    /^(how\s+many|count)\s+(incidents?|issues?)/i,
    /^(open|closed|resolved|active)\s+(incidents?|issues?)/i,
    /^(incidents?|issues?)\s+(from|in|at)\s+/i,
    /^(recent|latest|new)\s+(incidents?|issues?)/i,
];

const CRUD_PATTERNS = [
    /^(create|add|new|insert)\s+(an?\s+)?(incident|issue|record)/i,
    /^(update|edit|modify|change)\s+(the\s+)?(incident|issue)/i,
    /^(delete|remove|close)\s+(the\s+)?(incident|issue)/i,
    /^(mark|set)\s+(incident|issue).*(resolved|closed|open)/i,
];

const REASONING_PATTERNS = [
    /\b(why|how|explain|analyze|analysis|reason|cause|root\s*cause)\b/i,
    /\b(pattern|trend|insight|summary|summarize|overview)\b/i,
    /\b(recommend|suggest|should|could|prevent|avoid)\b/i,
    /\b(compare|correlation|related|similar)\b/i,
    /\b(what\s+happened|tell\s+me\s+about|describe)\b/i,
];

function classifyQuery(message: string): FlowType {
    const msg = message.trim();
    if (GREETING_PATTERNS.some(p => p.test(msg))) return 'greeting';
    if (CRUD_PATTERNS.some(p => p.test(msg))) return 'crud';
    if (KEYWORD_PATTERNS.some(p => p.test(msg))) return 'keyword';
    if (REASONING_PATTERNS.some(p => p.test(msg))) return 'reasoning';
    return 'reasoning'; // Default to reasoning
}

const FLOW_CAPTIONS: Record<FlowType, string> = {
    greeting: "Greeting detected — responding directly",
    keyword: "Keyword search — querying Supabase directly",
    reasoning: "AI reasoning — routed through Pathway RAG",
    crud: "Write operation — updating source of truth",
};

const GREETING_RESPONSES = [
    "Hi! I can help you analyze incidents, search issues, or explain system behavior.",
    "Hello! I'm your Incident Intelligence assistant. Ask me anything!",
    "Hey there! Ready to help you with incident analysis.",
];

// Custom node types
const nodeTypes = {
    flowNode: FlowNode,
};

// HORIZONTAL LAYOUT - Left to Right (WIDE SPACING)
// Web UI → FastAPI → Pathway → LLM
//              ↓
//           Supabase
const createNodes = (): Node<FlowNodeData>[] => [
    {
        id: 'ui',
        type: 'flowNode',
        position: { x: 50, y: 120 },
        data: { label: 'Web UI', nodeType: 'ui', status: 'idle' },
        draggable: false,
    },
    {
        id: 'fastapi',
        type: 'flowNode',
        position: { x: 280, y: 120 },
        data: { label: 'FastAPI', nodeType: 'fastapi', status: 'idle' },
        draggable: false,
    },
    {
        id: 'pathway',
        type: 'flowNode',
        position: { x: 510, y: 120 },
        data: { label: 'Pathway', nodeType: 'pathway', status: 'idle' },
        draggable: false,
    },
    {
        id: 'llm',
        type: 'flowNode',
        position: { x: 740, y: 120 },
        data: { label: 'LLM', nodeType: 'llm', status: 'idle' },
        draggable: false,
    },
    {
        id: 'supabase',
        type: 'flowNode',
        position: { x: 395, y: 300 },
        data: { label: 'Supabase', nodeType: 'supabase', status: 'idle' },
        draggable: false,
    },
];

// Edge configurations for different flow types
const createEdges = (): Edge[] => [
    // UI → FastAPI (always active)
    {
        id: 'ui-fastapi',
        source: 'ui',
        target: 'fastapi',
        type: 'smoothstep',
        label: 'Request',
        labelStyle: { fill: '#94a3b8', fontSize: 10, transform: 'translateY(-12px)' },
        labelShowBg: false,
        style: { stroke: '#4b5563', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' },
    },
    // FastAPI → Pathway (reasoning path)
    {
        id: 'fastapi-pathway',
        source: 'fastapi',
        target: 'pathway',
        type: 'smoothstep',
        label: 'AI Query',
        labelStyle: { fill: '#94a3b8', fontSize: 10, transform: 'translateY(-12px)' },
        labelShowBg: false,
        style: { stroke: '#4b5563', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' },
    },
    // Pathway → LLM (reasoning path)
    {
        id: 'pathway-llm',
        source: 'pathway',
        target: 'llm',
        type: 'smoothstep',
        label: 'Prompt',
        labelStyle: { fill: '#94a3b8', fontSize: 10, transform: 'translateY(-12px)' },
        labelShowBg: false,
        style: { stroke: '#4b5563', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' },
    },
    // FastAPI → Supabase (CRUD / keyword search - SOLID)
    {
        id: 'fastapi-supabase',
        source: 'fastapi',
        target: 'supabase',
        type: 'smoothstep',
        label: 'CRUD',
        labelStyle: { fill: '#3b82f6', fontSize: 10, fontWeight: 600, transform: 'translate(-20px, -15px)' },
        labelShowBg: false,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
    },
    // Pathway → Supabase (RAG context retrieval - DOTTED)
    {
        id: 'pathway-supabase',
        source: 'pathway',
        target: 'supabase',
        type: 'smoothstep',
        label: 'Read-only Context',
        labelStyle: { fill: '#a78bfa', fontSize: 9, fontStyle: 'italic', transform: 'translate(15px, -15px)' },
        labelShowBg: false,
        style: { stroke: '#a78bfa', strokeWidth: 2, strokeDasharray: '5 5' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' },
    },
];

// Flow path definitions
const FLOW_PATHS: Record<FlowType, {
    activeNodes: string[];
    activeEdges: string[];
    animatedEdges: string[];
}> = {
    greeting: {
        activeNodes: ['ui'],
        activeEdges: [],
        animatedEdges: [],
    },
    keyword: {
        activeNodes: ['ui', 'fastapi', 'supabase'],
        activeEdges: ['ui-fastapi', 'fastapi-supabase'],
        animatedEdges: ['ui-fastapi', 'fastapi-supabase'],
    },
    reasoning: {
        activeNodes: ['ui', 'fastapi', 'pathway', 'llm', 'supabase'],
        activeEdges: ['ui-fastapi', 'fastapi-pathway', 'pathway-llm', 'pathway-supabase'],
        animatedEdges: ['ui-fastapi', 'fastapi-pathway', 'pathway-llm', 'pathway-supabase'],
    },
    crud: {
        activeNodes: ['ui', 'fastapi', 'supabase'],
        activeEdges: ['ui-fastapi', 'fastapi-supabase'],
        animatedEdges: ['ui-fastapi', 'fastapi-supabase'],
    },
};

function AIFlowPanelContent() {
    const [question, setQuestion] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [flowType, setFlowType] = useState<FlowType | null>(null);
    const [caption, setCaption] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [latency, setLatency] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState(createNodes());
    const [edges, setEdges, onEdgesChange] = useEdgesState(createEdges());

    // Animate a single node to active state
    const activateNode = useCallback((nodeId: string, allActiveNodes: string[]) => {
        setNodes(nds => nds.map(node => {
            if (node.id === nodeId) {
                return { ...node, data: { ...node.data, status: 'active' } };
            }
            if (!allActiveNodes.includes(node.id)) {
                return { ...node, data: { ...node.data, status: 'skipped' } };
            }
            return node;
        }));
    }, [setNodes]);

    // Activate an edge with animation
    const activateEdge = useCallback((edgeId: string, type: FlowType, allActiveEdges: string[]) => {
        setEdges(eds => eds.map(edge => {
            const isActive = allActiveEdges.includes(edge.id);
            const isCurrentEdge = edge.id === edgeId;
            const isDotted = edge.id === 'pathway-supabase';
            const isCrud = edge.id === 'fastapi-supabase';

            let strokeColor = 'rgba(75, 85, 99, 0.3)';
            if (isActive || isCurrentEdge) {
                strokeColor = '#22c55e';
                if (type === 'crud' && isCrud) strokeColor = '#f59e0b';
                if (type === 'keyword' && isCrud) strokeColor = '#3b82f6';
            }

            return {
                ...edge,
                animated: isCurrentEdge,
                style: {
                    ...edge.style,
                    stroke: strokeColor,
                    strokeWidth: (isActive || isCurrentEdge) ? 3 : 2,
                    strokeDasharray: isDotted ? '5 5' : undefined,
                    opacity: (isActive || isCurrentEdge) ? 1 : 0.4,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: strokeColor,
                },
                labelStyle: {
                    ...edge.labelStyle,
                    opacity: (isActive || isCurrentEdge) ? 1 : 0.4,
                },
            };
        }));
    }, [setEdges]);

    // Complete node (mark as completed instead of active)
    const completeNode = useCallback((nodeId: string) => {
        setNodes(nds => nds.map(node => {
            if (node.id === nodeId) {
                return { ...node, data: { ...node.data, status: 'completed' } };
            }
            return node;
        }));
    }, [setNodes]);

    // Sequential animation for data flow
    const animateFlow = useCallback(async (type: FlowType) => {
        const config = FLOW_PATHS[type];
        const { activeNodes, activeEdges } = config;

        // Animation sequences for each flow type
        const sequences: Record<FlowType, { node: string; edge?: string }[]> = {
            greeting: [
                { node: 'ui' },
            ],
            keyword: [
                { node: 'ui' },
                { node: 'fastapi', edge: 'ui-fastapi' },
                { node: 'supabase', edge: 'fastapi-supabase' },
            ],
            reasoning: [
                { node: 'ui' },
                { node: 'fastapi', edge: 'ui-fastapi' },
                { node: 'pathway', edge: 'fastapi-pathway' },
                { node: 'supabase', edge: 'pathway-supabase' },
                { node: 'llm', edge: 'pathway-llm' },
            ],
            crud: [
                { node: 'ui' },
                { node: 'fastapi', edge: 'ui-fastapi' },
                { node: 'supabase', edge: 'fastapi-supabase' },
            ],
        };

        const sequence = sequences[type];
        const activatedEdges: string[] = [];

        for (const step of sequence) {
            activateNode(step.node, activeNodes);
            if (step.edge) {
                activatedEdges.push(step.edge);
                activateEdge(step.edge, type, activatedEdges);
            }
            await new Promise(resolve => setTimeout(resolve, 400));
            completeNode(step.node);
        }
    }, [activateNode, activateEdge, completeNode]);

    // Reset to idle state
    const resetFlow = useCallback(() => {
        setNodes(createNodes());
        setEdges(createEdges());
        setFlowType(null);
        setCaption('');
    }, [setNodes, setEdges]);

    const handleSubmit = async () => {
        if (!question.trim() || isLoading) return;

        setIsLoading(true);
        setResponse('');
        setCurrentStep(0);
        setLatency(null);
        const start = Date.now();

        const queryType = classifyQuery(question);
        setFlowType(queryType);
        setCaption(FLOW_CAPTIONS[queryType]);

        // Step 1: Request received
        setCurrentStep(1);

        // Start visual flow animation
        animateFlow(queryType);

        try {
            if (queryType === 'greeting') {
                await new Promise(resolve => setTimeout(resolve, 600));
                const randomResponse = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
                setResponse(randomResponse);
                setLatency(Date.now() - start);
            } else {
                // Step 2: Context retrieved
                await new Promise(resolve => setTimeout(resolve, 400));
                setCurrentStep(2);

                const aiResponse = await apiClient.sendChatMessage(question);

                // Step 3: LLM response (for reasoning)
                if (queryType === 'reasoning') {
                    setCurrentStep(3);
                }

                setResponse(aiResponse.message);
                setLatency(Date.now() - start);
            }
        } catch (error) {
            console.error('Failed to get response:', error);
            setResponse('Error: Failed to get response. Make sure the backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const goBack = () => {
        // Use pushState to change URL without reload
        window.history.pushState({}, '', '/');
        // Dispatch popstate event so App.tsx detects the change
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    // Get status indicator color
    const getStatusColor = () => {
        switch (flowType) {
            case 'keyword': return '#3b82f6';
            case 'reasoning': return '#22c55e';
            case 'crud': return '#f59e0b';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="flow-panel">
            <BinaryRainBackground />

            {/* Header */}
            <div className="flow-panel-header">
                <div className="flow-panel-title">
                    Data Flow Explanation
                </div>
                {/* Mode Badges */}
                <div className="mode-badges">
                    {flowType && (
                        <>
                            <span className="mode-badge" style={{ borderColor: getStatusColor() }}>
                                <Activity className="w-3 h-3" />
                                Mode: {flowType === 'reasoning' ? 'AI Reasoning' : flowType === 'keyword' ? 'Search' : flowType === 'crud' ? 'CRUD' : 'Greeting'}
                            </span>
                            <span className="mode-badge">
                                <Info className="w-3 h-3" />
                                Source: {flowType === 'greeting' ? 'Local' : 'Supabase'}
                            </span>
                            {latency && (
                                <span className="mode-badge">
                                    <Clock className="w-3 h-3" />
                                    ~{latency}ms
                                </span>
                            )}
                        </>
                    )}
                </div>
                <button onClick={goBack} className="back-button">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
            </div>

            {/* Three-Column Flow Layout: Legend | Diagram | Status */}
            <div className="flow-layout">
                {/* LEFT: Legend */}
                <aside className="flow-legend-panel">
                    <div className="legend-title">Legend</div>
                    <div className="legend-items">
                        <div className="legend-item">
                            <div className="legend-line solid blue"></div>
                            <span>Keyword Search</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-line solid orange"></div>
                            <span>CRUD (Write)</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-line dotted green"></div>
                            <span>AI Reasoning (RAG)</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-line dotted purple"></div>
                            <span>Read-only Context</span>
                        </div>
                    </div>
                </aside>

                {/* CENTER: Flow Diagram */}
                <main className="flow-canvas">
                    <div className="flow-diagram-title">System Architecture Flow</div>
                    <div className="flow-explanation-text">
                        This diagram updates dynamically based on how your question is routed.
                    </div>
                    <div className="react-flow-container">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            nodeTypes={nodeTypes}
                            fitView
                            fitViewOptions={{ padding: 0.2 }}
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={false}
                            zoomOnScroll={false}
                            zoomOnPinch={false}
                            panOnScroll={false}
                            panOnDrag={false}
                            preventScrolling={false}
                            minZoom={0.8}
                            maxZoom={1.2}
                        >
                            <Background
                                variant={BackgroundVariant.Dots}
                                gap={20}
                                size={1}
                                color="rgba(100, 116, 139, 0.3)"
                            />
                        </ReactFlow>
                    </div>
                </main>

                {/* RIGHT: Flow Status + Step Counter */}
                <aside className="flow-status-panel">
                    <div className="status-title">Current Flow</div>
                    {caption ? (
                        <div
                            className="flow-status-content"
                            style={{ borderColor: getStatusColor(), color: getStatusColor() }}
                        >
                            <Info className="w-4 h-4" />
                            <span>{caption}</span>
                        </div>
                    ) : (
                        <div className="flow-status-content idle">
                            <span>Ask a question to see the data flow</span>
                        </div>
                    )}

                    {/* Step Counter */}
                    {flowType && flowType !== 'greeting' && (
                        <>
                            <div className="status-title" style={{ marginTop: '0.5rem' }}>Flow Steps</div>
                            <div className="step-counter">
                                <div className={`step-item ${currentStep >= 1 ? 'active' : ''}`}>
                                    <span className="step-num">1</span>
                                    <span>Request received</span>
                                </div>
                                <div className={`step-item ${currentStep >= 2 ? 'active' : ''}`}>
                                    <span className="step-num">2</span>
                                    <span>Context retrieved</span>
                                </div>
                                {flowType === 'reasoning' && (
                                    <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
                                        <span className="step-num">3</span>
                                        <span>LLM response</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </aside>
            </div>

            {/* Interaction Section */}
            <div className="interaction-section">
                <div className="interaction-box">
                    <div className="interaction-box-title">
                        <MessageSquare className="w-4 h-4" />
                        Your Question
                    </div>
                    <textarea
                        className="question-input"
                        placeholder="Try: 'show critical incidents', 'why did server crash?', or 'create new incident'"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button
                        className="submit-button"
                        onClick={handleSubmit}
                        disabled={isLoading || !question.trim()}
                    >
                        <Send className="w-4 h-4" />
                        {isLoading ? 'Processing...' : 'Submit'}
                    </button>
                </div>

                <div className={`flow-connector ${isLoading || response ? 'active' : ''}`}>
                    <div className="connector-arrows">
                        <span>→</span>
                        <span className="connector-label">Flow</span>
                        <span>→</span>
                    </div>
                </div>

                <div className="interaction-box">
                    <div className="interaction-box-title">
                        <Sparkles className="w-4 h-4" />
                        AI Response
                    </div>
                    <div className={`response-display ${!response && !isLoading ? 'empty' : ''} ${isLoading && !response ? 'loading' : ''}`}>
                        {isLoading && !response ? (
                            <div className="loading-dots">
                                <div className="loading-dot"></div>
                                <div className="loading-dot"></div>
                                <div className="loading-dot"></div>
                            </div>
                        ) : response ? (
                            response
                        ) : (
                            'Response will appear here...'
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AIFlowPanel() {
    return (
        <ReactFlowProvider>
            <AIFlowPanelContent />
        </ReactFlowProvider>
    );
}
