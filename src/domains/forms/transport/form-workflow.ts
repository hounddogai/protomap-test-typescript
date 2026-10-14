/**
 * Runs the long-lived workflow that takes a form from start to finish.
 */

import * as formsFormWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { FormWorkflowWorkflow } from "../application/form-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class FormWorkflowHandler {
  constructor(@inject(FormWorkflowWorkflow) private readonly workflow: FormWorkflowWorkflow) {}

  /**
   * Advances a form.
   */
  advanceFormWorkflow = (call: ServerUnaryCall<formsFormWorkflowServiceApi.AdvanceFormWorkflowRequest, formsFormWorkflowServiceApi.AdvanceFormWorkflowResponse>, done: sendUnaryData<formsFormWorkflowServiceApi.AdvanceFormWorkflowResponse>): void => {
    void this.workflow.advanceFormWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a form.
   */
  cancelFormWorkflow = unary<formsFormWorkflowServiceApi.CancelFormWorkflowRequest, formsFormWorkflowServiceApi.CancelFormWorkflowResponse>(
    (request) => this.workflow.cancelFormWorkflow(request),
  );

  /**
   * Returns a form.
   */
  inspectFormWorkflow = unary<formsFormWorkflowServiceApi.InspectFormWorkflowRequest, formsFormWorkflowServiceApi.InspectFormWorkflowResponse>(
    (request) => this.workflow.inspectFormWorkflow(request),
  );

  /**
   * Lists forms a page at a time.
   */
  listFormWorkflows = (call: ServerUnaryCall<formsFormWorkflowServiceApi.ListFormWorkflowsRequest, formsFormWorkflowServiceApi.ListFormWorkflowsResponse>, done: sendUnaryData<formsFormWorkflowServiceApi.ListFormWorkflowsResponse>): void => {
    void this.workflow.listFormWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a form.
   */
  pauseFormWorkflow = unary<formsFormWorkflowServiceApi.PauseFormWorkflowRequest, formsFormWorkflowServiceApi.PauseFormWorkflowResponse>(
    (request) => this.workflow.pauseFormWorkflow(request),
  );

  /**
   * Retrys a form.
   */
  retryFormWorkflow = unary<formsFormWorkflowServiceApi.RetryFormWorkflowRequest, formsFormWorkflowServiceApi.RetryFormWorkflowResponse>(
    (request) => this.workflow.retryFormWorkflow(request),
  );

  /**
   * Signals a form.
   */
  signalFormWorkflow = (call: ServerUnaryCall<formsFormWorkflowServiceApi.SignalFormWorkflowRequest, formsFormWorkflowServiceApi.SignalFormWorkflowResponse>, done: sendUnaryData<formsFormWorkflowServiceApi.SignalFormWorkflowResponse>): void => {
    void this.workflow.signalFormWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts a form.
   */
  startFormWorkflow = unary<formsFormWorkflowServiceApi.StartFormWorkflowRequest, formsFormWorkflowServiceApi.StartFormWorkflowResponse>(
    (request) => this.workflow.startFormWorkflow(request),
  );
}

export function implementation(handler: FormWorkflowHandler): formsFormWorkflowServiceApi.FormWorkflowServiceServer {
  return {
    advanceFormWorkflow: handler.advanceFormWorkflow,
    cancelFormWorkflow: handler.cancelFormWorkflow,
    inspectFormWorkflow: handler.inspectFormWorkflow,
    listFormWorkflows: handler.listFormWorkflows,
    pauseFormWorkflow: handler.pauseFormWorkflow,
    retryFormWorkflow: handler.retryFormWorkflow,
    signalFormWorkflow: handler.signalFormWorkflow,
    startFormWorkflow: handler.startFormWorkflow,
  };
}
