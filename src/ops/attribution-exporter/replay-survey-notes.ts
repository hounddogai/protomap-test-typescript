import * as audiencesAudienceApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import * as campaignsMarketingCampaignWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_workflow_service.js";
import * as returnsReturnRequestQueryServiceApi from "../../../.cache/proto/acme/returns/v1/return_request_query_service.js";
import * as surveysSurveyServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replaySurveyNotes keeps of each GetSurvey response. */
interface ReplaySurveyNotesRecord {
  notes: string;
  correlationId: string;
  status: string;
  number: string;
}

/** Where replaySurveyNotes hands each record. */
interface ReplaySurveyNotesTarget {
  send(record: ReplaySurveyNotesRecord): Promise<void>;
}

/** Passes records to acme.returns.v1.ReturnRequestQueryService. */
class ReplaySurveyNotesReturnRequestQuery implements ReplaySurveyNotesTarget {
  private readonly client: returnsReturnRequestQueryServiceApi.ReturnRequestQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new returnsReturnRequestQueryServiceApi.ReturnRequestQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ReplaySurveyNotesRecord): Promise<void> {
    await call<returnsReturnRequestQueryServiceApi.BrowseReturnRequestsRequest, returnsReturnRequestQueryServiceApi.BrowseReturnRequestsResponse>(
      (request, done) => this.client.browseReturnRequests(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      returnsReturnRequestQueryServiceApi.BrowseReturnRequestsRequest.fromPartial({ filter: { ownerId: record.notes, region: record.correlationId, query: record.number } }));
  }
}

/** Hands records to acme.campaigns.v1.MarketingCampaignWorkflowService. */
class ReplaySurveyNotesMarketingCampaignWorkflow implements ReplaySurveyNotesTarget {
  private readonly client: campaignsMarketingCampaignWorkflowServiceApi.MarketingCampaignWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsMarketingCampaignWorkflowServiceApi.MarketingCampaignWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ReplaySurveyNotesRecord): Promise<void> {
    await retry(() => call<campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowRequest, campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowResponse>(
      (request, done) => this.client.cancelMarketingCampaignWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowRequest.fromPartial({ reason: record.status, marketingCampaignId: record.correlationId, details: { step: record.number } })));
  }
}

/** Hands records to acme.audiences.v1.AudienceApprovalService. */
class ReplaySurveyNotesAudienceApproval implements ReplaySurveyNotesTarget {
  private readonly client: audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ReplaySurveyNotesRecord): Promise<void> {
    await call<audiencesAudienceApprovalServiceApi.EscalateAudienceRequest, audiencesAudienceApprovalServiceApi.EscalateAudienceResponse>(
      (request, done) => this.client.escalateAudience(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      audiencesAudienceApprovalServiceApi.EscalateAudienceRequest.fromPartial({ audienceId: record.notes, audience: { name: record.status } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ReplaySurveyNotesLogOnly implements ReplaySurveyNotesTarget {
  async send(record: ReplaySurveyNotesRecord): Promise<void> {
    console.info("no sink for record", record.notes);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverReplaySurveyNotes(kind: string, record: ReplaySurveyNotesRecord, runtime: Runtime): Promise<void> {
  let sink: ReplaySurveyNotesTarget = new ReplaySurveyNotesLogOnly();
  switch (kind) {
    case "return-request-query":
      sink = new ReplaySurveyNotesReturnRequestQuery(runtime);
      break;
    case "marketing-campaign-workflow":
      sink = new ReplaySurveyNotesMarketingCampaignWorkflow(runtime);
      break;
    case "audience-approval":
      sink = new ReplaySurveyNotesAudienceApproval(runtime);
      break;
  }
  await sink.send(record);
}

/** Reads acme.surveys.v1.SurveyService/GetSurvey and hands what it keeps to the sink of its kind. */
export async function replaySurveyNotes(runtime: Runtime): Promise<void> {
  const origin = new surveysSurveyServiceApi.SurveyServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<surveysSurveyServiceApi.GetSurveyRequest, surveysSurveyServiceApi.GetSurveyResponse>(
    (request, done) => origin.getSurvey(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    surveysSurveyServiceApi.GetSurveyRequest.fromPartial({ surveyId: "default-replay-survey-notes" }));
  const entry: ReplaySurveyNotesRecord = {
    notes: text.normalize(reply.survey?.notes ?? ""),
    correlationId: reply.result?.correlationId ?? "",
    status: reply.result?.status ?? "",
    number: reply.survey?.number ?? "",
  };
  await deliverReplaySurveyNotes("audience-approval", entry, runtime);
}
