/**
 * Runs the long-lived workflow that takes a translation key from start to finish.
 */

import * as localizationTranslationKeyWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_workflow_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { TranslationKeyWorkflowWorkflow } from "../application/translation-key-workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranslationKeyWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationKeyWorkflowHandler {
  constructor(@inject(TranslationKeyWorkflowWorkflow) private readonly workflow: TranslationKeyWorkflowWorkflow) {}

  /**
   * Advances a translation key.
   */
  advanceTranslationKeyWorkflow = (call: ServerUnaryCall<localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowResponse>, done: sendUnaryData<localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowResponse>): void => {
    void this.workflow.advanceTranslationKeyWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Cancels a translation key.
   */
  cancelTranslationKeyWorkflow = unary<localizationTranslationKeyWorkflowServiceApi.CancelTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.CancelTranslationKeyWorkflowResponse>(
    (request) => this.workflow.cancelTranslationKeyWorkflow(request),
  );

  /**
   * Returns a translation key.
   */
  inspectTranslationKeyWorkflow = unary<localizationTranslationKeyWorkflowServiceApi.InspectTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.InspectTranslationKeyWorkflowResponse>(
    (request) => this.workflow.inspectTranslationKeyWorkflow(request),
  );

  /**
   * Lists translation keys a page at a time.
   */
  listTranslationKeyWorkflows = (call: ServerUnaryCall<localizationTranslationKeyWorkflowServiceApi.ListTranslationKeyWorkflowsRequest, localizationTranslationKeyWorkflowServiceApi.ListTranslationKeyWorkflowsResponse>, done: sendUnaryData<localizationTranslationKeyWorkflowServiceApi.ListTranslationKeyWorkflowsResponse>): void => {
    void this.workflow.listTranslationKeyWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a translation key.
   */
  pauseTranslationKeyWorkflow = unary<localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowResponse>(
    (request) => this.workflow.pauseTranslationKeyWorkflow(request),
  );

  /**
   * Resumes a translation key.
   */
  resumeTranslationKeyWorkflow = unary<localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowResponse>(
    (request) => this.workflow.resumeTranslationKeyWorkflow(request),
  );

  /**
   * Retrys a translation key.
   */
  retryTranslationKeyWorkflow = (call: ServerUnaryCall<localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowResponse>, done: sendUnaryData<localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowResponse>): void => {
    void this.workflow.retryTranslationKeyWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a translation key.
   */
  signalTranslationKeyWorkflow = unary<localizationTranslationKeyWorkflowServiceApi.SignalTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.SignalTranslationKeyWorkflowResponse>(
    (request) => this.workflow.signalTranslationKeyWorkflow(request),
  );

  /**
   * Starts a translation key.
   */
  startTranslationKeyWorkflow = unary<localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowResponse>(
    (request) => this.workflow.startTranslationKeyWorkflow(request),
  );
}

export function implementation(handler: TranslationKeyWorkflowHandler): localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceServer {
  return {
    advanceTranslationKeyWorkflow: handler.advanceTranslationKeyWorkflow,
    cancelTranslationKeyWorkflow: handler.cancelTranslationKeyWorkflow,
    inspectTranslationKeyWorkflow: handler.inspectTranslationKeyWorkflow,
    listTranslationKeyWorkflows: handler.listTranslationKeyWorkflows,
    pauseTranslationKeyWorkflow: handler.pauseTranslationKeyWorkflow,
    resumeTranslationKeyWorkflow: handler.resumeTranslationKeyWorkflow,
    retryTranslationKeyWorkflow: handler.retryTranslationKeyWorkflow,
    signalTranslationKeyWorkflow: handler.signalTranslationKeyWorkflow,
    startTranslationKeyWorkflow: handler.startTranslationKeyWorkflow,
  };
}
