import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export interface ClassificationResult {
    category: 'billing' | 'bug' | 'feature_request' | 'general';
    priority: 'high' | 'medium' | 'low';
    reason: string;
    tags: string[];
}
export declare function classifyTicket(subject: string, message: string, _source?: string): ClassificationResult;
export declare class TicketClassifierNode implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
//# sourceMappingURL=TicketClassifierNode.node.d.ts.map