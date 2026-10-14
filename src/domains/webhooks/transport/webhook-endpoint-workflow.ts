/**
 * Runs the long-lived workflow that takes a webhook endpoint from start to finish.
 */

import * as webhooksWebhookEndpointWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { WebhookEndpointWorkflowWorkflow } from "../application/webhook-endpoint-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WebhookEndpointWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookEndpointWorkflowHandler {
  constructor(@inject(WebhookEndpointWorkflowWorkflow) private readonly workflow: WebhookEndpointWorkflowWorkflow) {}

  /**
   * Advances a webhook endpoint.
   */
  advanceWebhookEndpointWorkflow = (call: ServerUnaryCall<webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowResponse>, done: sendUnaryData<webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowResponse>): void => {
    void this.workflow.advanceWebhookEndpointWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a webhook endpoint.
   */
  cancelWebhookEndpointWorkflow = unary<webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowResponse>(
    (request) => this.workflow.cancelWebhookEndpointWorkflow(request),
  );

  /**
   * Returns a webhook endpoint.
   */
  inspectWebhookEndpointWorkflow = unary<webhooksWebhookEndpointWorkflowServiceApi.InspectWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.InspectWebhookEndpointWorkflowResponse>(
    (request) => this.workflow.inspectWebhookEndpointWorkflow(request),
  );

  /**
   * Lists webhook endpoints a page at a time.
   */
  listWebhookEndpointWorkflows = (call: ServerUnaryCall<webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsRequest, webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsResponse>, done: sendUnaryData<webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsResponse>): void => {
    void this.workflow.listWebhookEndpointWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a webhook endpoint.
   */
  pauseWebhookEndpointWorkflow = unary<webhooksWebhookEndpointWorkflowServiceApi.PauseWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.PauseWebhookEndpointWorkflowResponse>(
    (request) => this.workflow.pauseWebhookEndpointWorkflow(request),
  );

  /**
   * Resumes a webhook endpoint.
   */
  resumeWebhookEndpointWorkflow = unary<webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowResponse>(
    (request) => this.workflow.resumeWebhookEndpointWorkflow(request),
  );

  /**
   * Retrys a webhook endpoint.
   */
  retryWebhookEndpointWorkflow = (call: ServerUnaryCall<webhooksWebhookEndpointWorkflowServiceApi.RetryWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.RetryWebhookEndpointWorkflowResponse>, done: sendUnaryData<webhooksWebhookEndpointWorkflowServiceApi.RetryWebhookEndpointWorkflowResponse>): void => {
    void this.workflow.retryWebhookEndpointWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a webhook endpoint.
   */
  signalWebhookEndpointWorkflow = unary<webhooksWebhookEndpointWorkflowServiceApi.SignalWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.SignalWebhookEndpointWorkflowResponse>(
    (request) => this.workflow.signalWebhookEndpointWorkflow(request),
  );

  /**
   * Starts a webhook endpoint.
   */
  startWebhookEndpointWorkflow = unary<webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowResponse>(
    (request) => this.workflow.startWebhookEndpointWorkflow(request),
  );
}

export function implementation(handler: WebhookEndpointWorkflowHandler): webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceServer {
  return {
    advanceWebhookEndpointWorkflow: handler.advanceWebhookEndpointWorkflow,
    cancelWebhookEndpointWorkflow: handler.cancelWebhookEndpointWorkflow,
    inspectWebhookEndpointWorkflow: handler.inspectWebhookEndpointWorkflow,
    listWebhookEndpointWorkflows: handler.listWebhookEndpointWorkflows,
    pauseWebhookEndpointWorkflow: handler.pauseWebhookEndpointWorkflow,
    resumeWebhookEndpointWorkflow: handler.resumeWebhookEndpointWorkflow,
    retryWebhookEndpointWorkflow: handler.retryWebhookEndpointWorkflow,
    signalWebhookEndpointWorkflow: handler.signalWebhookEndpointWorkflow,
    startWebhookEndpointWorkflow: handler.startWebhookEndpointWorkflow,
  };
}
