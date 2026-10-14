import * as audiencesAudienceValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as featurestoreFeatureViewQueryServiceApi from "../../../.cache/proto/acme/featurestore/v1/feature_view_query_service.js";
import * as insurancePolicyServiceApi from "../../../.cache/proto/acme/insurance/v1/policy_service.js";
import * as messagingParticipantLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayParticipantId keeps of each ReinstateParticipant response. */
interface ReplayParticipantIdRecord {
  referenceId: string;
  status: string;
  message: string;
  participantId: string;
}

/** Where replayParticipantId hands each record. */
interface ReplayParticipantIdWriter {
  push(record: ReplayParticipantIdRecord): Promise<void>;
}

/** Hands records to acme.audiences.v1.AudienceValidationService. */
class ReplayParticipantIdAudienceValidation implements ReplayParticipantIdWriter {
  private readonly client: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceValidationServiceApi.AudienceValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayParticipantIdRecord): Promise<void> {
    await call<audiencesAudienceValidationServiceApi.GetAudienceRulesRequest, audiencesAudienceValidationServiceApi.GetAudienceRulesResponse>(
      (request, done) => this.client.getAudienceRules(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceValidationServiceApi.GetAudienceRulesRequest.fromPartial({ audienceId: record.referenceId }));
  }
}

/** Sends records to acme.insurance.v1.PolicyService. */
class ReplayParticipantIdPolicy implements ReplayParticipantIdWriter {
  private readonly client: insurancePolicyServiceApi.PolicyServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new insurancePolicyServiceApi.PolicyServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayParticipantIdRecord): Promise<void> {
    await call<insurancePolicyServiceApi.SearchPoliciesRequest, insurancePolicyServiceApi.SearchPoliciesResponse>(
      (request, done) => this.client.searchPolicies(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      insurancePolicyServiceApi.SearchPoliciesRequest.fromPartial({ orderBy: record.message, page: { pageToken: record.participantId }, filter: { region: record.referenceId } }));
  }
}

/** Passes records to acme.featurestore.v1.FeatureViewQueryService. */
class ReplayParticipantIdFeatureViewQuery implements ReplayParticipantIdWriter {
  private readonly client: featurestoreFeatureViewQueryServiceApi.FeatureViewQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featurestoreFeatureViewQueryServiceApi.FeatureViewQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayParticipantIdRecord): Promise<void> {
    await retry(() => call<featurestoreFeatureViewQueryServiceApi.SuggestFeatureViewsRequest, featurestoreFeatureViewQueryServiceApi.SuggestFeatureViewsResponse>(
      (request, done) => this.client.suggestFeatureViews(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      featurestoreFeatureViewQueryServiceApi.SuggestFeatureViewsRequest.fromPartial({ filter: { query: record.message, region: record.referenceId }, page: { pageToken: record.status } })));
  }
}

/**
 * Reads acme.messaging.v1.ParticipantLifecycleService/ReinstateParticipant and hands what it keeps to the
 * sink of its kind.
 */
export async function replayParticipantId(runtime: Runtime): Promise<void> {
  const reader = new messagingParticipantLifecycleServiceApi.ParticipantLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<messagingParticipantLifecycleServiceApi.ReinstateParticipantRequest, messagingParticipantLifecycleServiceApi.ReinstateParticipantResponse>(
    (request, done) => reader.reinstateParticipant(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    messagingParticipantLifecycleServiceApi.ReinstateParticipantRequest.fromPartial({ participantId: "default-replay-participant-id" }));
  const entry: ReplayParticipantIdRecord = {
    referenceId: current.outcome?.referenceId ?? "",
    status: current.outcome?.status ?? "",
    message: current.outcome?.message ?? "",
    participantId: current.participant?.participantId ?? "",
  };
  const sinks: ReplayParticipantIdWriter[] = [
    new ReplayParticipantIdAudienceValidation(runtime),
    new ReplayParticipantIdPolicy(runtime),
    new ReplayParticipantIdFeatureViewQuery(runtime),
  ];
  await sinks[2]!.push(entry);
}
