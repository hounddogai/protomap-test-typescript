/**
 * Runs the long-lived workflow that takes a conversation from start to finish.
 */

import * as messagingConversationWorkflowServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ConversationWorkflowWorkflow } from "../application/conversation-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ConversationWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ConversationWorkflowHandler {
  constructor(@inject(ConversationWorkflowWorkflow) private readonly workflow: ConversationWorkflowWorkflow) {}

  /**
   * Advances a conversation.
   */
  advanceConversationWorkflow = (call: ServerUnaryCall<messagingConversationWorkflowServiceApi.AdvanceConversationWorkflowRequest, messagingConversationWorkflowServiceApi.AdvanceConversationWorkflowResponse>, done: sendUnaryData<messagingConversationWorkflowServiceApi.AdvanceConversationWorkflowResponse>): void => {
    void this.workflow.advanceConversationWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a conversation.
   */
  cancelConversationWorkflow = unary<messagingConversationWorkflowServiceApi.CancelConversationWorkflowRequest, messagingConversationWorkflowServiceApi.CancelConversationWorkflowResponse>(
    (request) => this.workflow.cancelConversationWorkflow(request),
  );

  /**
   * Returns a conversation.
   */
  inspectConversationWorkflow = unary<messagingConversationWorkflowServiceApi.InspectConversationWorkflowRequest, messagingConversationWorkflowServiceApi.InspectConversationWorkflowResponse>(
    (request) => this.workflow.inspectConversationWorkflow(request),
  );

  /**
   * Pauses a conversation.
   */
  pauseConversationWorkflow = (call: ServerUnaryCall<messagingConversationWorkflowServiceApi.PauseConversationWorkflowRequest, messagingConversationWorkflowServiceApi.PauseConversationWorkflowResponse>, done: sendUnaryData<messagingConversationWorkflowServiceApi.PauseConversationWorkflowResponse>): void => {
    void this.workflow.pauseConversationWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resumes a conversation.
   */
  resumeConversationWorkflow = unary<messagingConversationWorkflowServiceApi.ResumeConversationWorkflowRequest, messagingConversationWorkflowServiceApi.ResumeConversationWorkflowResponse>(
    (request) => this.workflow.resumeConversationWorkflow(request),
  );

  /**
   * Retrys a conversation.
   */
  retryConversationWorkflow = unary<messagingConversationWorkflowServiceApi.RetryConversationWorkflowRequest, messagingConversationWorkflowServiceApi.RetryConversationWorkflowResponse>(
    (request) => this.workflow.retryConversationWorkflow(request),
  );

  /**
   * Starts a conversation.
   */
  startConversationWorkflow = (call: ServerUnaryCall<messagingConversationWorkflowServiceApi.StartConversationWorkflowRequest, messagingConversationWorkflowServiceApi.StartConversationWorkflowResponse>, done: sendUnaryData<messagingConversationWorkflowServiceApi.StartConversationWorkflowResponse>): void => {
    void this.workflow.startConversationWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ConversationWorkflowHandler): messagingConversationWorkflowServiceApi.ConversationWorkflowServiceServer {
  return {
    advanceConversationWorkflow: handler.advanceConversationWorkflow,
    cancelConversationWorkflow: handler.cancelConversationWorkflow,
    inspectConversationWorkflow: handler.inspectConversationWorkflow,
    pauseConversationWorkflow: handler.pauseConversationWorkflow,
    resumeConversationWorkflow: handler.resumeConversationWorkflow,
    retryConversationWorkflow: handler.retryConversationWorkflow,
    startConversationWorkflow: handler.startConversationWorkflow,
  };
}
