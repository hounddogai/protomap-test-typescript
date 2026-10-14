/**
 * Manages surveys: creates, reads, changes, and lists them.
 */

import * as surveysSurveyServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_service.js";
import { serviceError } from "../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../platform/handlers.js";
import { SurveyWorkflow } from "../application/survey.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for SurveyService; workflows own validation and database transactions.
 */
@injectable()
export class SurveyHandler {
  constructor(@inject(SurveyWorkflow) private readonly workflow: SurveyWorkflow) {}

  /**
   * Takes a stream of surveys and answers once at the end.
   */
  batchCreateSurveys = clientStream<surveysSurveyServiceApi.BatchCreateSurveysRequest, surveysSurveyServiceApi.BatchCreateSurveysResponse>(
    (request) => this.workflow.batchCreateSurveys(request), () => surveysSurveyServiceApi.BatchCreateSurveysResponse.fromPartial({}),
  );

  /**
   * Returns several surveys at once.
   */
  batchGetSurveys = unary<surveysSurveyServiceApi.BatchGetSurveysRequest, surveysSurveyServiceApi.BatchGetSurveysResponse>(
    (request) => this.workflow.batchGetSurveys(request),
  );

  /**
   * Creates a survey.
   */
  cloneSurvey = unary<surveysSurveyServiceApi.CloneSurveyRequest, surveysSurveyServiceApi.CloneSurveyResponse>(
    (request) => this.workflow.cloneSurvey(request),
  );

  /**
   * Creates a survey.
   */
  createSurvey = (call: ServerUnaryCall<surveysSurveyServiceApi.CreateSurveyRequest, surveysSurveyServiceApi.CreateSurveyResponse>, done: sendUnaryData<surveysSurveyServiceApi.CreateSurveyResponse>): void => {
    void this.workflow.createSurvey(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Deletes a survey.
   */
  deleteSurvey = unary<surveysSurveyServiceApi.DeleteSurveyRequest, surveysSurveyServiceApi.DeleteSurveyResponse>(
    (request) => this.workflow.deleteSurvey(request),
  );

  /**
   * Returns a survey.
   */
  getSurvey = unary<surveysSurveyServiceApi.GetSurveyRequest, surveysSurveyServiceApi.GetSurveyResponse>(
    (request) => this.workflow.getSurvey(request),
  );

  /**
   * Lists surveys a page at a time.
   */
  listSurveys = (call: ServerUnaryCall<surveysSurveyServiceApi.ListSurveysRequest, surveysSurveyServiceApi.ListSurveysResponse>, done: sendUnaryData<surveysSurveyServiceApi.ListSurveysResponse>): void => {
    void this.workflow.listSurveys(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Changes a survey.
   */
  updateSurvey = unary<surveysSurveyServiceApi.UpdateSurveyRequest, surveysSurveyServiceApi.UpdateSurveyResponse>(
    (request) => this.workflow.updateSurvey(request),
  );

  /**
   * Streams the changes of surveys as they happen.
   */
  watchSurveys = serverStream<surveysSurveyServiceApi.WatchSurveysRequest, surveysSurveyServiceApi.WatchSurveysResponse>(
    (request) => this.workflow.watchSurveys(request),
  );
}

export function implementation(handler: SurveyHandler): surveysSurveyServiceApi.SurveyServiceServer {
  return {
    batchCreateSurveys: handler.batchCreateSurveys,
    batchGetSurveys: handler.batchGetSurveys,
    cloneSurvey: handler.cloneSurvey,
    createSurvey: handler.createSurvey,
    deleteSurvey: handler.deleteSurvey,
    getSurvey: handler.getSurvey,
    listSurveys: handler.listSurveys,
    updateSurvey: handler.updateSurvey,
    watchSurveys: handler.watchSurveys,
  };
}
