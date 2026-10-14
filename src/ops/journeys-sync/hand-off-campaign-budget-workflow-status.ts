import * as auditAuditEventServiceApi from "../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as campaignsCampaignBudgetWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_workflow_service.js";
import * as webbffClientSessionQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffCampaignBudgetWorkflowStatus keeps of each PauseCampaignBudgetWorkflow response. */
interface HandOffCampaignBudgetWorkflowStatusRecord {
  status: string;
  message: string;
}

/** Where handOffCampaignBudgetWorkflowStatus hands each record. */
interface HandOffCampaignBudgetWorkflowStatusTarget {
  apply(record: HandOffCampaignBudgetWorkflowStatusRecord): Promise<void>;
}

/** Hands records to acme.webbff.v1.ClientSessionQueryService. */
class HandOffCampaignBudgetWorkflowStatusClientSessionQuery implements HandOffCampaignBudgetWorkflowStatusTarget {
  private readonly client: webbffClientSessionQueryServiceApi.ClientSessionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffClientSessionQueryServiceApi.ClientSessionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: HandOffCampaignBudgetWorkflowStatusRecord): Promise<void> {
    await call<webbffClientSessionQueryServiceApi.SummarizeClientSessionsRequest, webbffClientSessionQueryServiceApi.SummarizeClientSessionsResponse>(
      (request, done) => this.client.summarizeClientSessions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webbffClientSessionQueryServiceApi.SummarizeClientSessionsRequest.fromPartial({ details: { cron: record.message }, reason: record.status }));
  }
}

/** Writes records to acme.audit.v1.AuditEventService. */
class HandOffCampaignBudgetWorkflowStatusAuditEvent implements HandOffCampaignBudgetWorkflowStatusTarget {
  private readonly client: auditAuditEventServiceApi.AuditEventServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new auditAuditEventServiceApi.AuditEventServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: HandOffCampaignBudgetWorkflowStatusRecord): Promise<void> {
    await call<auditAuditEventServiceApi.GetAuditEventRequest, auditAuditEventServiceApi.GetAuditEventResponse>(
      (request, done) => this.client.getAuditEvent(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      auditAuditEventServiceApi.GetAuditEventRequest.fromPartial({ auditEventId: record.status }));
  }
}

/**
 * Reads acme.campaigns.v1.CampaignBudgetWorkflowService/PauseCampaignBudgetWorkflow and hands what it keeps
 * to the sink of its kind.
 */
export async function handOffCampaignBudgetWorkflowStatus(runtime: Runtime): Promise<void> {
  const origin = new campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowResponse>(
    (request, done) => origin.pauseCampaignBudgetWorkflow(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowRequest.fromPartial({ reason: "nightly-hand-off-campaign-budget-workflow-status" }));
  const entry: HandOffCampaignBudgetWorkflowStatusRecord = {
    status: reply.outcome?.status ?? "",
    message: text.normalize(reply.outcome?.message ?? ""),
  };
  const entries: Array<{ kind: string; sink: HandOffCampaignBudgetWorkflowStatusTarget }> = [
    { kind: "client-session-query", sink: new HandOffCampaignBudgetWorkflowStatusClientSessionQuery(runtime) },
    { kind: "audit-event", sink: new HandOffCampaignBudgetWorkflowStatusAuditEvent(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "audit-event") continue;
    await entry.sink.apply(entry);
  }
}
