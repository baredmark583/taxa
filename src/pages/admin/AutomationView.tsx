import React, { useCallback, useState } from 'react';
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

// Начальные ноды для демонстрации
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'triggerNode',
    data: { label: 'Користувач зареєструвався' },
    position: { x: 50, y: 50 },
  },
  {
    id: '2',
    type: 'actionNode',
    data: { label: 'Відправити Email' },
    position: { x: 350, y: 150 },
  },
  {
    id: '3',
    type: 'logNode',
    data: { label: 'Записати лог' },
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

const AutomationView: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>([]);

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
            <div className="absolute top-4 right-4 bg-tg-secondary-bg-hover p-2 rounded-lg text-tg-hint text-sm">
                Це прототип. Ноди поки що не виконують реальних дій.
            </div>
        </div>
    );
};

export default AutomationView;
