/**
 * Computes the figures of a participant, such as totals, taxes, and estimates.
 */

import * as messagingParticipantCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ParticipantCalculationWorkflow } from "./participant-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ParticipantCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ParticipantCalculationHandler {
  constructor(@inject(ParticipantCalculationWorkflow) private readonly workflow: ParticipantCalculationWorkflow) {}

  /**
   * Calculates a participant.
   */
  calculateParticipant = unary<messagingParticipantCalculationServiceApi.CalculateParticipantRequest, messagingParticipantCalculationServiceApi.CalculateParticipantResponse>(
    (request) => this.workflow.calculateParticipant(request),
  );

  /**
   * Compares a participant.
   */
  compareParticipantOptions = (call: ServerUnaryCall<messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest, messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse>, done: sendUnaryData<messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse>): void => {
    void this.workflow.compareParticipantOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates a participant.
   */
  estimateParticipant = unary<messagingParticipantCalculationServiceApi.EstimateParticipantRequest, messagingParticipantCalculationServiceApi.EstimateParticipantResponse>(
    (request) => this.workflow.estimateParticipant(request),
  );

  /**
   * Explains a participant.
   */
  explainParticipantCalculation = unary<messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest, messagingParticipantCalculationServiceApi.ExplainParticipantCalculationResponse>(
    (request) => this.workflow.explainParticipantCalculation(request),
  );

  /**
   * Returns a participant.
   */
  getParticipantRates = (call: ServerUnaryCall<messagingParticipantCalculationServiceApi.GetParticipantRatesRequest, messagingParticipantCalculationServiceApi.GetParticipantRatesResponse>, done: sendUnaryData<messagingParticipantCalculationServiceApi.GetParticipantRatesResponse>): void => {
    void this.workflow.getParticipantRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes a participant.
   */
  quoteParticipant = unary<messagingParticipantCalculationServiceApi.QuoteParticipantRequest, messagingParticipantCalculationServiceApi.QuoteParticipantResponse>(
    (request) => this.workflow.quoteParticipant(request),
  );

  /**
   * Recalculates a participant.
   */
  recalculateParticipants = unary<messagingParticipantCalculationServiceApi.RecalculateParticipantsRequest, messagingParticipantCalculationServiceApi.RecalculateParticipantsResponse>(
    (request) => this.workflow.recalculateParticipants(request),
  );

  /**
   * Simulates a participant.
   */
  simulateParticipant = (call: ServerUnaryCall<messagingParticipantCalculationServiceApi.SimulateParticipantRequest, messagingParticipantCalculationServiceApi.SimulateParticipantResponse>, done: sendUnaryData<messagingParticipantCalculationServiceApi.SimulateParticipantResponse>): void => {
    void this.workflow.simulateParticipant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ParticipantCalculationHandler): messagingParticipantCalculationServiceApi.ParticipantCalculationServiceServer {
  return {
    calculateParticipant: handler.calculateParticipant,
    compareParticipantOptions: handler.compareParticipantOptions,
    estimateParticipant: handler.estimateParticipant,
    explainParticipantCalculation: handler.explainParticipantCalculation,
    getParticipantRates: handler.getParticipantRates,
    quoteParticipant: handler.quoteParticipant,
    recalculateParticipants: handler.recalculateParticipants,
    simulateParticipant: handler.simulateParticipant,
  };
}
