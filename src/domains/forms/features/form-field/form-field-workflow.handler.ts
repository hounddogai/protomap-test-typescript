/**
 * Runs the long-lived workflow that takes a form field from start to finish.
 */

import * as formsFormFieldWorkflowServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { FormFieldWorkflowWorkflow } from "./form-field-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for FormFieldWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class FormFieldWorkflowHandler {
  constructor(@inject(FormFieldWorkflowWorkflow) private readonly workflow: FormFieldWorkflowWorkflow) {}

  /**
   * Advances a form field.
   */
  advanceFormFieldWorkflow = unary<formsFormFieldWorkflowServiceApi.AdvanceFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.AdvanceFormFieldWorkflowResponse>(
    (request) => this.workflow.advanceFormFieldWorkflow(request),
  );

  /**
   * Cancels a form field.
   */
  cancelFormFieldWorkflow = (call: ServerUnaryCall<formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowResponse>, done: sendUnaryData<formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowResponse>): void => {
    void this.workflow.cancelFormFieldWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a form field.
   */
  inspectFormFieldWorkflow = unary<formsFormFieldWorkflowServiceApi.InspectFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.InspectFormFieldWorkflowResponse>(
    (request) => this.workflow.inspectFormFieldWorkflow(request),
  );

  /**
   * Lists form fields a page at a time.
   */
  listFormFieldWorkflows = unary<formsFormFieldWorkflowServiceApi.ListFormFieldWorkflowsRequest, formsFormFieldWorkflowServiceApi.ListFormFieldWorkflowsResponse>(
    (request) => this.workflow.listFormFieldWorkflows(request),
  );

  /**
   * Retrys a form field.
   */
  retryFormFieldWorkflow = (call: ServerUnaryCall<formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowResponse>, done: sendUnaryData<formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowResponse>): void => {
    void this.workflow.retryFormFieldWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a form field.
   */
  signalFormFieldWorkflow = unary<formsFormFieldWorkflowServiceApi.SignalFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.SignalFormFieldWorkflowResponse>(
    (request) => this.workflow.signalFormFieldWorkflow(request),
  );

  /**
   * Starts a form field.
   */
  startFormFieldWorkflow = unary<formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowResponse>(
    (request) => this.workflow.startFormFieldWorkflow(request),
  );
}

export function implementation(handler: FormFieldWorkflowHandler): formsFormFieldWorkflowServiceApi.FormFieldWorkflowServiceServer {
  return {
    advanceFormFieldWorkflow: handler.advanceFormFieldWorkflow,
    cancelFormFieldWorkflow: handler.cancelFormFieldWorkflow,
    inspectFormFieldWorkflow: handler.inspectFormFieldWorkflow,
    listFormFieldWorkflows: handler.listFormFieldWorkflows,
    retryFormFieldWorkflow: handler.retryFormFieldWorkflow,
    signalFormFieldWorkflow: handler.signalFormFieldWorkflow,
    startFormFieldWorkflow: handler.startFormFieldWorkflow,
  };
}
