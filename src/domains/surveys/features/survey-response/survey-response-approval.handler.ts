/**
 * Routes survey responses through approval, with escalation and delegation.
 */

import * as surveysSurveyResponseApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { SurveyResponseApprovalWorkflow } from "./survey-response-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for SurveyResponseApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class SurveyResponseApprovalHandler {
  constructor(@inject(SurveyResponseApprovalWorkflow) private readonly workflow: SurveyResponseApprovalWorkflow) {}

  /**
   * Approves a survey response.
   */
  approveSurveyResponse = unary<surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.ApproveSurveyResponseResponse>(
    (request) => this.workflow.approveSurveyResponse(request),
  );

  /**
   * Comments a survey response.
   */
  commentSurveyResponseApproval = (call: ServerUnaryCall<surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalRequest, surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse>, done: sendUnaryData<surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse>): void => {
    void this.workflow.commentSurveyResponseApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates a survey response.
   */
  delegateSurveyResponseApproval = unary<surveysSurveyResponseApprovalServiceApi.DelegateSurveyResponseApprovalRequest, surveysSurveyResponseApprovalServiceApi.DelegateSurveyResponseApprovalResponse>(
    (request) => this.workflow.delegateSurveyResponseApproval(request),
  );

  /**
   * Returns a survey response.
   */
  getSurveyResponseApprovalStatus = unary<surveysSurveyResponseApprovalServiceApi.GetSurveyResponseApprovalStatusRequest, surveysSurveyResponseApprovalServiceApi.GetSurveyResponseApprovalStatusResponse>(
    (request) => this.workflow.getSurveyResponseApprovalStatus(request),
  );

  /**
   * Lists survey responses a page at a time.
   */
  listPendingSurveyResponses = (call: ServerUnaryCall<surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesRequest, surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesResponse>, done: sendUnaryData<surveysSurveyResponseApprovalServiceApi.ListPendingSurveyResponsesResponse>): void => {
    void this.workflow.listPendingSurveyResponses(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a survey response.
   */
  recallSurveyResponse = unary<surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse>(
    (request) => this.workflow.recallSurveyResponse(request),
  );

  /**
   * Rejects a survey response.
   */
  rejectSurveyResponse = unary<surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse>(
    (request) => this.workflow.rejectSurveyResponse(request),
  );

  /**
   * Submits a survey response.
   */
  submitSurveyResponse = (call: ServerUnaryCall<surveysSurveyResponseApprovalServiceApi.SubmitSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.SubmitSurveyResponseResponse>, done: sendUnaryData<surveysSurveyResponseApprovalServiceApi.SubmitSurveyResponseResponse>): void => {
    void this.workflow.submitSurveyResponse(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: SurveyResponseApprovalHandler): surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceServer {
  return {
    approveSurveyResponse: handler.approveSurveyResponse,
    commentSurveyResponseApproval: handler.commentSurveyResponseApproval,
    delegateSurveyResponseApproval: handler.delegateSurveyResponseApproval,
    getSurveyResponseApprovalStatus: handler.getSurveyResponseApprovalStatus,
    listPendingSurveyResponses: handler.listPendingSurveyResponses,
    recallSurveyResponse: handler.recallSurveyResponse,
    rejectSurveyResponse: handler.rejectSurveyResponse,
    submitSurveyResponse: handler.submitSurveyResponse,
  };
}
