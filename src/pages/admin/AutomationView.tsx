import React, { useCallback, useState, useEffect } from 'react';
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
import { getAutomationFlow, saveAutomationFlow } from '../../apiClient';
import Spinner from '../../components/Spinner';

interface AutomationViewProps {
    showToast: (message: string) => void;
}

// Начальные ноды для демонстрации (если в БД ничего нет)
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'triggerNode',
    data: { label: 'Користувач зареєструвався' },
    position: { x: 50, y: 150 },
  },
  {
    id: '2',
    type: 'actionNode',
    data: { label: 'Відправити Email привітання' },
    position: { x: 350, y: 50 },
  },
  {
    id: '3',
    type: 'logNode',
    data: { label: 'Записати лог про реєстрацію' },
    position: { x: 350, y: 250 },
  },
];

// Кастомная нода для триггеров (только выход)
const TriggerNode: React.FC<NodeProps> = ({ data }) => (
    <div className="react-flow__node-default node-trigger">
        <Icon icon="lucide:zap" className="node-icon"/>
        <span>{data.label}</span>
        <Handle type="source" position={Position.Right} id="a" />
    </div>
);

// Кастомная нода для действий (вход и выход)
const ActionNode: React.FC<NodeProps> = ({ data }) => (
    <div className="react-flow__node-default node-action">
        <Icon icon="lucide:send" className="node-icon"/>
        <span>{data.label}</span>
        <Handle type="target" position={Position.Left} id="a" />
        <Handle type="source" position={Position.Right} id="b" />
    </div>
);

// Кастомная нода для логирования (только вход)
const LogNode: React.FC<NodeProps> = ({ data }) => (
    <div className="react-flow__node-default node-log">
        <Icon icon="lucide:terminal" className="node-icon"/>
        <span>{data.label}</span>
        <Handle type="target" position={Position.Left} id="a" />
    </div>
);

// Регистрируем наши кастомные типы нод
const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  logNode: LogNode,
};

// Для прототипа будем работать с одним триггером
const TRIGGER_TYPE = 'USER_REGISTERED';
const FLOW_NAME = 'User Registration Flow';

const AutomationView: React.FC<AutomationViewProps> = ({ showToast }) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
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
                    // Если сценарий не найден, используем начальный
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
    }, [showToast]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );
    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );
    const onConnect: OnConnect = useCallback(
        (connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges]
    );

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const flowData = { nodes, edges };
            await saveAutomationFlow(FLOW_NAME, TRIGGER_TYPE, flowData);
            showToast('Сценарій успішно збережено!');
        } catch (error) {
            showToast('Помилка при збереженні сценарію.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-[75vh]"><Spinner size="lg" /></div>
    }

    return (
        <div className="w-full h-[75vh] bg-tg-bg rounded-lg overflow-hidden relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
            >
                <Controls />
                <MiniMap />
                <Background gap={16} color="#2f3f50" />
            </ReactFlow>
            <div className="absolute top-4 right-4 flex gap-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-tg-button text-tg-button-text font-bold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isSaving ? <Spinner size="sm" /> : <Icon icon="lucide:save" />}
                    {isSaving ? 'Збереження...' : 'Зберегти'}
                </button>
            </div>
        </div>
    );
};

export default AutomationView;