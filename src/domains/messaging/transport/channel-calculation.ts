/**
 * Computes the figures of a channel, such as totals, taxes, and estimates.
 */

import * as messagingChannelCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ChannelCalculationWorkflow } from "../application/channel-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ChannelCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ChannelCalculationHandler {
  constructor(@inject(ChannelCalculationWorkflow) private readonly workflow: ChannelCalculationWorkflow) {}

  /**
   * Calculates a channel.
   */
  calculateChannel = (call: ServerUnaryCall<messagingChannelCalculationServiceApi.CalculateChannelRequest, messagingChannelCalculationServiceApi.CalculateChannelResponse>, done: sendUnaryData<messagingChannelCalculationServiceApi.CalculateChannelResponse>): void => {
    void this.workflow.calculateChannel(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares a channel.
   */
  compareChannelOptions = unary<messagingChannelCalculationServiceApi.CompareChannelOptionsRequest, messagingChannelCalculationServiceApi.CompareChannelOptionsResponse>(
    (request) => this.workflow.compareChannelOptions(request),
  );

  /**
   * Estimates a channel.
   */
  estimateChannel = unary<messagingChannelCalculationServiceApi.EstimateChannelRequest, messagingChannelCalculationServiceApi.EstimateChannelResponse>(
    (request) => this.workflow.estimateChannel(request),
  );

  /**
   * Explains a channel.
   */
  explainChannelCalculation = (call: ServerUnaryCall<messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest, messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse>, done: sendUnaryData<messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse>): void => {
    void this.workflow.explainChannelCalculation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a channel.
   */
  getChannelRates = unary<messagingChannelCalculationServiceApi.GetChannelRatesRequest, messagingChannelCalculationServiceApi.GetChannelRatesResponse>(
    (request) => this.workflow.getChannelRates(request),
  );

  /**
   * Quotes a channel.
   */
  quoteChannel = unary<messagingChannelCalculationServiceApi.QuoteChannelRequest, messagingChannelCalculationServiceApi.QuoteChannelResponse>(
    (request) => this.workflow.quoteChannel(request),
  );

  /**
   * Recalculates a channel.
   */
  recalculateChannels = (call: ServerUnaryCall<messagingChannelCalculationServiceApi.RecalculateChannelsRequest, messagingChannelCalculationServiceApi.RecalculateChannelsResponse>, done: sendUnaryData<messagingChannelCalculationServiceApi.RecalculateChannelsResponse>): void => {
    void this.workflow.recalculateChannels(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a channel.
   */
  simulateChannel = unary<messagingChannelCalculationServiceApi.SimulateChannelRequest, messagingChannelCalculationServiceApi.SimulateChannelResponse>(
    (request) => this.workflow.simulateChannel(request),
  );
}

export function implementation(handler: ChannelCalculationHandler): messagingChannelCalculationServiceApi.ChannelCalculationServiceServer {
  return {
    calculateChannel: handler.calculateChannel,
    compareChannelOptions: handler.compareChannelOptions,
    estimateChannel: handler.estimateChannel,
    explainChannelCalculation: handler.explainChannelCalculation,
    getChannelRates: handler.getChannelRates,
    quoteChannel: handler.quoteChannel,
    recalculateChannels: handler.recalculateChannels,
    simulateChannel: handler.simulateChannel,
  };
}
