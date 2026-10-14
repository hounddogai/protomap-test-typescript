import * as personalizationRecommendationWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import * as surveysQuestionApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/question_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffRecommendationWorkflowId keeps of each AdvanceRecommendationWorkflow response. */
interface HandOffRecommendationWorkflowIdRecord {
  referenceId: string;
  message: string;
  status: string;
}

/**
 * Reads acme.personalization.v1.RecommendationWorkflowService/AdvanceRecommendationWorkflow, keeps its fields
 * by name, and passes some of them to acme.surveys.v1.QuestionApprovalService.
 */
export async function handOffRecommendationWorkflowId(runtime: Runtime): Promise<void> {
  const origin = new personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowResponse>(
    (request, done) => origin.advanceRecommendationWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowRequest.fromPartial({ recommendationId: "primary-hand-off-recommendation-workflow-id" }));
  const entry: HandOffRecommendationWorkflowIdRecord = {
    referenceId: response.outcome?.referenceId ?? "",
    message: response.result?.message ?? "",
    status: text.normalize(response.result?.status ?? ""),
  };
  const fields = new Headers();
  fields.set("x-reference-id", entry.referenceId);
  fields.set("x-message", entry.message);
  fields.set("x-status", entry.status);
  const writer = new surveysQuestionApprovalServiceApi.QuestionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  await call<surveysQuestionApprovalServiceApi.ApproveQuestionRequest, surveysQuestionApprovalServiceApi.ApproveQuestionResponse>(
    (request, done) => writer.approveQuestion(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    surveysQuestionApprovalServiceApi.ApproveQuestionRequest.fromPartial({ question: { name: fields.get("x-reference-id") ?? "" }, details: { comment: fields.get("x-status") ?? "" } }));
}
