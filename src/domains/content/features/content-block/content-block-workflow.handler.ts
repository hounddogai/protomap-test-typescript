/**
 * Runs the long-lived workflow that takes a content block from start to finish.
 */

import * as contentContentBlockWorkflowServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ContentBlockWorkflowWorkflow } from "./content-block-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ContentBlockWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ContentBlockWorkflowHandler {
  constructor(@inject(ContentBlockWorkflowWorkflow) private readonly workflow: ContentBlockWorkflowWorkflow) {}

  /**
   * Advances a content block.
   */
  advanceContentBlockWorkflow = unary<contentContentBlockWorkflowServiceApi.AdvanceContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.AdvanceContentBlockWorkflowResponse>(
    (request) => this.workflow.advanceContentBlockWorkflow(request),
  );

  /**
   * Cancels a content block.
   */
  cancelContentBlockWorkflow = (call: ServerUnaryCall<contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowResponse>, done: sendUnaryData<contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowResponse>): void => {
    void this.workflow.cancelContentBlockWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists content blocks a page at a time.
   */
  listContentBlockWorkflows = unary<contentContentBlockWorkflowServiceApi.ListContentBlockWorkflowsRequest, contentContentBlockWorkflowServiceApi.ListContentBlockWorkflowsResponse>(
    (request) => this.workflow.listContentBlockWorkflows(request),
  );

  /**
   * Resumes a content block.
   */
  resumeContentBlockWorkflow = unary<contentContentBlockWorkflowServiceApi.ResumeContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.ResumeContentBlockWorkflowResponse>(
    (request) => this.workflow.resumeContentBlockWorkflow(request),
  );

  /**
   * Retrys a content block.
   */
  retryContentBlockWorkflow = (call: ServerUnaryCall<contentContentBlockWorkflowServiceApi.RetryContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.RetryContentBlockWorkflowResponse>, done: sendUnaryData<contentContentBlockWorkflowServiceApi.RetryContentBlockWorkflowResponse>): void => {
    void this.workflow.retryContentBlockWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts a content block.
   */
  startContentBlockWorkflow = unary<contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowResponse>(
    (request) => this.workflow.startContentBlockWorkflow(request),
  );
}

export function implementation(handler: ContentBlockWorkflowHandler): contentContentBlockWorkflowServiceApi.ContentBlockWorkflowServiceServer {
  return {
    advanceContentBlockWorkflow: handler.advanceContentBlockWorkflow,
    cancelContentBlockWorkflow: handler.cancelContentBlockWorkflow,
    listContentBlockWorkflows: handler.listContentBlockWorkflows,
    resumeContentBlockWorkflow: handler.resumeContentBlockWorkflow,
    retryContentBlockWorkflow: handler.retryContentBlockWorkflow,
    startContentBlockWorkflow: handler.startContentBlockWorkflow,
  };
}
