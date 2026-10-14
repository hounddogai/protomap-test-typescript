/**
 * Routes questions through approval, with escalation and delegation.
 */

import * as surveysQuestionApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/question_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { QuestionApprovalWorkflow } from "./question-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for QuestionApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class QuestionApprovalHandler {
  constructor(@inject(QuestionApprovalWorkflow) private readonly workflow: QuestionApprovalWorkflow) {}

  /**
   * Approves a question.
   */
  approveQuestion = unary<surveysQuestionApprovalServiceApi.ApproveQuestionRequest, surveysQuestionApprovalServiceApi.ApproveQuestionResponse>(
    (request) => this.workflow.approveQuestion(request),
  );

  /**
   * Comments a question.
   */
  commentQuestionApproval = (call: ServerUnaryCall<surveysQuestionApprovalServiceApi.CommentQuestionApprovalRequest, surveysQuestionApprovalServiceApi.CommentQuestionApprovalResponse>, done: sendUnaryData<surveysQuestionApprovalServiceApi.CommentQuestionApprovalResponse>): void => {
    void this.workflow.commentQuestionApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates a question.
   */
  delegateQuestionApproval = unary<surveysQuestionApprovalServiceApi.DelegateQuestionApprovalRequest, surveysQuestionApprovalServiceApi.DelegateQuestionApprovalResponse>(
    (request) => this.workflow.delegateQuestionApproval(request),
  );

  /**
   * Escalates a question.
   */
  escalateQuestion = unary<surveysQuestionApprovalServiceApi.EscalateQuestionRequest, surveysQuestionApprovalServiceApi.EscalateQuestionResponse>(
    (request) => this.workflow.escalateQuestion(request),
  );

  /**
   * Returns a question.
   */
  getQuestionApprovalStatus = (call: ServerUnaryCall<surveysQuestionApprovalServiceApi.GetQuestionApprovalStatusRequest, surveysQuestionApprovalServiceApi.GetQuestionApprovalStatusResponse>, done: sendUnaryData<surveysQuestionApprovalServiceApi.GetQuestionApprovalStatusResponse>): void => {
    void this.workflow.getQuestionApprovalStatus(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists questions a page at a time.
   */
  listPendingQuestions = unary<surveysQuestionApprovalServiceApi.ListPendingQuestionsRequest, surveysQuestionApprovalServiceApi.ListPendingQuestionsResponse>(
    (request) => this.workflow.listPendingQuestions(request),
  );

  /**
   * Recalls a question.
   */
  recallQuestion = unary<surveysQuestionApprovalServiceApi.RecallQuestionRequest, surveysQuestionApprovalServiceApi.RecallQuestionResponse>(
    (request) => this.workflow.recallQuestion(request),
  );

  /**
   * Rejects a question.
   */
  rejectQuestion = (call: ServerUnaryCall<surveysQuestionApprovalServiceApi.RejectQuestionRequest, surveysQuestionApprovalServiceApi.RejectQuestionResponse>, done: sendUnaryData<surveysQuestionApprovalServiceApi.RejectQuestionResponse>): void => {
    void this.workflow.rejectQuestion(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits a question.
   */
  submitQuestion = unary<surveysQuestionApprovalServiceApi.SubmitQuestionRequest, surveysQuestionApprovalServiceApi.SubmitQuestionResponse>(
    (request) => this.workflow.submitQuestion(request),
  );
}

export function implementation(handler: QuestionApprovalHandler): surveysQuestionApprovalServiceApi.QuestionApprovalServiceServer {
  return {
    approveQuestion: handler.approveQuestion,
    commentQuestionApproval: handler.commentQuestionApproval,
    delegateQuestionApproval: handler.delegateQuestionApproval,
    escalateQuestion: handler.escalateQuestion,
    getQuestionApprovalStatus: handler.getQuestionApprovalStatus,
    listPendingQuestions: handler.listPendingQuestions,
    recallQuestion: handler.recallQuestion,
    rejectQuestion: handler.rejectQuestion,
    submitQuestion: handler.submitQuestion,
  };
}
