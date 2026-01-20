import { Incident, LiveUpdate, ChatMessage } from '../types';

// Example questions users can ask the AI:
// - "Show me all critical incidents"
// - "What patterns do you see?"
// - "Tell me about database issues"
// - "How can I resolve these incidents?"
// - "What's happening with the mobile app?"

export const mockIncidents: Incident[] = [
  {
    id: 'INC-2026-001',
    title: 'Database Connection Timeout',
    description: 'Multiple reports of database connection timeouts affecting the authentication service. Users are unable to log in.',
    severity: 'critical',
    status: 'investigating',
    location: 'us-east-1',
    createdAt: new Date('2026-01-08T09:15:00'),
    updatedAt: new Date('2026-01-08T10:30:00'),
    timeline: [
      {
        id: 't1',
        timestamp: new Date('2026-01-08T09:15:00'),
        event: 'Incident created',
        user: 'System Monitor'
      },
      {
        id: 't2',
        timestamp: new Date('2026-01-08T09:45:00'),
        event: 'Escalated to critical',
        user: 'Sarah Chen'
      },
      {
        id: 't3',
        timestamp: new Date('2026-01-08T10:30:00'),
        event: 'Investigation started',
        user: 'DevOps Team'
      }
    ],
    aiInsights: [
      'Similar pattern detected in INC-2026-945 (2 days ago)',
      'Peak traffic period correlation: 85%',
      'Suggested action: Scale database read replicas'
    ]
  },
  {
    id: 'INC-2026-002',
    title: 'API Rate Limit Exceeded',
    description: 'Third-party payment API returning 429 errors. Affecting checkout process.',
    severity: 'high',
    status: 'active',
    location: 'eu-west-2',
    createdAt: new Date('2026-01-08T08:00:00'),
    updatedAt: new Date('2026-01-08T09:00:00'),
    timeline: [
      {
        id: 't4',
        timestamp: new Date('2026-01-08T08:00:00'),
        event: 'Incident created',
        user: 'System Monitor'
      },
      {
        id: 't5',
        timestamp: new Date('2026-01-08T09:00:00'),
        event: 'Acknowledged by team',
        user: 'Mike Johnson'
      }
    ],
    aiInsights: [
      'Rate limit threshold reached at 10,000 requests/hour',
      'Recommended: Implement request queuing',
      'Alternative provider available with 2x limit'
    ]
  },
  {
    id: 'INC-2026-003',
    title: 'CDN Cache Miss Rate Spike',
    description: 'Unusual increase in cache miss rate from 5% to 45%. Performance degradation observed.',
    severity: 'medium',
    status: 'investigating',
    location: 'global',
    createdAt: new Date('2026-01-08T07:30:00'),
    updatedAt: new Date('2026-01-08T08:15:00'),
    timeline: [
      {
        id: 't6',
        timestamp: new Date('2026-01-08T07:30:00'),
        event: 'Incident created',
        user: 'System Monitor'
      },
      {
        id: 't7',
        timestamp: new Date('2026-01-08T08:15:00'),
        event: 'Root cause analysis initiated',
        user: 'Infrastructure Team'
      }
    ],
    aiInsights: [
      'Cache configuration change detected 2 hours ago',
      'Performance impact: +320ms average load time',
      'Suggested: Rollback to previous cache rules'
    ]
  },
  {
    id: 'INC-2026-004',
    title: 'Disk Space Warning',
    description: 'Server logs partition reaching 85% capacity on production servers.',
    severity: 'medium',
    status: 'active',
    location: 'us-west-1',
    createdAt: new Date('2026-01-08T06:00:00'),
    updatedAt: new Date('2026-01-08T06:00:00'),
    timeline: [
      {
        id: 't8',
        timestamp: new Date('2026-01-08T06:00:00'),
        event: 'Incident created',
        user: 'System Monitor'
      }
    ],
    aiInsights: [
      'Current growth rate: 5GB/day',
      'Estimated time to 95%: 3 days',
      'Automated log rotation recommended'
    ]
  },
  {
    id: 'INC-2026-005',
    title: 'Elevated Error Rate on Mobile App',
    description: 'iOS app reporting 3x normal error rate. Crash reports increasing.',
    severity: 'high',
    status: 'active',
    location: 'app-ios-v2.4.1',
    createdAt: new Date('2026-01-08T05:45:00'),
    updatedAt: new Date('2026-01-08T07:20:00'),
    timeline: [
      {
        id: 't9',
        timestamp: new Date('2026-01-08T05:45:00'),
        event: 'Incident created',
        user: 'System Monitor'
      },
      {
        id: 't10',
        timestamp: new Date('2026-01-08T07:20:00'),
        event: 'Mobile team notified',
        user: 'Alert System'
      }
    ],
    aiInsights: [
      'Correlation with iOS 18.2 update',
      'Specific devices: iPhone 14 Pro, 15 Pro',
      'Similar issue resolved in v2.3.8 - review fix'
    ]
  },
  {
    id: 'INC-2026-006',
    title: 'Slow Query Performance',
    description: 'Analytics dashboard queries running 5x slower than baseline.',
    severity: 'low',
    status: 'active',
    location: 'analytics-db',
    createdAt: new Date('2026-01-08T04:00:00'),
    updatedAt: new Date('2026-01-08T04:00:00'),
    timeline: [
      {
        id: 't11',
        timestamp: new Date('2026-01-08T04:00:00'),
        event: 'Incident created',
        user: 'System Monitor'
      }
    ],
    aiInsights: [
      'Missing index on user_events table',
      'Query optimizer suggesting index on timestamp column',
      'Low user impact: Only affects internal dashboards'
    ]
  },
  {
    id: 'INC-2026-007',
    title: 'Email Delivery Delays',
    description: 'Notification emails experiencing 10-15 minute delays.',
    severity: 'low',
    status: 'investigating',
    location: 'email-service',
    createdAt: new Date('2026-01-08T03:30:00'),
    updatedAt: new Date('2026-01-08T05:00:00'),
    timeline: [
      {
        id: 't12',
        timestamp: new Date('2026-01-08T03:30:00'),
        event: 'Incident created',
        user: 'System Monitor'
      },
      {
        id: 't13',
        timestamp: new Date('2026-01-08T05:00:00'),
        event: 'Email service team assigned',
        user: 'Auto-Assignment'
      }
    ],
    aiInsights: [
      'Queue backlog: 12,000 messages',
      'Processing rate below normal by 40%',
      'Recommended: Add worker instances'
    ]
  }
];

