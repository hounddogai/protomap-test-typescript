/**
 * Answers read-only questions about webhook endpoints, for screens and reports.
 */

import * as webhooksWebhookEndpointQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { WebhookEndpointQueryWorkflow } from "../application/webhook-endpoint-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WebhookEndpointQueryService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookEndpointQueryHandler {
  constructor(@inject(WebhookEndpointQueryWorkflow) private readonly workflow: WebhookEndpointQueryWorkflow) {}

  /**
   * Lists webhook endpoints a page at a time.
   */
  browseWebhookEndpoints = (call: ServerUnaryCall<webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsResponse>, done: sendUnaryData<webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsResponse>): void => {
    void this.workflow.browseWebhookEndpoints(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts webhook endpoints by status.
   */
  countWebhookEndpoints = unary<webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsResponse>(
    (request) => this.workflow.countWebhookEndpoints(request),
  );

  /**
   * Streams every matching webhook endpoint.
   */
  exportWebhookEndpoints = serverStream<webhooksWebhookEndpointQueryServiceApi.ExportWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.ExportWebhookEndpointsResponse>(
    (request) => this.workflow.exportWebhookEndpoints(request),
  );

  /**
   * Lists webhook endpoints a page at a time.
   */
  findWebhookEndpoints = (call: ServerUnaryCall<webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse>, done: sendUnaryData<webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse>): void => {
    void this.workflow.findWebhookEndpoints(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a webhook endpoint.
   */
  lookupWebhookEndpoint = unary<webhooksWebhookEndpointQueryServiceApi.LookupWebhookEndpointRequest, webhooksWebhookEndpointQueryServiceApi.LookupWebhookEndpointResponse>(
    (request) => this.workflow.lookupWebhookEndpoint(request),
  );

  /**
   * Returns a webhook endpoint.
   */
  peekWebhookEndpoint = unary<webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointRequest, webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointResponse>(
    (request) => this.workflow.peekWebhookEndpoint(request),
  );

  /**
   * Returns several webhook endpoints at once.
   */
  resolveWebhookEndpoints = (call: ServerUnaryCall<webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsResponse>, done: sendUnaryData<webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsResponse>): void => {
    void this.workflow.resolveWebhookEndpoints(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists webhook endpoints a page at a time.
   */
  suggestWebhookEndpoints = unary<webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsResponse>(
    (request) => this.workflow.suggestWebhookEndpoints(request),
  );

  /**
   * Summarizes a webhook endpoint.
   */
  summarizeWebhookEndpoints = unary<webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsResponse>(
    (request) => this.workflow.summarizeWebhookEndpoints(request),
  );
}

export function implementation(handler: WebhookEndpointQueryHandler): webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceServer {
  return {
    browseWebhookEndpoints: handler.browseWebhookEndpoints,
    countWebhookEndpoints: handler.countWebhookEndpoints,
    exportWebhookEndpoints: handler.exportWebhookEndpoints,
    findWebhookEndpoints: handler.findWebhookEndpoints,
    lookupWebhookEndpoint: handler.lookupWebhookEndpoint,
    peekWebhookEndpoint: handler.peekWebhookEndpoint,
    resolveWebhookEndpoints: handler.resolveWebhookEndpoints,
    suggestWebhookEndpoints: handler.suggestWebhookEndpoints,
    summarizeWebhookEndpoints: handler.summarizeWebhookEndpoints,
  };
}
