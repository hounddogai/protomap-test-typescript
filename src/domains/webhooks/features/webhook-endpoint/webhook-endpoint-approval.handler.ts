/**
 * Routes webhook endpoints through approval, with escalation and delegation.
 */

import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { WebhookEndpointApprovalWorkflow } from "./webhook-endpoint-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WebhookEndpointApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookEndpointApprovalHandler {
  constructor(@inject(WebhookEndpointApprovalWorkflow) private readonly workflow: WebhookEndpointApprovalWorkflow) {}

  /**
   * Approves a webhook endpoint.
   */
  approveWebhookEndpoint = unary<webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse>(
    (request) => this.workflow.approveWebhookEndpoint(request),
  );

  /**
   * Comments a webhook endpoint.
   */
  commentWebhookEndpointApproval = (call: ServerUnaryCall<webhooksWebhookEndpointApprovalServiceApi.CommentWebhookEndpointApprovalRequest, webhooksWebhookEndpointApprovalServiceApi.CommentWebhookEndpointApprovalResponse>, done: sendUnaryData<webhooksWebhookEndpointApprovalServiceApi.CommentWebhookEndpointApprovalResponse>): void => {
    void this.workflow.commentWebhookEndpointApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Delegates a webhook endpoint.
   */
  delegateWebhookEndpointApproval = unary<webhooksWebhookEndpointApprovalServiceApi.DelegateWebhookEndpointApprovalRequest, webhooksWebhookEndpointApprovalServiceApi.DelegateWebhookEndpointApprovalResponse>(
    (request) => this.workflow.delegateWebhookEndpointApproval(request),
  );

  /**
   * Returns a webhook endpoint.
   */
  getWebhookEndpointApprovalStatus = unary<webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusRequest, webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusResponse>(
    (request) => this.workflow.getWebhookEndpointApprovalStatus(request),
  );

  /**
   * Lists webhook endpoints a page at a time.
   */
  listPendingWebhookEndpoints = (call: ServerUnaryCall<webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsRequest, webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsResponse>, done: sendUnaryData<webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsResponse>): void => {
    void this.workflow.listPendingWebhookEndpoints(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a webhook endpoint.
   */
  recallWebhookEndpoint = unary<webhooksWebhookEndpointApprovalServiceApi.RecallWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.RecallWebhookEndpointResponse>(
    (request) => this.workflow.recallWebhookEndpoint(request),
  );

  /**
   * Rejects a webhook endpoint.
   */
  rejectWebhookEndpoint = unary<webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.RejectWebhookEndpointResponse>(
    (request) => this.workflow.rejectWebhookEndpoint(request),
  );

  /**
   * Submits a webhook endpoint.
   */
  submitWebhookEndpoint = (call: ServerUnaryCall<webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse>, done: sendUnaryData<webhooksWebhookEndpointApprovalServiceApi.SubmitWebhookEndpointResponse>): void => {
    void this.workflow.submitWebhookEndpoint(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: WebhookEndpointApprovalHandler): webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceServer {
  return {
    approveWebhookEndpoint: handler.approveWebhookEndpoint,
    commentWebhookEndpointApproval: handler.commentWebhookEndpointApproval,
    delegateWebhookEndpointApproval: handler.delegateWebhookEndpointApproval,
    getWebhookEndpointApprovalStatus: handler.getWebhookEndpointApprovalStatus,
    listPendingWebhookEndpoints: handler.listPendingWebhookEndpoints,
    recallWebhookEndpoint: handler.recallWebhookEndpoint,
    rejectWebhookEndpoint: handler.rejectWebhookEndpoint,
    submitWebhookEndpoint: handler.submitWebhookEndpoint,
  };
}
