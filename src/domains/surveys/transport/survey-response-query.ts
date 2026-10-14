/**
 * Answers read-only questions about survey responses, for screens and reports.
 */

import * as surveysSurveyResponseQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { SurveyResponseQueryWorkflow } from "../application/survey-response-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for SurveyResponseQueryService; workflows own validation and database transactions.
 */
@injectable()
export class SurveyResponseQueryHandler {
  constructor(@inject(SurveyResponseQueryWorkflow) private readonly workflow: SurveyResponseQueryWorkflow) {}

  /**
   * Lists survey responses a page at a time.
   */
  browseSurveyResponses = (call: ServerUnaryCall<surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesResponse>, done: sendUnaryData<surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesResponse>): void => {
    void this.workflow.browseSurveyResponses(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts survey responses by status.
   */
  countSurveyResponses = unary<surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.CountSurveyResponsesResponse>(
    (request) => this.workflow.countSurveyResponses(request),
  );

  /**
   * Streams every matching survey response.
   */
  exportSurveyResponses = serverStream<surveysSurveyResponseQueryServiceApi.ExportSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.ExportSurveyResponsesResponse>(
    (request) => this.workflow.exportSurveyResponses(request),
  );

  /**
   * Lists survey responses a page at a time.
   */
  findSurveyResponses = (call: ServerUnaryCall<surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.FindSurveyResponsesResponse>, done: sendUnaryData<surveysSurveyResponseQueryServiceApi.FindSurveyResponsesResponse>): void => {
    void this.workflow.findSurveyResponses(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a survey response.
   */
  lookupSurveyResponse = unary<surveysSurveyResponseQueryServiceApi.LookupSurveyResponseRequest, surveysSurveyResponseQueryServiceApi.LookupSurveyResponseResponse>(
    (request) => this.workflow.lookupSurveyResponse(request),
  );

  /**
   * Returns a survey response.
   */
  peekSurveyResponse = unary<surveysSurveyResponseQueryServiceApi.PeekSurveyResponseRequest, surveysSurveyResponseQueryServiceApi.PeekSurveyResponseResponse>(
    (request) => this.workflow.peekSurveyResponse(request),
  );

  /**
   * Returns several survey responses at once.
   */
  resolveSurveyResponses = (call: ServerUnaryCall<surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesResponse>, done: sendUnaryData<surveysSurveyResponseQueryServiceApi.ResolveSurveyResponsesResponse>): void => {
    void this.workflow.resolveSurveyResponses(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists survey responses a page at a time.
   */
  suggestSurveyResponses = unary<surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.SuggestSurveyResponsesResponse>(
    (request) => this.workflow.suggestSurveyResponses(request),
  );

  /**
   * Summarizes a survey response.
   */
  summarizeSurveyResponses = unary<surveysSurveyResponseQueryServiceApi.SummarizeSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.SummarizeSurveyResponsesResponse>(
    (request) => this.workflow.summarizeSurveyResponses(request),
  );
}

export function implementation(handler: SurveyResponseQueryHandler): surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceServer {
  return {
    browseSurveyResponses: handler.browseSurveyResponses,
    countSurveyResponses: handler.countSurveyResponses,
    exportSurveyResponses: handler.exportSurveyResponses,
    findSurveyResponses: handler.findSurveyResponses,
    lookupSurveyResponse: handler.lookupSurveyResponse,
    peekSurveyResponse: handler.peekSurveyResponse,
    resolveSurveyResponses: handler.resolveSurveyResponses,
    suggestSurveyResponses: handler.suggestSurveyResponses,
    summarizeSurveyResponses: handler.summarizeSurveyResponses,
  };
}
