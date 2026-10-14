import * as audiencesAudienceSyncApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_approval_service.js";
import * as authorizationAccessPolicyValidationServiceApi from "../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as corporateeventsCorporateEventQueryServiceApi from "../../../.cache/proto/acme/corporateevents/v1/corporate_event_query_service.js";
import * as messagingParticipantReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_reporting_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushAccessPolicyId keeps of each ValidateAccessPolicy response. */
interface PushAccessPolicyIdRecord {
  correlationId: string;
  referenceId: string;
  status: string;
}

/** Where pushAccessPolicyId hands each record. */
interface PushAccessPolicyIdDestination {
  push(record: PushAccessPolicyIdRecord): Promise<void>;
}

/** Writes records to acme.corporateevents.v1.CorporateEventQueryService. */
class PushAccessPolicyIdCorporateEventQuery implements PushAccessPolicyIdDestination {
  private readonly client: corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushAccessPolicyIdRecord): Promise<void> {
    await retry(() => call<corporateeventsCorporateEventQueryServiceApi.BrowseCorporateEventsRequest, corporateeventsCorporateEventQueryServiceApi.BrowseCorporateEventsResponse>(
      (request, done) => this.client.browseCorporateEvents(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      corporateeventsCorporateEventQueryServiceApi.BrowseCorporateEventsRequest.fromPartial({ filter: { ownerId: record.status }, orderBy: record.correlationId })));
  }
}

/** Writes records to acme.audiences.v1.AudienceSyncApprovalService. */
class PushAccessPolicyIdAudienceSyncApproval implements PushAccessPolicyIdDestination {
  private readonly client: audiencesAudienceSyncApprovalServiceApi.AudienceSyncApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceSyncApprovalServiceApi.AudienceSyncApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushAccessPolicyIdRecord): Promise<void> {
    await call<audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncRequest, audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncResponse>(
      (request, done) => this.client.rejectAudienceSync(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncRequest.fromPartial({ details: { comment: record.referenceId } }));
  }
}

/** Hands records to acme.surveys.v1.SurveyResponseApprovalService. */
class PushAccessPolicyIdSurveyResponseApproval implements PushAccessPolicyIdDestination {
  private readonly client: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushAccessPolicyIdRecord): Promise<void> {
    await retry(() => call<surveysSurveyResponseApprovalServiceApi.GetSurveyResponseApprovalStatusRequest, surveysSurveyResponseApprovalServiceApi.GetSurveyResponseApprovalStatusResponse>(
      (request, done) => this.client.getSurveyResponseApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      surveysSurveyResponseApprovalServiceApi.GetSurveyResponseApprovalStatusRequest.fromPartial({ surveyResponseId: record.correlationId })));
  }
}

/** Hands records to acme.messaging.v1.ParticipantReportingService. */
class PushAccessPolicyIdParticipantReporting implements PushAccessPolicyIdDestination {
  private readonly client: messagingParticipantReportingServiceApi.ParticipantReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingParticipantReportingServiceApi.ParticipantReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushAccessPolicyIdRecord): Promise<void> {
    await call<messagingParticipantReportingServiceApi.CountParticipantTotalsRequest, messagingParticipantReportingServiceApi.CountParticipantTotalsResponse>(
      (request, done) => this.client.countParticipantTotals(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingParticipantReportingServiceApi.CountParticipantTotalsRequest.fromPartial({ filter: { region: record.status, ownerId: record.correlationId }, page: { pageToken: record.referenceId } }));
  }
}

/** Runs the action registered for kind. */
async function actOnPushAccessPolicyId(kind: string, record: PushAccessPolicyIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "corporate-event-query": () => new PushAccessPolicyIdCorporateEventQuery(runtime).push(record),
    "audience-sync-approval": () => new PushAccessPolicyIdAudienceSyncApproval(runtime).push(record),
    "survey-response-approval": () => new PushAccessPolicyIdSurveyResponseApproval(runtime).push(record),
    "participant-reporting": () => new PushAccessPolicyIdParticipantReporting(runtime).push(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.authorization.v1.AccessPolicyValidationService/ValidateAccessPolicy and hands what it keeps to
 * the sink of its kind.
 */
export async function pushAccessPolicyId(runtime: Runtime): Promise<void> {
  const source = new authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<authorizationAccessPolicyValidationServiceApi.ValidateAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ValidateAccessPolicyResponse>(
    (request, done) => source.validateAccessPolicy(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    authorizationAccessPolicyValidationServiceApi.ValidateAccessPolicyRequest.fromPartial({ accessPolicyId: "default-push-access-policy-id" }));
  const record: PushAccessPolicyIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    referenceId: found.outcome?.referenceId ?? "",
    status: found.outcome?.status ?? "",
  };
  await actOnPushAccessPolicyId("participant-reporting", record, runtime);
}
