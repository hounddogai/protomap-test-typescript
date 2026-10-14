import * as chatHandoffWorkflowServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_workflow_service.js";
import * as identityUserValidationServiceApi from "../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyHandoffWorkflowStatus keeps of each SignalHandoffWorkflow response. */
interface CopyHandoffWorkflowStatusRecord {
  status: string;
  message: string;
  handoffId: string;
  resultStatus: string;
}

/** Where copyHandoffWorkflowStatus hands each record. */
interface CopyHandoffWorkflowStatusWriter {
  deliver(record: CopyHandoffWorkflowStatusRecord): Promise<void>;
}

/** Hands records to acme.identity.v1.UserValidationService. */
class CopyHandoffWorkflowStatusUserValidation implements CopyHandoffWorkflowStatusWriter {
  private readonly client: identityUserValidationServiceApi.UserValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new identityUserValidationServiceApi.UserValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyHandoffWorkflowStatusRecord): Promise<void> {
    await call<identityUserValidationServiceApi.ExplainUserDecisionRequest, identityUserValidationServiceApi.ExplainUserDecisionResponse>(
      (request, done) => this.client.explainUserDecision(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      identityUserValidationServiceApi.ExplainUserDecisionRequest.fromPartial({ user: { userId: record.resultStatus } }));
  }
}

/** Passes records to acme.personalization.v1.RecommendationWorkflowService. */
class CopyHandoffWorkflowStatusRecommendationWorkflow implements CopyHandoffWorkflowStatusWriter {
  private readonly client: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyHandoffWorkflowStatusRecord): Promise<void> {
    await call<personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowResponse>(
      (request, done) => this.client.cancelRecommendationWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowRequest.fromPartial({ recommendation: { notes: record.handoffId, number: record.message } }));
  }
}

/**
 * Reads acme.chat.v1.HandoffWorkflowService/SignalHandoffWorkflow and hands what it keeps to the sink of its
 * kind.
 */
export async function copyHandoffWorkflowStatus(runtime: Runtime): Promise<void> {
  const origin = new chatHandoffWorkflowServiceApi.HandoffWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<chatHandoffWorkflowServiceApi.SignalHandoffWorkflowRequest, chatHandoffWorkflowServiceApi.SignalHandoffWorkflowResponse>(
    (request, done) => origin.signalHandoffWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    chatHandoffWorkflowServiceApi.SignalHandoffWorkflowRequest.fromPartial({ handoffId: "main-copy-handoff-workflow-status" })));
  const record: CopyHandoffWorkflowStatusRecord = {
    status: response.outcome?.status ?? "",
    message: response.outcome?.message ?? "",
    handoffId: text.normalize(response.handoff?.handoffId ?? ""),
    resultStatus: response.result?.status ?? "",
  };
  const sinks = new Map<string, CopyHandoffWorkflowStatusWriter>();
  sinks.set("user-validation", new CopyHandoffWorkflowStatusUserValidation(runtime));
  sinks.set("recommendation-workflow", new CopyHandoffWorkflowStatusRecommendationWorkflow(runtime));
  await sinks.get("recommendation-workflow")!.deliver(record);
}
