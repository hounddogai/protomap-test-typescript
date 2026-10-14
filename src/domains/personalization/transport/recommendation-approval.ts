/**
 * Routes recommendations through approval, with escalation and delegation.
 */

import * as personalizationRecommendationApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { RecommendationApprovalWorkflow } from "../application/recommendation-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for RecommendationApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class RecommendationApprovalHandler {
  constructor(@inject(RecommendationApprovalWorkflow) private readonly workflow: RecommendationApprovalWorkflow) {}

  /**
   * Approves a recommendation.
   */
  approveRecommendation = (call: ServerUnaryCall<personalizationRecommendationApprovalServiceApi.ApproveRecommendationRequest, personalizationRecommendationApprovalServiceApi.ApproveRecommendationResponse>, done: sendUnaryData<personalizationRecommendationApprovalServiceApi.ApproveRecommendationResponse>): void => {
    void this.workflow.approveRecommendation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a recommendation.
   */
  commentRecommendationApproval = unary<personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalRequest, personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalResponse>(
    (request) => this.workflow.commentRecommendationApproval(request),
  );

  /**
   * Escalates a recommendation.
   */
  escalateRecommendation = unary<personalizationRecommendationApprovalServiceApi.EscalateRecommendationRequest, personalizationRecommendationApprovalServiceApi.EscalateRecommendationResponse>(
    (request) => this.workflow.escalateRecommendation(request),
  );

  /**
   * Returns a recommendation.
   */
  getRecommendationApprovalStatus = (call: ServerUnaryCall<personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusRequest, personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusResponse>, done: sendUnaryData<personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusResponse>): void => {
    void this.workflow.getRecommendationApprovalStatus(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a recommendation.
   */
  recallRecommendation = unary<personalizationRecommendationApprovalServiceApi.RecallRecommendationRequest, personalizationRecommendationApprovalServiceApi.RecallRecommendationResponse>(
    (request) => this.workflow.recallRecommendation(request),
  );

  /**
   * Rejects a recommendation.
   */
  rejectRecommendation = unary<personalizationRecommendationApprovalServiceApi.RejectRecommendationRequest, personalizationRecommendationApprovalServiceApi.RejectRecommendationResponse>(
    (request) => this.workflow.rejectRecommendation(request),
  );

  /**
   * Submits a recommendation.
   */
  submitRecommendation = (call: ServerUnaryCall<personalizationRecommendationApprovalServiceApi.SubmitRecommendationRequest, personalizationRecommendationApprovalServiceApi.SubmitRecommendationResponse>, done: sendUnaryData<personalizationRecommendationApprovalServiceApi.SubmitRecommendationResponse>): void => {
    void this.workflow.submitRecommendation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: RecommendationApprovalHandler): personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceServer {
  return {
    approveRecommendation: handler.approveRecommendation,
    commentRecommendationApproval: handler.commentRecommendationApproval,
    escalateRecommendation: handler.escalateRecommendation,
    getRecommendationApprovalStatus: handler.getRecommendationApprovalStatus,
    recallRecommendation: handler.recallRecommendation,
    rejectRecommendation: handler.rejectRecommendation,
    submitRecommendation: handler.submitRecommendation,
  };
}
