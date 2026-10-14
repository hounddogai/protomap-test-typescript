/**
 * Runs the long-lived workflow that takes a question from start to finish.
 */

import * as surveysQuestionWorkflowServiceApi from "../../../../../.cache/proto/acme/surveys/v1/question_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { QuestionWorkflowWorkflow } from "./question-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for QuestionWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class QuestionWorkflowHandler {
  constructor(@inject(QuestionWorkflowWorkflow) private readonly workflow: QuestionWorkflowWorkflow) {}

  /**
   * Advances a question.
   */
  advanceQuestionWorkflow = unary<surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.AdvanceQuestionWorkflowResponse>(
    (request) => this.workflow.advanceQuestionWorkflow(request),
  );

  /**
   * Cancels a question.
   */
  cancelQuestionWorkflow = (call: ServerUnaryCall<surveysQuestionWorkflowServiceApi.CancelQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.CancelQuestionWorkflowResponse>, done: sendUnaryData<surveysQuestionWorkflowServiceApi.CancelQuestionWorkflowResponse>): void => {
    void this.workflow.cancelQuestionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a question.
   */
  inspectQuestionWorkflow = unary<surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowResponse>(
    (request) => this.workflow.inspectQuestionWorkflow(request),
  );

  /**
   * Lists questions a page at a time.
   */
  listQuestionWorkflows = unary<surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsRequest, surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsResponse>(
    (request) => this.workflow.listQuestionWorkflows(request),
  );

  /**
   * Pauses a question.
   */
  pauseQuestionWorkflow = (call: ServerUnaryCall<surveysQuestionWorkflowServiceApi.PauseQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.PauseQuestionWorkflowResponse>, done: sendUnaryData<surveysQuestionWorkflowServiceApi.PauseQuestionWorkflowResponse>): void => {
    void this.workflow.pauseQuestionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resumes a question.
   */
  resumeQuestionWorkflow = unary<surveysQuestionWorkflowServiceApi.ResumeQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.ResumeQuestionWorkflowResponse>(
    (request) => this.workflow.resumeQuestionWorkflow(request),
  );

  /**
   * Retrys a question.
   */
  retryQuestionWorkflow = unary<surveysQuestionWorkflowServiceApi.RetryQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.RetryQuestionWorkflowResponse>(
    (request) => this.workflow.retryQuestionWorkflow(request),
  );

  /**
   * Starts a question.
   */
  startQuestionWorkflow = (call: ServerUnaryCall<surveysQuestionWorkflowServiceApi.StartQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.StartQuestionWorkflowResponse>, done: sendUnaryData<surveysQuestionWorkflowServiceApi.StartQuestionWorkflowResponse>): void => {
    void this.workflow.startQuestionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: QuestionWorkflowHandler): surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceServer {
  return {
    advanceQuestionWorkflow: handler.advanceQuestionWorkflow,
    cancelQuestionWorkflow: handler.cancelQuestionWorkflow,
    inspectQuestionWorkflow: handler.inspectQuestionWorkflow,
    listQuestionWorkflows: handler.listQuestionWorkflows,
    pauseQuestionWorkflow: handler.pauseQuestionWorkflow,
    resumeQuestionWorkflow: handler.resumeQuestionWorkflow,
    retryQuestionWorkflow: handler.retryQuestionWorkflow,
    startQuestionWorkflow: handler.startQuestionWorkflow,
  };
}
