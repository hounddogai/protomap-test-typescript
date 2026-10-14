import * as mediaRenditionReportingServiceApi from "../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateRenditionReportId keeps of each ShareRenditionReport response. */
interface PropagateRenditionReportIdRecord {
  correlationId: string;
  message: string;
  name: string;
}

/** Where propagateRenditionReportId hands each record. */
interface PropagateRenditionReportIdDestination {
  apply(record: PropagateRenditionReportIdRecord): Promise<void>;
}

/** Writes records to acme.personalization.v1.RecommendationValidationService. */
class PropagateRenditionReportIdRecommendationValidation implements PropagateRenditionReportIdDestination {
  private readonly client: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateRenditionReportIdRecord): Promise<void> {
    await call<personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest, personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse>(
      (request, done) => this.client.explainRecommendationDecision(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest.fromPartial({ recommendationId: record.name, recommendation: { recommendationId: record.message }, reason: record.correlationId }));
  }
}

/** Sends records to acme.personalization.v1.RecommendationWorkflowService. */
class PropagateRenditionReportIdRecommendationWorkflow implements PropagateRenditionReportIdDestination {
  private readonly client: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateRenditionReportIdRecord): Promise<void> {
    await retry(() => call<personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowResponse>(
      (request, done) => this.client.startRecommendationWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowRequest.fromPartial({ details: { step: record.message }, recommendation: { recommendationId: record.name } })));
  }
}

/**
 * Reads acme.media.v1.RenditionReportingService/ShareRenditionReport and hands what it keeps to the sink of
 * its kind.
 */
export async function propagateRenditionReportId(runtime: Runtime): Promise<void> {
  const reader = new mediaRenditionReportingServiceApi.RenditionReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<mediaRenditionReportingServiceApi.ShareRenditionReportRequest, mediaRenditionReportingServiceApi.ShareRenditionReportResponse>(
    (request, done) => reader.shareRenditionReport(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    mediaRenditionReportingServiceApi.ShareRenditionReportRequest.fromPartial({ reason: "main-propagate-rendition-report-id" })));
  const kept: PropagateRenditionReportIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    message: found.outcome?.message ?? "",
    name: found.rendition?.name ?? "",
  };
  const entries: Array<{ kind: string; sink: PropagateRenditionReportIdDestination }> = [
    { kind: "recommendation-validation", sink: new PropagateRenditionReportIdRecommendationValidation(runtime) },
    { kind: "recommendation-workflow", sink: new PropagateRenditionReportIdRecommendationWorkflow(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "recommendation-workflow") continue;
    await entry.sink.apply(kept);
  }
}
