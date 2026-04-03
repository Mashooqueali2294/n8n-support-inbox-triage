import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

// ─────────────────────────────────────────────
//  Classification logic (exported for unit tests)
// ─────────────────────────────────────────────
export interface ClassificationResult {
  category: 'billing' | 'bug' | 'feature_request' | 'general';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  tags: string[];
}

const BILLING_KEYWORDS   = ['invoice', 'payment', 'charge', 'refund', 'billing', 'subscription', 'fee', 'overcharge', 'receipt', 'transaction', 'price', 'plan', 'paid'];
const BUG_KEYWORDS       = ['error', 'bug', 'crash', 'broken', 'not working', 'fail', 'exception', 'glitch', 'freeze', 'cannot', "can't", '500', '404', 'issue', 'wrong'];
const FEATURE_KEYWORDS   = ['feature', 'request', 'suggest', 'would like', 'enhance', 'improvement', 'add', 'wish', 'proposal', 'idea', 'implement', 'new feature'];
const HIGH_PRI_KEYWORDS  = ['urgent', 'critical', 'asap', 'immediately', 'emergency', 'cannot login', "can't access", 'data loss', 'production down', 'blocked', 'severe', 'outage'];
const MED_PRI_KEYWORDS   = ['problem', 'broken', 'not working', 'error', 'failing', 'wrong', 'incorrect', 'slow', 'delay'];

export function classifyTicket(
  subject: string,
  message: string,
  _source = ''
): ClassificationResult {
  const text = `${subject} ${message}`.toLowerCase();

  // ── Category ──────────────────────────────
  let category: ClassificationResult['category'] = 'general';
  let catKeyword = '';

  const checkCategory = (keywords: string[], cat: ClassificationResult['category']) => {
    if (category !== 'general') return;
    for (const kw of keywords) {
      if (text.includes(kw)) { category = cat; catKeyword = kw; break; }
    }
  };

  checkCategory(BILLING_KEYWORDS, 'billing');
  checkCategory(BUG_KEYWORDS, 'bug');
  checkCategory(FEATURE_KEYWORDS, 'feature_request');

  const catReason =
    catKeyword
      ? `Matched ${category} keyword: "${catKeyword}"`
      : 'No category keyword matched – defaulting to general';

  // ── Priority ──────────────────────────────
  let priority: ClassificationResult['priority'] = 'low';
  let priKeyword = '';

  for (const kw of HIGH_PRI_KEYWORDS) {
    if (text.includes(kw)) { priority = 'high'; priKeyword = kw; break; }
  }
  if (priority === 'low') {
    for (const kw of MED_PRI_KEYWORDS) {
      if (text.includes(kw)) { priority = 'medium'; priKeyword = kw; break; }
    }
  }

  const priReason =
    priKeyword
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
export class TicketClassifierNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Ticket Classifier',
    name: 'ticketClassifier',
    icon: 'fa:tags',
    group: ['transform'],
    version: 1,
    description:
      'Classifies a support ticket into category (billing | bug | feature_request | general) and priority (high | medium | low) using keyword rules.',
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const subject = (this.getNodeParameter('subject', i) as string).trim();
      const message = (this.getNodeParameter('message', i) as string).trim();
      const source  = (this.getNodeParameter('source',  i, '') as string).trim();

      if (!subject) {
        throw new NodeOperationError(this.getNode(), '"Subject" must not be empty.', { itemIndex: i });
      }
      if (!message) {
        throw new NodeOperationError(this.getNode(), '"Message" must not be empty.', { itemIndex: i });
      }

      const result = classifyTicket(subject, message, source);

      returnData.push({
        json: {
          ...items[i].json,
          category: result.category,
          priority: result.priority,
          reason:   result.reason,
          tags:     result.tags,
        },
      });
    }

    return [returnData];
  }
}
