import * as customersHouseholdQueryServiceApi from "../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as experimentsVariantSyncServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushSurveyResponseKind keeps of each PreviewSurveyResponse response. */
interface PushSurveyResponseKindRecord {
  kind: string;
  status: string;
}

/** Where pushSurveyResponseKind hands each record. */
interface PushSurveyResponseKindTarget {
  send(record: PushSurveyResponseKindRecord): Promise<void>;
}

/** Passes records to acme.experiments.v1.VariantSyncService. */
class PushSurveyResponseKindVariantSync implements PushSurveyResponseKindTarget {
  private readonly client: experimentsVariantSyncServiceApi.VariantSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantSyncServiceApi.VariantSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushSurveyResponseKindRecord): Promise<void> {
    await call<experimentsVariantSyncServiceApi.PullVariantsRequest, experimentsVariantSyncServiceApi.PullVariantsResponse>(
      (request, done) => this.client.pullVariants(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      experimentsVariantSyncServiceApi.PullVariantsRequest.fromPartial({ details: { checksum: record.status, peerRegion: record.kind } }));
  }
}

/** Sends records to acme.customers.v1.HouseholdQueryService. */
class PushSurveyResponseKindHouseholdQuery implements PushSurveyResponseKindTarget {
  private readonly client: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersHouseholdQueryServiceApi.HouseholdQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushSurveyResponseKindRecord): Promise<void> {
    await call<customersHouseholdQueryServiceApi.BrowseHouseholdsRequest, customersHouseholdQueryServiceApi.BrowseHouseholdsResponse>(
      (request, done) => this.client.browseHouseholds(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      customersHouseholdQueryServiceApi.BrowseHouseholdsRequest.fromPartial({ page: { pageToken: record.kind } }));
  }
}

/** Writes records to acme.personalization.v1.RecommendationValidationService. */
class PushSurveyResponseKindRecommendationValidation implements PushSurveyResponseKindTarget {
  private readonly client: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushSurveyResponseKindRecord): Promise<void> {
    await call<personalizationRecommendationValidationServiceApi.ValidateRecommendationRequest, personalizationRecommendationValidationServiceApi.ValidateRecommendationResponse>(
      (request, done) => this.client.validateRecommendation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      personalizationRecommendationValidationServiceApi.ValidateRecommendationRequest.fromPartial({ recommendation: { notes: record.status } }));
  }
}

/**
 * Reads acme.surveys.v1.SurveyResponseValidationService/PreviewSurveyResponse and hands what it keeps to the
 * sink of its kind.
 */
export async function pushSurveyResponseKind(runtime: Runtime): Promise<void> {
  const reader = new surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest, surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseResponse>(
    (request, done) => reader.previewSurveyResponse(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    surveysSurveyResponseValidationServiceApi.PreviewSurveyResponseRequest.fromPartial({ reason: "primary-push-survey-response-kind" })));
  const kept: PushSurveyResponseKindRecord = {
    kind: reply.surveyResponse?.kind ?? "",
    status: text.normalize(reply.outcome?.status ?? ""),
  };
  const registry: Record<string, PushSurveyResponseKindTarget> = {};
  for (const entry of [
    { kind: "variant-sync", sink: new PushSurveyResponseKindVariantSync(runtime) },
    { kind: "household-query", sink: new PushSurveyResponseKindHouseholdQuery(runtime) },
    { kind: "recommendation-validation", sink: new PushSurveyResponseKindRecommendationValidation(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["variant-sync"]!.send(kept);
}
