import * as auditAuditEventQueryServiceApi from "../../../.cache/proto/acme/audit/v1/audit_event_query_service.js";
import * as campaignsCampaignAssetApprovalServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_asset_approval_service.js";
import * as corporateeventsCorporateEventQueryServiceApi from "../../../.cache/proto/acme/corporateevents/v1/corporate_event_query_service.js";
import * as experimentsExperimentLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_lifecycle_service.js";
import * as identityUserQueryServiceApi from "../../../.cache/proto/acme/identity/v1/user_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushExperimentStatus keeps of each SuspendExperiment response. */
interface PushExperimentStatusRecord {
  status: string;
  outcomeStatus: string;
}

/** Where pushExperimentStatus hands each record. */
interface PushExperimentStatusSink {
  send(record: PushExperimentStatusRecord): Promise<void>;
}

/** Writes records to acme.corporateevents.v1.CorporateEventQueryService. */
class PushExperimentStatusCorporateEventQuery implements PushExperimentStatusSink {
  private readonly client: corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushExperimentStatusRecord): Promise<void> {
    await call<corporateeventsCorporateEventQueryServiceApi.SuggestCorporateEventsRequest, corporateeventsCorporateEventQueryServiceApi.SuggestCorporateEventsResponse>(
      (request, done) => this.client.suggestCorporateEvents(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      corporateeventsCorporateEventQueryServiceApi.SuggestCorporateEventsRequest.fromPartial({ page: { pageToken: record.outcomeStatus } }));
  }
}

/** Sends records to acme.identity.v1.UserQueryService. */
class PushExperimentStatusUserQuery implements PushExperimentStatusSink {
  private readonly client: identityUserQueryServiceApi.UserQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new identityUserQueryServiceApi.UserQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushExperimentStatusRecord): Promise<void> {
    await call<identityUserQueryServiceApi.SuggestUsersRequest, identityUserQueryServiceApi.SuggestUsersResponse>(
      (request, done) => this.client.suggestUsers(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      identityUserQueryServiceApi.SuggestUsersRequest.fromPartial({ filter: { query: record.status } }));
  }
}

/** Passes records to acme.campaigns.v1.CampaignAssetApprovalService. */
class PushExperimentStatusCampaignAssetApproval implements PushExperimentStatusSink {
  private readonly client: campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushExperimentStatusRecord): Promise<void> {
    await call<campaignsCampaignAssetApprovalServiceApi.SubmitCampaignAssetRequest, campaignsCampaignAssetApprovalServiceApi.SubmitCampaignAssetResponse>(
      (request, done) => this.client.submitCampaignAsset(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      campaignsCampaignAssetApprovalServiceApi.SubmitCampaignAssetRequest.fromPartial({ campaignAsset: { name: record.status, code: record.outcomeStatus } }));
  }
}

/** Hands records to acme.audit.v1.AuditEventQueryService. */
class PushExperimentStatusAuditEventQuery implements PushExperimentStatusSink {
  private readonly client: auditAuditEventQueryServiceApi.AuditEventQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new auditAuditEventQueryServiceApi.AuditEventQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushExperimentStatusRecord): Promise<void> {
    await call<auditAuditEventQueryServiceApi.BrowseAuditEventsRequest, auditAuditEventQueryServiceApi.BrowseAuditEventsResponse>(
      (request, done) => this.client.browseAuditEvents(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      auditAuditEventQueryServiceApi.BrowseAuditEventsRequest.fromPartial({ orderBy: record.status }));
  }
}

/** Only logs, for kinds no service takes yet. */
class PushExperimentStatusLogOnly implements PushExperimentStatusSink {
  async send(record: PushExperimentStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverPushExperimentStatus(kind: string, record: PushExperimentStatusRecord, runtime: Runtime): Promise<void> {
  let sink: PushExperimentStatusSink = new PushExperimentStatusLogOnly();
  switch (kind) {
    case "corporate-event-query":
      sink = new PushExperimentStatusCorporateEventQuery(runtime);
      break;
    case "user-query":
      sink = new PushExperimentStatusUserQuery(runtime);
      break;
    case "campaign-asset-approval":
      sink = new PushExperimentStatusCampaignAssetApproval(runtime);
      break;
    case "audit-event-query":
      sink = new PushExperimentStatusAuditEventQuery(runtime);
      break;
  }
  await sink.send(record);
}

/**
 * Reads acme.experiments.v1.ExperimentLifecycleService/SuspendExperiment and hands what it keeps to the sink
 * of its kind.
 */
export async function pushExperimentStatus(runtime: Runtime): Promise<void> {
  const source = new experimentsExperimentLifecycleServiceApi.ExperimentLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<experimentsExperimentLifecycleServiceApi.SuspendExperimentRequest, experimentsExperimentLifecycleServiceApi.SuspendExperimentResponse>(
    (request, done) => source.suspendExperiment(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    experimentsExperimentLifecycleServiceApi.SuspendExperimentRequest.fromPartial({ reason: "nightly-push-experiment-status" })));
  const kept: PushExperimentStatusRecord = {
    status: reply.result?.status ?? "",
    outcomeStatus: text.normalize(reply.outcome?.status ?? ""),
  };
  await deliverPushExperimentStatus("user-query", kept, runtime);
}
