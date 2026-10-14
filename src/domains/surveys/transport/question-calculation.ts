/**
 * Computes the figures of a question, such as totals, taxes, and estimates.
 */

import * as surveysQuestionCalculationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { QuestionCalculationWorkflow } from "../application/question-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for QuestionCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class QuestionCalculationHandler {
  constructor(@inject(QuestionCalculationWorkflow) private readonly workflow: QuestionCalculationWorkflow) {}

  /**
   * Calculates a question.
   */
  calculateQuestion = (call: ServerUnaryCall<surveysQuestionCalculationServiceApi.CalculateQuestionRequest, surveysQuestionCalculationServiceApi.CalculateQuestionResponse>, done: sendUnaryData<surveysQuestionCalculationServiceApi.CalculateQuestionResponse>): void => {
    void this.workflow.calculateQuestion(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares a question.
   */
  compareQuestionOptions = unary<surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest, surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse>(
    (request) => this.workflow.compareQuestionOptions(request),
  );

  /**
   * Estimates a question.
   */
  estimateQuestion = unary<surveysQuestionCalculationServiceApi.EstimateQuestionRequest, surveysQuestionCalculationServiceApi.EstimateQuestionResponse>(
    (request) => this.workflow.estimateQuestion(request),
  );

  /**
   * Explains a question.
   */
  explainQuestionCalculation = (call: ServerUnaryCall<surveysQuestionCalculationServiceApi.ExplainQuestionCalculationRequest, surveysQuestionCalculationServiceApi.ExplainQuestionCalculationResponse>, done: sendUnaryData<surveysQuestionCalculationServiceApi.ExplainQuestionCalculationResponse>): void => {
    void this.workflow.explainQuestionCalculation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a question.
   */
  getQuestionRates = unary<surveysQuestionCalculationServiceApi.GetQuestionRatesRequest, surveysQuestionCalculationServiceApi.GetQuestionRatesResponse>(
    (request) => this.workflow.getQuestionRates(request),
  );

  /**
   * Quotes a question.
   */
  quoteQuestion = unary<surveysQuestionCalculationServiceApi.QuoteQuestionRequest, surveysQuestionCalculationServiceApi.QuoteQuestionResponse>(
    (request) => this.workflow.quoteQuestion(request),
  );

  /**
   * Recalculates a question.
   */
  recalculateQuestions = (call: ServerUnaryCall<surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest, surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse>, done: sendUnaryData<surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse>): void => {
    void this.workflow.recalculateQuestions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a question.
   */
  simulateQuestion = unary<surveysQuestionCalculationServiceApi.SimulateQuestionRequest, surveysQuestionCalculationServiceApi.SimulateQuestionResponse>(
    (request) => this.workflow.simulateQuestion(request),
  );
}

export function implementation(handler: QuestionCalculationHandler): surveysQuestionCalculationServiceApi.QuestionCalculationServiceServer {
  return {
    calculateQuestion: handler.calculateQuestion,
    compareQuestionOptions: handler.compareQuestionOptions,
    estimateQuestion: handler.estimateQuestion,
    explainQuestionCalculation: handler.explainQuestionCalculation,
    getQuestionRates: handler.getQuestionRates,
    quoteQuestion: handler.quoteQuestion,
    recalculateQuestions: handler.recalculateQuestions,
    simulateQuestion: handler.simulateQuestion,
  };
}
