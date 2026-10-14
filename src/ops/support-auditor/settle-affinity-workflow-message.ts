import * as personalizationAffinityWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_workflow_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleAffinityWorkflowMessage keeps of each StartAffinityWorkflow response. */
interface SettleAffinityWorkflowMessageRecord {
  message: string;
  affinityId: string;
  status: string;
  resultStatus: string;
}

/** Where settleAffinityWorkflowMessage hands each record. */
interface SettleAffinityWorkflowMessageDestination {
  apply(record: SettleAffinityWorkflowMessageRecord): Promise<void>;
}

/** Passes records to acme.personalization.v1.RecommendationCalculationService. */
class SettleAffinityWorkflowMessageRecommendationCalculation implements SettleAffinityWorkflowMessageDestination {
  private readonly client: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SettleAffinityWorkflowMessageRecord): Promise<void> {
    await call<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse>(
      (request, done) => this.client.estimateRecommendation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.fromPartial({ details: { currencyCode: record.affinityId }, recommendation: { recommendationId: record.message }, recommendationId: record.resultStatus }));
  }
}

/**
 * Reads acme.personalization.v1.AffinityWorkflowService/StartAffinityWorkflow and hands what it keeps to
 * acme.personalization.v1.RecommendationCalculationService.
 */
export async function settleAffinityWorkflowMessage(runtime: Runtime): Promise<void> {
  const reader = new personalizationAffinityWorkflowServiceApi.AffinityWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<personalizationAffinityWorkflowServiceApi.StartAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.StartAffinityWorkflowResponse>(
    (request, done) => reader.startAffinityWorkflow(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    personalizationAffinityWorkflowServiceApi.StartAffinityWorkflowRequest.fromPartial({ reason: "primary-settle-affinity-workflow-message" }));
  const row: SettleAffinityWorkflowMessageRecord = {
    message: text.normalize(current.outcome?.message ?? ""),
    affinityId: text.normalize(current.affinity?.affinityId ?? ""),
    status: current.outcome?.status ?? "",
    resultStatus: current.result?.status ?? "",
  };
  await new SettleAffinityWorkflowMessageRecommendationCalculation(runtime).apply(row);
}
