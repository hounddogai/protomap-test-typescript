/**
 * Runs the long-lived workflow that takes an article from start to finish.
 */

import * as contentArticleWorkflowServiceApi from "../../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ArticleWorkflowWorkflow } from "../application/article-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ArticleWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ArticleWorkflowHandler {
  constructor(@inject(ArticleWorkflowWorkflow) private readonly workflow: ArticleWorkflowWorkflow) {}

  /**
   * Advances an article.
   */
  advanceArticleWorkflow = (call: ServerUnaryCall<contentArticleWorkflowServiceApi.AdvanceArticleWorkflowRequest, contentArticleWorkflowServiceApi.AdvanceArticleWorkflowResponse>, done: sendUnaryData<contentArticleWorkflowServiceApi.AdvanceArticleWorkflowResponse>): void => {
    void this.workflow.advanceArticleWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels an article.
   */
  cancelArticleWorkflow = unary<contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest, contentArticleWorkflowServiceApi.CancelArticleWorkflowResponse>(
    (request) => this.workflow.cancelArticleWorkflow(request),
  );

  /**
   * Returns an article.
   */
  inspectArticleWorkflow = unary<contentArticleWorkflowServiceApi.InspectArticleWorkflowRequest, contentArticleWorkflowServiceApi.InspectArticleWorkflowResponse>(
    (request) => this.workflow.inspectArticleWorkflow(request),
  );

  /**
   * Lists articles a page at a time.
   */
  listArticleWorkflows = (call: ServerUnaryCall<contentArticleWorkflowServiceApi.ListArticleWorkflowsRequest, contentArticleWorkflowServiceApi.ListArticleWorkflowsResponse>, done: sendUnaryData<contentArticleWorkflowServiceApi.ListArticleWorkflowsResponse>): void => {
    void this.workflow.listArticleWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses an article.
   */
  pauseArticleWorkflow = unary<contentArticleWorkflowServiceApi.PauseArticleWorkflowRequest, contentArticleWorkflowServiceApi.PauseArticleWorkflowResponse>(
    (request) => this.workflow.pauseArticleWorkflow(request),
  );

  /**
   * Resumes an article.
   */
  resumeArticleWorkflow = unary<contentArticleWorkflowServiceApi.ResumeArticleWorkflowRequest, contentArticleWorkflowServiceApi.ResumeArticleWorkflowResponse>(
    (request) => this.workflow.resumeArticleWorkflow(request),
  );

  /**
   * Retrys an article.
   */
  retryArticleWorkflow = (call: ServerUnaryCall<contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest, contentArticleWorkflowServiceApi.RetryArticleWorkflowResponse>, done: sendUnaryData<contentArticleWorkflowServiceApi.RetryArticleWorkflowResponse>): void => {
    void this.workflow.retryArticleWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals an article.
   */
  signalArticleWorkflow = unary<contentArticleWorkflowServiceApi.SignalArticleWorkflowRequest, contentArticleWorkflowServiceApi.SignalArticleWorkflowResponse>(
    (request) => this.workflow.signalArticleWorkflow(request),
  );

  /**
   * Starts an article.
   */
  startArticleWorkflow = unary<contentArticleWorkflowServiceApi.StartArticleWorkflowRequest, contentArticleWorkflowServiceApi.StartArticleWorkflowResponse>(
    (request) => this.workflow.startArticleWorkflow(request),
  );
}

export function implementation(handler: ArticleWorkflowHandler): contentArticleWorkflowServiceApi.ArticleWorkflowServiceServer {
  return {
    advanceArticleWorkflow: handler.advanceArticleWorkflow,
    cancelArticleWorkflow: handler.cancelArticleWorkflow,
    inspectArticleWorkflow: handler.inspectArticleWorkflow,
    listArticleWorkflows: handler.listArticleWorkflows,
    pauseArticleWorkflow: handler.pauseArticleWorkflow,
    resumeArticleWorkflow: handler.resumeArticleWorkflow,
    retryArticleWorkflow: handler.retryArticleWorkflow,
    signalArticleWorkflow: handler.signalArticleWorkflow,
    startArticleWorkflow: handler.startArticleWorkflow,
  };
}
