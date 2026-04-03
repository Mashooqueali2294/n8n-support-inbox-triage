"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketClassifierNode = void 0;
exports.classifyTicket = classifyTicket;
const n8n_workflow_1 = require("n8n-workflow");
const BILLING_KEYWORDS = ['invoice', 'payment', 'charge', 'refund', 'billing', 'subscription', 'fee', 'overcharge', 'receipt', 'transaction', 'price', 'plan', 'paid'];
const BUG_KEYWORDS = ['error', 'bug', 'crash', 'broken', 'not working', 'fail', 'exception', 'glitch', 'freeze', 'cannot', "can't", '500', '404', 'issue', 'wrong'];
const FEATURE_KEYWORDS = ['feature', 'request', 'suggest', 'would like', 'enhance', 'improvement', 'add', 'wish', 'proposal', 'idea', 'implement', 'new feature'];
const HIGH_PRI_KEYWORDS = ['urgent', 'critical', 'asap', 'immediately', 'emergency', 'cannot login', "can't access", 'data loss', 'production down', 'blocked', 'severe', 'outage'];
const MED_PRI_KEYWORDS = ['problem', 'broken', 'not working', 'error', 'failing', 'wrong', 'incorrect', 'slow', 'delay'];
function classifyTicket(subject, message, _source = '') {
    const text = `${subject} ${message}`.toLowerCase();
    // ── Category ──────────────────────────────
    let category = 'general';
    let catKeyword = '';
    const checkCategory = (keywords, cat) => {
        if (category !== 'general')
            return;
        for (const kw of keywords) {
            if (text.includes(kw)) {
                category = cat;
                catKeyword = kw;
                break;
            }
        }
    };
    checkCategory(BILLING_KEYWORDS, 'billing');
    checkCategory(BUG_KEYWORDS, 'bug');
    checkCategory(FEATURE_KEYWORDS, 'feature_request');
    const catReason = catKeyword
        ? `Matched ${category} keyword: "${catKeyword}"`
        : 'No category keyword matched – defaulting to general';
    // ── Priority ──────────────────────────────
    let priority = 'low';
    let priKeyword = '';
    for (const kw of HIGH_PRI_KEYWORDS) {
        if (text.includes(kw)) {
            priority = 'high';
            priKeyword = kw;
            break;
        }
    }
    if (priority === 'low') {
        for (const kw of MED_PRI_KEYWORDS) {
            if (text.includes(kw)) {
                priority = 'medium';
                priKeyword = kw;
                break;
            }
        }
    }
    const priReason = priKeyword
        ? `Matched ${priority}-priority keyword: "${priKeyword}"`
        : 'No high/medium keyword – defaulting to low';
    // ── Tags ──────────────────────────────────
    const allKeywords = [...BILLING_KEYWORDS, ...BUG_KEYWORDS, ...FEATURE_KEYWORDS];
    const tags = [...new Set(allKeywords.filter(kw => text.includes(kw)))];
    return {
        category,
        priority,
        reason: `${catReason}. ${priReason}.`,
        tags,
    };
}
// ─────────────────────────────────────────────
//  n8n Node Definition
// ─────────────────────────────────────────────
class TicketClassifierNode {
    constructor() {
        this.description = {
            displayName: 'Ticket Classifier',
            name: 'ticketClassifier',
            icon: 'fa:tags',
            group: ['transform'],
            version: 1,
            description: 'Classifies a support ticket into category (billing | bug | feature_request | general) and priority (high | medium | low) using keyword rules.',
            defaults: { name: 'Ticket Classifier' },
            inputs: ['main'],
            outputs: ['main'],
            properties: [
                {
                    displayName: 'Subject',
                    name: 'subject',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'Ticket subject line. Supports n8n expressions, e.g. {{ $json.subject }}',
                    placeholder: '={{ $json.subject }}',
                },
                {
                    displayName: 'Message',
                    name: 'message',
                    type: 'string',
                    typeOptions: { rows: 4 },
                    default: '',
                    required: true,
                    description: 'Ticket message body. Supports n8n expressions.',
                    placeholder: '={{ $json.message }}',
                },
                {
                    displayName: 'Source (optional)',
                    name: 'source',
                    type: 'string',
                    default: '',
                    required: false,
                    description: 'Origin of the ticket: website, email, chat, etc.',
                    placeholder: '={{ $json.source }}',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const subject = this.getNodeParameter('subject', i).trim();
            const message = this.getNodeParameter('message', i).trim();
            const source = this.getNodeParameter('source', i, '').trim();
            if (!subject) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), '"Subject" must not be empty.', { itemIndex: i });
            }
            if (!message) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), '"Message" must not be empty.', { itemIndex: i });
            }
            const result = classifyTicket(subject, message, source);
            returnData.push({
                json: {
                    ...items[i].json,
                    category: result.category,
                    priority: result.priority,
                    reason: result.reason,
                    tags: result.tags,
                },
            });
        }
        return [returnData];
    }
}
exports.TicketClassifierNode = TicketClassifierNode;
//# sourceMappingURL=TicketClassifierNode.node.js.map