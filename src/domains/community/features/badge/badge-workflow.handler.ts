/**
 * Runs the long-lived workflow that takes a badge from start to finish.
 */

import * as communityBadgeWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { BadgeWorkflowWorkflow } from "./badge-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for BadgeWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class BadgeWorkflowHandler {
  constructor(@inject(BadgeWorkflowWorkflow) private readonly workflow: BadgeWorkflowWorkflow) {}

  /**
   * Advances a badge.
   */
  advanceBadgeWorkflow = unary<communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse>(
    (request) => this.workflow.advanceBadgeWorkflow(request),
  );

  /**
   * Cancels a badge.
   */
  cancelBadgeWorkflow = (call: ServerUnaryCall<communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse>, done: sendUnaryData<communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse>): void => {
    void this.workflow.cancelBadgeWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a badge.
   */
  inspectBadgeWorkflow = unary<communityBadgeWorkflowServiceApi.InspectBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.InspectBadgeWorkflowResponse>(
    (request) => this.workflow.inspectBadgeWorkflow(request),
  );

  /**
   * Lists badges a page at a time.
   */
  listBadgeWorkflows = unary<communityBadgeWorkflowServiceApi.ListBadgeWorkflowsRequest, communityBadgeWorkflowServiceApi.ListBadgeWorkflowsResponse>(
    (request) => this.workflow.listBadgeWorkflows(request),
  );

  /**
   * Pauses a badge.
   */
  pauseBadgeWorkflow = (call: ServerUnaryCall<communityBadgeWorkflowServiceApi.PauseBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.PauseBadgeWorkflowResponse>, done: sendUnaryData<communityBadgeWorkflowServiceApi.PauseBadgeWorkflowResponse>): void => {
    void this.workflow.pauseBadgeWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a badge.
   */
  retryBadgeWorkflow = unary<communityBadgeWorkflowServiceApi.RetryBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.RetryBadgeWorkflowResponse>(
    (request) => this.workflow.retryBadgeWorkflow(request),
  );

  /**
   * Signals a badge.
   */
  signalBadgeWorkflow = unary<communityBadgeWorkflowServiceApi.SignalBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.SignalBadgeWorkflowResponse>(
    (request) => this.workflow.signalBadgeWorkflow(request),
  );

  /**
   * Starts a badge.
   */
  startBadgeWorkflow = (call: ServerUnaryCall<communityBadgeWorkflowServiceApi.StartBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.StartBadgeWorkflowResponse>, done: sendUnaryData<communityBadgeWorkflowServiceApi.StartBadgeWorkflowResponse>): void => {
    void this.workflow.startBadgeWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: BadgeWorkflowHandler): communityBadgeWorkflowServiceApi.BadgeWorkflowServiceServer {
  return {
    advanceBadgeWorkflow: handler.advanceBadgeWorkflow,
    cancelBadgeWorkflow: handler.cancelBadgeWorkflow,
    inspectBadgeWorkflow: handler.inspectBadgeWorkflow,
    listBadgeWorkflows: handler.listBadgeWorkflows,
    pauseBadgeWorkflow: handler.pauseBadgeWorkflow,
    retryBadgeWorkflow: handler.retryBadgeWorkflow,
    signalBadgeWorkflow: handler.signalBadgeWorkflow,
    startBadgeWorkflow: handler.startBadgeWorkflow,
  };
}
