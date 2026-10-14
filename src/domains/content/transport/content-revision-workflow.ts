/**
 * Runs the long-lived workflow that takes a content revision from start to finish.
 */

import * as contentContentRevisionWorkflowServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ContentRevisionWorkflowWorkflow } from "../application/content-revision-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ContentRevisionWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ContentRevisionWorkflowHandler {
  constructor(@inject(ContentRevisionWorkflowWorkflow) private readonly workflow: ContentRevisionWorkflowWorkflow) {}

  /**
   * Advances a content revision.
   */
  advanceContentRevisionWorkflow = (call: ServerUnaryCall<contentContentRevisionWorkflowServiceApi.AdvanceContentRevisionWorkflowRequest, contentContentRevisionWorkflowServiceApi.AdvanceContentRevisionWorkflowResponse>, done: sendUnaryData<contentContentRevisionWorkflowServiceApi.AdvanceContentRevisionWorkflowResponse>): void => {
    void this.workflow.advanceContentRevisionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a content revision.
   */
  cancelContentRevisionWorkflow = unary<contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowRequest, contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowResponse>(
    (request) => this.workflow.cancelContentRevisionWorkflow(request),
  );

  /**
   * Lists content revisions a page at a time.
   */
  listContentRevisionWorkflows = unary<contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsRequest, contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsResponse>(
    (request) => this.workflow.listContentRevisionWorkflows(request),
  );

  /**
   * Pauses a content revision.
   */
  pauseContentRevisionWorkflow = (call: ServerUnaryCall<contentContentRevisionWorkflowServiceApi.PauseContentRevisionWorkflowRequest, contentContentRevisionWorkflowServiceApi.PauseContentRevisionWorkflowResponse>, done: sendUnaryData<contentContentRevisionWorkflowServiceApi.PauseContentRevisionWorkflowResponse>): void => {
    void this.workflow.pauseContentRevisionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resumes a content revision.
   */
  resumeContentRevisionWorkflow = unary<contentContentRevisionWorkflowServiceApi.ResumeContentRevisionWorkflowRequest, contentContentRevisionWorkflowServiceApi.ResumeContentRevisionWorkflowResponse>(
    (request) => this.workflow.resumeContentRevisionWorkflow(request),
  );

  /**
   * Signals a content revision.
   */
  signalContentRevisionWorkflow = unary<contentContentRevisionWorkflowServiceApi.SignalContentRevisionWorkflowRequest, contentContentRevisionWorkflowServiceApi.SignalContentRevisionWorkflowResponse>(
    (request) => this.workflow.signalContentRevisionWorkflow(request),
  );

  /**
   * Starts a content revision.
   */
  startContentRevisionWorkflow = (call: ServerUnaryCall<contentContentRevisionWorkflowServiceApi.StartContentRevisionWorkflowRequest, contentContentRevisionWorkflowServiceApi.StartContentRevisionWorkflowResponse>, done: sendUnaryData<contentContentRevisionWorkflowServiceApi.StartContentRevisionWorkflowResponse>): void => {
    void this.workflow.startContentRevisionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ContentRevisionWorkflowHandler): contentContentRevisionWorkflowServiceApi.ContentRevisionWorkflowServiceServer {
  return {
    advanceContentRevisionWorkflow: handler.advanceContentRevisionWorkflow,
    cancelContentRevisionWorkflow: handler.cancelContentRevisionWorkflow,
    listContentRevisionWorkflows: handler.listContentRevisionWorkflows,
    pauseContentRevisionWorkflow: handler.pauseContentRevisionWorkflow,
    resumeContentRevisionWorkflow: handler.resumeContentRevisionWorkflow,
    signalContentRevisionWorkflow: handler.signalContentRevisionWorkflow,
    startContentRevisionWorkflow: handler.startContentRevisionWorkflow,
  };
}
