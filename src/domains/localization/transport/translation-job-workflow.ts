/**
 * Runs the long-lived workflow that takes a translation job from start to finish.
 */

import * as localizationTranslationJobWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { TranslationJobWorkflowWorkflow } from "../application/translation-job-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranslationJobWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationJobWorkflowHandler {
  constructor(@inject(TranslationJobWorkflowWorkflow) private readonly workflow: TranslationJobWorkflowWorkflow) {}

  /**
   * Advances a translation job.
   */
  advanceTranslationJobWorkflow = (call: ServerUnaryCall<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse>, done: sendUnaryData<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse>): void => {
    void this.workflow.advanceTranslationJobWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a translation job.
   */
  cancelTranslationJobWorkflow = unary<localizationTranslationJobWorkflowServiceApi.CancelTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.CancelTranslationJobWorkflowResponse>(
    (request) => this.workflow.cancelTranslationJobWorkflow(request),
  );

  /**
   * Returns a translation job.
   */
  inspectTranslationJobWorkflow = unary<localizationTranslationJobWorkflowServiceApi.InspectTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.InspectTranslationJobWorkflowResponse>(
    (request) => this.workflow.inspectTranslationJobWorkflow(request),
  );

  /**
   * Lists translation jobs a page at a time.
   */
  listTranslationJobWorkflows = (call: ServerUnaryCall<localizationTranslationJobWorkflowServiceApi.ListTranslationJobWorkflowsRequest, localizationTranslationJobWorkflowServiceApi.ListTranslationJobWorkflowsResponse>, done: sendUnaryData<localizationTranslationJobWorkflowServiceApi.ListTranslationJobWorkflowsResponse>): void => {
    void this.workflow.listTranslationJobWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a translation job.
   */
  retryTranslationJobWorkflow = unary<localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse>(
    (request) => this.workflow.retryTranslationJobWorkflow(request),
  );

  /**
   * Signals a translation job.
   */
  signalTranslationJobWorkflow = unary<localizationTranslationJobWorkflowServiceApi.SignalTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.SignalTranslationJobWorkflowResponse>(
    (request) => this.workflow.signalTranslationJobWorkflow(request),
  );

  /**
   * Starts a translation job.
   */
  startTranslationJobWorkflow = (call: ServerUnaryCall<localizationTranslationJobWorkflowServiceApi.StartTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.StartTranslationJobWorkflowResponse>, done: sendUnaryData<localizationTranslationJobWorkflowServiceApi.StartTranslationJobWorkflowResponse>): void => {
    void this.workflow.startTranslationJobWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: TranslationJobWorkflowHandler): localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceServer {
  return {
    advanceTranslationJobWorkflow: handler.advanceTranslationJobWorkflow,
    cancelTranslationJobWorkflow: handler.cancelTranslationJobWorkflow,
    inspectTranslationJobWorkflow: handler.inspectTranslationJobWorkflow,
    listTranslationJobWorkflows: handler.listTranslationJobWorkflows,
    retryTranslationJobWorkflow: handler.retryTranslationJobWorkflow,
    signalTranslationJobWorkflow: handler.signalTranslationJobWorkflow,
    startTranslationJobWorkflow: handler.startTranslationJobWorkflow,
  };
}
