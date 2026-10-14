/**
 * Routes surveys through approval, with escalation and delegation.
 */

import * as surveysSurveyApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { SurveyApprovalWorkflow } from "../application/survey-approval.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for SurveyApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class SurveyApprovalHandler {
  constructor(@inject(SurveyApprovalWorkflow) private readonly workflow: SurveyApprovalWorkflow) {}

  /**
   * Approves a survey.
   */
  approveSurvey = (call: ServerUnaryCall<surveysSurveyApprovalServiceApi.ApproveSurveyRequest, surveysSurveyApprovalServiceApi.ApproveSurveyResponse>, done: sendUnaryData<surveysSurveyApprovalServiceApi.ApproveSurveyResponse>): void => {
    void this.workflow.approveSurvey(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Comments a survey.
   */
  commentSurveyApproval = unary<surveysSurveyApprovalServiceApi.CommentSurveyApprovalRequest, surveysSurveyApprovalServiceApi.CommentSurveyApprovalResponse>(
    (request) => this.workflow.commentSurveyApproval(request),
  );

  /**
   * Delegates a survey.
   */
  delegateSurveyApproval = unary<surveysSurveyApprovalServiceApi.DelegateSurveyApprovalRequest, surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse>(
    (request) => this.workflow.delegateSurveyApproval(request),
  );

  /**
   * Escalates a survey.
   */
  escalateSurvey = (call: ServerUnaryCall<surveysSurveyApprovalServiceApi.EscalateSurveyRequest, surveysSurveyApprovalServiceApi.EscalateSurveyResponse>, done: sendUnaryData<surveysSurveyApprovalServiceApi.EscalateSurveyResponse>): void => {
    void this.workflow.escalateSurvey(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a survey.
   */
  getSurveyApprovalStatus = unary<surveysSurveyApprovalServiceApi.GetSurveyApprovalStatusRequest, surveysSurveyApprovalServiceApi.GetSurveyApprovalStatusResponse>(
    (request) => this.workflow.getSurveyApprovalStatus(request),
  );

  /**
   * Lists surveys a page at a time.
   */
  listPendingSurveys = unary<surveysSurveyApprovalServiceApi.ListPendingSurveysRequest, surveysSurveyApprovalServiceApi.ListPendingSurveysResponse>(
    (request) => this.workflow.listPendingSurveys(request),
  );

  /**
   * Recalls a survey.
   */
  recallSurvey = (call: ServerUnaryCall<surveysSurveyApprovalServiceApi.RecallSurveyRequest, surveysSurveyApprovalServiceApi.RecallSurveyResponse>, done: sendUnaryData<surveysSurveyApprovalServiceApi.RecallSurveyResponse>): void => {
    void this.workflow.recallSurvey(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects a survey.
   */
  rejectSurvey = unary<surveysSurveyApprovalServiceApi.RejectSurveyRequest, surveysSurveyApprovalServiceApi.RejectSurveyResponse>(
    (request) => this.workflow.rejectSurvey(request),
  );

  /**
   * Submits a survey.
   */
  submitSurvey = unary<surveysSurveyApprovalServiceApi.SubmitSurveyRequest, surveysSurveyApprovalServiceApi.SubmitSurveyResponse>(
    (request) => this.workflow.submitSurvey(request),
  );
}

export function implementation(handler: SurveyApprovalHandler): surveysSurveyApprovalServiceApi.SurveyApprovalServiceServer {
  return {
    approveSurvey: handler.approveSurvey,
    commentSurveyApproval: handler.commentSurveyApproval,
    delegateSurveyApproval: handler.delegateSurveyApproval,
    escalateSurvey: handler.escalateSurvey,
    getSurveyApprovalStatus: handler.getSurveyApprovalStatus,
    listPendingSurveys: handler.listPendingSurveys,
    recallSurvey: handler.recallSurvey,
    rejectSurvey: handler.rejectSurvey,
    submitSurvey: handler.submitSurvey,
  };
}
