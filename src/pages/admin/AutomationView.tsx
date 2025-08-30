import React, { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import { Icon } from '@iconify/react';
import { getAutomationFlow, saveAutomationFlow, getAutomationHistory } from '../../apiClient';
import Spinner from '../../components/Spinner';
import { AutomationRunHistory } from '../../types';
import { formatRelativeDate } from '../../utils/formatters';
import { useI18n } from '../../I18nContext';
import { useAuth } from '../../AuthContext';


// --- Execution History Panel ---
const HistoryModal: React.FC<{ run: AutomationRunHistory | null; onClose: () => void }> = ({ run, onClose }) => {
    if (!run) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-modal-fade-in" onClick={onClose}>
            <div className="bg-tg-secondary-bg rounded-lg shadow-xl w-full max-w-2xl animate-modal-slide-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-tg-border">
                    <h3 className="text-lg font-bold">Деталі запуску #{run.id.substring(0, 8)}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-tg-secondary-bg-hover"><Icon icon="lucide:x" className="h-5 w-5" /></button>
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                    <h4 className="font-semibold mb-2">Логи виконання:</h4>
                    <pre className="bg-tg-bg p-3 rounded-md text-xs whitespace-pre-wrap font-mono">
                        {run.logs.join('\n')}
                    </pre>
                    <h4 className="font-semibold mt-4 mb-2">Дані триггера:</h4>
                    <pre className="bg-tg-bg p-3 rounded-md text-xs whitespace-pre-wrap font-mono">
                        {JSON.stringify(run.triggerData, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};


const ExecutionHistoryPanel: React.FC = () => {
    const [history, setHistory] = useState<AutomationRunHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRun, setSelectedRun] = useState<AutomationRunHistory | null>(null);
    const { t } = useI18n();
    const { user } = useAuth();
    const ws = useRef<WebSocket | null>(null);

    const fetchHistory = useCallback(async () => {
        try {
            const { data } = await getAutomationHistory();
            setHistory(data);
        } catch (error) {
            console.error("Failed to fetch automation history", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();

        // --- WebSocket Setup for real-time updates ---
        const getWsUrl = () => {
            const apiUrl = (import.meta as any).env.VITE_API_BASE_URL;
            if (apiUrl) {
                const url = new URL(apiUrl);
                url.protocol = url.protocol === 'https:' ? 'wss' : 'ws';
                return url.toString();
            }
            // Use non-secure WebSocket for local dev if backend is on http
            const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host.includes('localhost') ? 'localhost:3001' : window.location.host;
            return `${proto}//${host}`;
        };

        ws.current = new WebSocket(getWsUrl());
        ws.current.onopen = () => {
            console.log('Admin WebSocket connected for automation updates');
            if (user?.token) ws.current?.send(JSON.stringify({ type: 'auth', token: user.token }));
        };
        ws.current.onmessage = (event) => {
            const messageData = JSON.parse(event.data);
            if (messageData.type === 'AUTOMATION_RUN_COMPLETED') {
                console.log('Automation run completed, refetching history...');
                fetchHistory();
            }
        };
        return () => ws.current?.close();

    }, [fetchHistory, user?.token]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
    }

    return (
        <div className="p-4">
            {history.length === 0 ? (
                <p className="text-center text-tg-hint">Історія запусків порожня.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                         <thead className="border-b border-tg-border">
                            <tr>
                                <th className="p-2">Час</th>
                                <th className="p-2">Тригер</th>
                                <th className="p-2">Статус</th>
                                <th className="p-2">Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(run => (
                                <tr key={run.id} className="border-b border-tg-border hover:bg-tg-secondary-bg-hover">
                                    <td className="p-2 whitespace-nowrap" title={new Date(run.createdAt).toLocaleString()}>{formatRelativeDate(run.createdAt, t)}</td>
                                    <td className="p-2">{run.triggerType}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                            run.status === 'SUCCESS' ? 'bg-green-500/30 text-green-300' 
                                          : run.status === 'FAILED' ? 'bg-red-500/30 text-red-300' 
                                          : 'bg-yellow-500/30 text-yellow-300'
                                        }`}>{run.status}</span>
                                    </td>
                                    <td className="p-2">
                                        <button onClick={() => setSelectedRun(run)} className="text-tg-link hover:underline">Деталі</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <HistoryModal run={selectedRun} onClose={() => setSelectedRun(null)} />
        </div>
    );
};


// --- Main Automation View Component ---
interface AutomationViewProps {
    showToast: (message: string) => void;
}

const initialNodes: Node[] = [
  { id: '1', type: 'triggerNode', data: { label: 'Користувач зареєструвався' }, position: { x: 50, y: 150 } },
  { id: '2', type: 'actionNode', data: { label: 'Відправити Email привітання' }, position: { x: 350, y: 50 } },
  { id: '3', type: 'logNode', data: { label: 'Записати лог про реєстрацію' }, position: { x: 350, y: 250 } },
];

const TriggerNode: React.FC<NodeProps> = ({ data }) => (
    <div className="react-flow__node-default node-trigger"><Icon icon="lucide:zap" className="node-icon"/><span>{data.label}</span><Handle type="source" position={Position.Right} id="a" /></div>
);
const ActionNode: React.FC<NodeProps> = ({ data }) => (
    <div className="react-flow__node-default node-action"><Icon icon="lucide:send" className="node-icon"/><span>{data.label}</span><Handle type="target" position={Position.Left} id="a" /><Handle type="source" position={Position.Right} id="b" /></div>
);
const LogNode: React.FC<NodeProps> = ({ data }) => (
    <div className="react-flow__node-default node-log"><Icon icon="lucide:terminal" className="node-icon"/><span>{data.label}</span><Handle type="target" position={Position.Left} id="a" /></div>
);

const nodeTypes = { triggerNode: TriggerNode, actionNode: ActionNode, logNode: LogNode };
const TRIGGER_TYPE = 'USER_REGISTERED';
const FLOW_NAME = 'User Registration Flow';

const AutomationView: React.FC<AutomationViewProps> = ({ showToast }) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');

    useEffect(() => {
        if (activeTab === 'editor') {
            const loadFlow = async () => {
                setIsLoading(true);
                try {
                    const { data } = await getAutomationFlow(TRIGGER_TYPE);
                    if (data.flowData && data.flowData.nodes) {
                        setNodes(data.flowData.nodes);
                        setEdges(data.flowData.edges || []);
                    } else {
                        setNodes(initialNodes);
                        setEdges([]);
                    }
                } catch (error: any) {
                    if (error.response?.status === 404) {
                        setNodes(initialNodes);
                        setEdges([]);
                    } else {
                        showToast('Помилка завантаження сценарію.');
                    }
                } finally {
                    setIsLoading(false);
                }
            };
            loadFlow();
        }
    }, [showToast, activeTab]);

    const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect: OnConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const flowData = { nodes, edges };
            await saveAutomationFlow(FLOW_NAME, TRIGGER_TYPE, flowData);
            showToast('Сценарій успішно збережено!');
        } catch (error) {
            showToast('Помилка при збереженні сценарію.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderEditor = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
        }
        return (
            <div className="w-full h-full relative">
                 <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView>
                    <Controls />
                    <MiniMap />
                    <Background gap={16} color="#2f3f50" />
                </ReactFlow>
                <div className="absolute top-4 right-4 flex gap-4">
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-tg-button text-tg-button-text font-bold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {isSaving ? <Spinner size="sm" /> : <Icon icon="lucide:save" />}
                        {isSaving ? 'Збереження...' : 'Зберегти'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-[75vh] bg-tg-bg rounded-lg overflow-hidden flex flex-col">
            <div className="flex border-b border-tg-border flex-shrink-0">
                <button onClick={() => setActiveTab('editor')} className={`px-4 py-2 font-semibold ${activeTab === 'editor' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>Редактор</button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 font-semibold ${activeTab === 'history' ? 'text-tg-link border-b-2 border-tg-link' : 'text-tg-hint'}`}>Історія запусків</button>
            </div>
            <div className="flex-grow min-h-0">
                {activeTab === 'editor' ? renderEditor() : <ExecutionHistoryPanel />}
            </div>
        </div>
    );
};

export default AutomationView;