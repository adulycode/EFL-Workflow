// Integration bridge: Syncs EFL-Workflow activity to Central Pixel Agent Office
const AGENT_OFFICE_URL = process.env.AGENT_OFFICE_URL || 'http://localhost:3020';

interface AgentOfficeEvent {
  agentId: 'cloud' | 'tifa' | 'barret' | 'aerith' | 'red13' | 'yuffie';
  status?: 'IDLE' | 'CODING' | 'QA_TESTING' | 'PLANNING' | 'DONE';
  task?: string;
  projectId?: string;
  station?: string;
  tokens?: number;
  cost?: number;
}

export async function notifyAgentOffice(event: AgentOfficeEvent) {
  try {
    const payload = {
      projectId: 'efl-workflow',
      ...event
    };

    // Non-blocking fetch to avoid slowing down main Kanban response
    fetch(`${AGENT_OFFICE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Silently ignore if Agent Office hub is offline
    });
  } catch {
    // Ignore network errors gracefully
  }
}
