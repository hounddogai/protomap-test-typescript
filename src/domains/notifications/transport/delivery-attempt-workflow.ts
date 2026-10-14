/**
 * Runs the long-lived workflow that takes a delivery attempt from start to finish.
 */

import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { DeliveryAttemptWorkflowWorkflow } from "../application/delivery-attempt-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for DeliveryAttemptWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class DeliveryAttemptWorkflowHandler {
  constructor(@inject(DeliveryAttemptWorkflowWorkflow) private readonly workflow: DeliveryAttemptWorkflowWorkflow) {}

  /**
   * Advances a delivery attempt.
   */
  advanceDeliveryAttemptWorkflow = (call: ServerUnaryCall<notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse>, done: sendUnaryData<notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse>): void => {
    void this.workflow.advanceDeliveryAttemptWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a delivery attempt.
   */
  cancelDeliveryAttemptWorkflow = unary<notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowResponse>(
    (request) => this.workflow.cancelDeliveryAttemptWorkflow(request),
  );

  /**
   * Returns a delivery attempt.
   */
  inspectDeliveryAttemptWorkflow = unary<notificationsDeliveryAttemptWorkflowServiceApi.InspectDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.InspectDeliveryAttemptWorkflowResponse>(
    (request) => this.workflow.inspectDeliveryAttemptWorkflow(request),
  );

  /**
   * Lists delivery attempts a page at a time.
   */
  listDeliveryAttemptWorkflows = (call: ServerUnaryCall<notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsRequest, notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse>, done: sendUnaryData<notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse>): void => {
    void this.workflow.listDeliveryAttemptWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a delivery attempt.
   */
  pauseDeliveryAttemptWorkflow = unary<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse>(
    (request) => this.workflow.pauseDeliveryAttemptWorkflow(request),
  );

  /**
   * Resumes a delivery attempt.
   */
  resumeDeliveryAttemptWorkflow = unary<notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowResponse>(
    (request) => this.workflow.resumeDeliveryAttemptWorkflow(request),
  );

  /**
   * Retrys a delivery attempt.
   */
  retryDeliveryAttemptWorkflow = (call: ServerUnaryCall<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse>, done: sendUnaryData<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse>): void => {
    void this.workflow.retryDeliveryAttemptWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a delivery attempt.
   */
  signalDeliveryAttemptWorkflow = unary<notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowResponse>(
    (request) => this.workflow.signalDeliveryAttemptWorkflow(request),
  );

  /**
   * Starts a delivery attempt.
   */
  startDeliveryAttemptWorkflow = unary<notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse>(
    (request) => this.workflow.startDeliveryAttemptWorkflow(request),
  );
}

export function implementation(handler: DeliveryAttemptWorkflowHandler): notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceServer {
  return {
    advanceDeliveryAttemptWorkflow: handler.advanceDeliveryAttemptWorkflow,
    cancelDeliveryAttemptWorkflow: handler.cancelDeliveryAttemptWorkflow,
    inspectDeliveryAttemptWorkflow: handler.inspectDeliveryAttemptWorkflow,
    listDeliveryAttemptWorkflows: handler.listDeliveryAttemptWorkflows,
    pauseDeliveryAttemptWorkflow: handler.pauseDeliveryAttemptWorkflow,
    resumeDeliveryAttemptWorkflow: handler.resumeDeliveryAttemptWorkflow,
    retryDeliveryAttemptWorkflow: handler.retryDeliveryAttemptWorkflow,
    signalDeliveryAttemptWorkflow: handler.signalDeliveryAttemptWorkflow,
    startDeliveryAttemptWorkflow: handler.startDeliveryAttemptWorkflow,
  };
}