export const mockLiveUpdates: LiveUpdate[] = [
  {
    id: 'lu1',
    incidentId: 'INC-2026-001',
    message: 'Database connection pool increased to 200',
    timestamp: new Date('2026-01-08T10:30:00'),
    type: 'status_change'
  },
  {
    id: 'lu2',
    incidentId: 'INC-2026-005',
    message: 'Mobile team investigating iOS 18.2 compatibility',
    timestamp: new Date('2026-01-08T10:15:00'),
    type: 'status_change'
  },
  {
    id: 'lu3',
    incidentId: 'INC-2026-002',
    message: 'Payment API vendor contacted',
    timestamp: new Date('2026-01-08T10:00:00'),
    type: 'escalated'
  }
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'c1',
    sender: 'ai',
    message: 'Hello! I\'m your AI Incident Assistant. I can help you analyze incidents, find patterns, and suggest resolutions. Try asking me about current critical incidents or patterns you should be aware of.',
    timestamp: new Date('2026-01-08T09:00:00'),
    incidentRefs: []
  }
];

// AI responses for demo purposes
export const getAIResponse = (userMessage: string): ChatMessage => {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('critical') || lowerMessage.includes('urgent')) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      message: 'Currently tracking 1 critical incident: **INC-2026-001** (Database Connection Timeout). This incident shows similar patterns to INC-2026-945 from 2 days ago. I recommend scaling database read replicas immediately. The incident is affecting the authentication service in us-east-1 region.',
      timestamp: new Date(),
      incidentRefs: ['INC-2026-001']
    };
  }
  
  if (lowerMessage.includes('pattern') || lowerMessage.includes('trend')) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      message: 'I\'ve identified a concerning pattern: Database-related incidents have increased 40% this week. Two incidents (**INC-2026-001** and **INC-2026-006**) suggest infrastructure scaling issues. Additionally, there\'s a correlation between iOS app errors (**INC-2026-005**) and the recent iOS 18.2 update.',
      timestamp: new Date(),
      incidentRefs: ['INC-2026-001', 'INC-2026-005', 'INC-2026-006']
    };
  }
  
  if (lowerMessage.includes('database') || lowerMessage.includes('db')) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      message: 'There are 2 database-related incidents:\n\n**INC-2026-001** (Critical): Connection timeouts - Currently investigating. Recommend scaling read replicas.\n\n**INC-2026-006** (Low): Slow query performance - Missing index detected on user_events table.\n\nBoth suggest we should review our database capacity planning.',
      timestamp: new Date(),
      incidentRefs: ['INC-2026-001', 'INC-2026-006']
    };
  }
  
  if (lowerMessage.includes('resolve') || lowerMessage.includes('fix')) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      message: 'Based on historical data and current incidents, here are my recommendations:\n\n1. **INC-2026-001**: Scale database read replicas (85% confidence this will resolve)\n2. **INC-2026-002**: Implement request queuing system\n3. **INC-2026-003**: Rollback CDN cache configuration from 2 hours ago\n\nWould you like detailed steps for any of these?',
      timestamp: new Date(),
      incidentRefs: ['INC-2026-001', 'INC-2026-002', 'INC-2026-003']
    };
  }
  
  if (lowerMessage.includes('mobile') || lowerMessage.includes('ios') || lowerMessage.includes('app')) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      message: '**INC-2026-005** shows elevated error rates on iOS app version 2.4.1. The issue correlates with iOS 18.2 update and specifically affects iPhone 14 Pro and 15 Pro models. A similar issue was resolved in v2.3.8 - I recommend reviewing that fix and preparing a hotfix release.',
      timestamp: new Date(),
      incidentRefs: ['INC-2026-005']
    };
  }
  
  // Default response
  return {
    id: `ai-${Date.now()}`,
    sender: 'ai',
    message: 'I can help you with:\n• Analyzing current incidents and their severity\n• Identifying patterns and trends\n• Suggesting resolutions based on historical data\n• Providing insights about specific incidents\n\nCurrently monitoring **7 active incidents** with **1 critical** that needs immediate attention. What would you like to know?',
    timestamp: new Date(),
    incidentRefs: []
  };
};