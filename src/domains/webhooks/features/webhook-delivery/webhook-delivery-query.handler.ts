/**
 * Answers read-only questions about webhook deliveries, for screens and reports.
 */

import * as webhooksWebhookDeliveryQueryServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { WebhookDeliveryQueryWorkflow } from "./webhook-delivery-query.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WebhookDeliveryQueryService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookDeliveryQueryHandler {
  constructor(@inject(WebhookDeliveryQueryWorkflow) private readonly workflow: WebhookDeliveryQueryWorkflow) {}

  /**
   * Lists webhook deliveries a page at a time.
   */
  browseWebhookDeliveries = unary<webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesResponse>(
    (request) => this.workflow.browseWebhookDeliveries(request),
  );

  /**
   * Counts webhook deliveries by status.
   */
  countWebhookDeliveries = (call: ServerUnaryCall<webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesResponse>, done: sendUnaryData<webhooksWebhookDeliveryQueryServiceApi.CountWebhookDeliveriesResponse>): void => {
    void this.workflow.countWebhookDeliveries(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists webhook deliveries a page at a time.
   */
  findWebhookDeliveries = unary<webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesResponse>(
    (request) => this.workflow.findWebhookDeliveries(request),
  );

  /**
   * Returns a webhook delivery.
   */
  lookupWebhookDelivery = unary<webhooksWebhookDeliveryQueryServiceApi.LookupWebhookDeliveryRequest, webhooksWebhookDeliveryQueryServiceApi.LookupWebhookDeliveryResponse>(
    (request) => this.workflow.lookupWebhookDelivery(request),
  );

  /**
   * Returns a webhook delivery.
   */
  peekWebhookDelivery = (call: ServerUnaryCall<webhooksWebhookDeliveryQueryServiceApi.PeekWebhookDeliveryRequest, webhooksWebhookDeliveryQueryServiceApi.PeekWebhookDeliveryResponse>, done: sendUnaryData<webhooksWebhookDeliveryQueryServiceApi.PeekWebhookDeliveryResponse>): void => {
    void this.workflow.peekWebhookDelivery(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists webhook deliveries a page at a time.
   */
  suggestWebhookDeliveries = unary<webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse>(
    (request) => this.workflow.suggestWebhookDeliveries(request),
  );

  /**
   * Summarizes a webhook delivery.
   */
  summarizeWebhookDeliveries = unary<webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse>(
    (request) => this.workflow.summarizeWebhookDeliveries(request),
  );
}

export function implementation(handler: WebhookDeliveryQueryHandler): webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceServer {
  return {
    browseWebhookDeliveries: handler.browseWebhookDeliveries,
    countWebhookDeliveries: handler.countWebhookDeliveries,
    findWebhookDeliveries: handler.findWebhookDeliveries,
    lookupWebhookDelivery: handler.lookupWebhookDelivery,
    peekWebhookDelivery: handler.peekWebhookDelivery,
    suggestWebhookDeliveries: handler.suggestWebhookDeliveries,
    summarizeWebhookDeliveries: handler.summarizeWebhookDeliveries,
  };
}
