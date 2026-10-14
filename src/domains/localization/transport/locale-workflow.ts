/**
 * Runs the long-lived workflow that takes a locale from start to finish.
 */

import * as localizationLocaleWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { LocaleWorkflowWorkflow } from "../application/locale-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for LocaleWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class LocaleWorkflowHandler {
  constructor(@inject(LocaleWorkflowWorkflow) private readonly workflow: LocaleWorkflowWorkflow) {}

  /**
   * Advances a locale.
   */
  advanceLocaleWorkflow = (call: ServerUnaryCall<localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowResponse>, done: sendUnaryData<localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowResponse>): void => {
    void this.workflow.advanceLocaleWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a locale.
   */
  cancelLocaleWorkflow = unary<localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowResponse>(
    (request) => this.workflow.cancelLocaleWorkflow(request),
  );

  /**
   * Returns a locale.
   */
  inspectLocaleWorkflow = unary<localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowResponse>(
    (request) => this.workflow.inspectLocaleWorkflow(request),
  );

  /**
   * Lists locales a page at a time.
   */
  listLocaleWorkflows = (call: ServerUnaryCall<localizationLocaleWorkflowServiceApi.ListLocaleWorkflowsRequest, localizationLocaleWorkflowServiceApi.ListLocaleWorkflowsResponse>, done: sendUnaryData<localizationLocaleWorkflowServiceApi.ListLocaleWorkflowsResponse>): void => {
    void this.workflow.listLocaleWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a locale.
   */
  retryLocaleWorkflow = unary<localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowResponse>(
    (request) => this.workflow.retryLocaleWorkflow(request),
  );

  /**
   * Starts a locale.
   */
  startLocaleWorkflow = unary<localizationLocaleWorkflowServiceApi.StartLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse>(
    (request) => this.workflow.startLocaleWorkflow(request),
  );
}

export function implementation(handler: LocaleWorkflowHandler): localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceServer {
  return {
    advanceLocaleWorkflow: handler.advanceLocaleWorkflow,
    cancelLocaleWorkflow: handler.cancelLocaleWorkflow,
    inspectLocaleWorkflow: handler.inspectLocaleWorkflow,
    listLocaleWorkflows: handler.listLocaleWorkflows,
    retryLocaleWorkflow: handler.retryLocaleWorkflow,
    startLocaleWorkflow: handler.startLocaleWorkflow,
  };
}
