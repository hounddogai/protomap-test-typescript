/**
 * Runs the long-lived workflow that takes a survey response from start to finish.
 */

import * as surveysSurveyResponseWorkflowServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_workflow_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { SurveyResponseWorkflowWorkflow } from "./survey-response-workflow.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for SurveyResponseWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class SurveyResponseWorkflowHandler {
  constructor(@inject(SurveyResponseWorkflowWorkflow) private readonly workflow: SurveyResponseWorkflowWorkflow) {}

  /**
   * Advances a survey response.
   */
  advanceSurveyResponseWorkflow = unary<surveysSurveyResponseWorkflowServiceApi.AdvanceSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.AdvanceSurveyResponseWorkflowResponse>(
    (request) => this.workflow.advanceSurveyResponseWorkflow(request),
  );

  /**
   * Cancels a survey response.
   */
  cancelSurveyResponseWorkflow = (call: ServerUnaryCall<surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowResponse>, done: sendUnaryData<surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowResponse>): void => {
    void this.workflow.cancelSurveyResponseWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a survey response.
   */
  inspectSurveyResponseWorkflow = unary<surveysSurveyResponseWorkflowServiceApi.InspectSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.InspectSurveyResponseWorkflowResponse>(
    (request) => this.workflow.inspectSurveyResponseWorkflow(request),
  );

  /**
   * Lists survey responses a page at a time.
   */
  listSurveyResponseWorkflows = unary<surveysSurveyResponseWorkflowServiceApi.ListSurveyResponseWorkflowsRequest, surveysSurveyResponseWorkflowServiceApi.ListSurveyResponseWorkflowsResponse>(
    (request) => this.workflow.listSurveyResponseWorkflows(request),
  );

  /**
   * Pauses a survey response.
   */
  pauseSurveyResponseWorkflow = (call: ServerUnaryCall<surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowResponse>, done: sendUnaryData<surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowResponse>): void => {
    void this.workflow.pauseSurveyResponseWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resumes a survey response.
   */
  resumeSurveyResponseWorkflow = unary<surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.ResumeSurveyResponseWorkflowResponse>(
    (request) => this.workflow.resumeSurveyResponseWorkflow(request),
  );

  /**
   * Retrys a survey response.
   */
  retrySurveyResponseWorkflow = unary<surveysSurveyResponseWorkflowServiceApi.RetrySurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.RetrySurveyResponseWorkflowResponse>(
    (request) => this.workflow.retrySurveyResponseWorkflow(request),
  );

  /**
   * Signals a survey response.
   */
  signalSurveyResponseWorkflow = (call: ServerUnaryCall<surveysSurveyResponseWorkflowServiceApi.SignalSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.SignalSurveyResponseWorkflowResponse>, done: sendUnaryData<surveysSurveyResponseWorkflowServiceApi.SignalSurveyResponseWorkflowResponse>): void => {
    void this.workflow.signalSurveyResponseWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts a survey response.
   */
  startSurveyResponseWorkflow = unary<surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowResponse>(
    (request) => this.workflow.startSurveyResponseWorkflow(request),
  );
}

export function implementation(handler: SurveyResponseWorkflowHandler): surveysSurveyResponseWorkflowServiceApi.SurveyResponseWorkflowServiceServer {
  return {
    advanceSurveyResponseWorkflow: handler.advanceSurveyResponseWorkflow,
    cancelSurveyResponseWorkflow: handler.cancelSurveyResponseWorkflow,
    inspectSurveyResponseWorkflow: handler.inspectSurveyResponseWorkflow,
    listSurveyResponseWorkflows: handler.listSurveyResponseWorkflows,
    pauseSurveyResponseWorkflow: handler.pauseSurveyResponseWorkflow,
    resumeSurveyResponseWorkflow: handler.resumeSurveyResponseWorkflow,
    retrySurveyResponseWorkflow: handler.retrySurveyResponseWorkflow,
    signalSurveyResponseWorkflow: handler.signalSurveyResponseWorkflow,
    startSurveyResponseWorkflow: handler.startSurveyResponseWorkflow,
  };
}
