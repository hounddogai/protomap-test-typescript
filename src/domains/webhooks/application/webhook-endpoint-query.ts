/**
 * Answers read-only questions about webhook endpoints, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityModerationValidationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as dispatchDispatchOrderQueryServiceApi from "../../../../.cache/proto/acme/dispatch/v1/dispatch_order_query_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as routingRouteCalculationServiceApi from "../../../../.cache/proto/acme/routing/v1/route_calculation_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { WebhooksRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook endpoint operations and persist audit data.
 */
@injectable()
export class WebhookEndpointQueryWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.dispatch.v1.DispatchOrderQueryService") private readonly dispatchDispatchOrderQueryClient: dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.routing.v1.RouteCalculationService") private readonly routingRouteCalculationClient: routingRouteCalculationServiceApi.RouteCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretValidationService") private readonly webhooksWebhookSecretValidationClient: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists webhook endpoints a page at a time.
   */
  async browseWebhookEndpoints(req: webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsRequest): Promise<webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseWebhookEndpoints", req);
    this.logger.info("browse_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
        region: (req?.filter?.region ?? ""),
      },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke1: Unary<notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.ListNotificationVersionsResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.listNotificationVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookEndpointQueryServiceApi.BrowseWebhookEndpointsResponse.fromPartial({ pageInfo: { totalSize: (reply1?.pageInfo?.totalSize ?? 0) } });
  }

  /**
   * Counts webhook endpoints by status.
   */
  async countWebhookEndpoints(req: webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsRequest): Promise<webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountWebhookEndpoints", req);
    this.logger.info("count_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = routingRouteCalculationServiceApi.QuoteRouteRequest.fromPartial({
      context: req?.context,
      route: {
        audit: { createdAt: req?.filter?.createdAfter },
        billingAddress: { region: (req?.filter?.region ?? "") },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<routingRouteCalculationServiceApi.QuoteRouteRequest, routingRouteCalculationServiceApi.QuoteRouteResponse> =
      (input, done) => this.routingRouteCalculationClient.quoteRoute(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { email: (reply1?.route?.counterparty?.email ?? "") },
        audit: {
          createdAt: reply1?.route?.audit?.createdAt,
          createdBy: (reply1?.route?.audit?.createdBy ?? ""),
        },
      },
    });
    const method2 = "compareNotificationVersions" as const;
    const invoke2: Unary<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse> =
      (input, done) => this.notificationsNotificationHistoryClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webhooksWebhookEndpointQueryServiceApi.CountWebhookEndpointsResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
    );
  }

  /**
   * Streams every matching webhook endpoint.
   */
  async exportWebhookEndpoints(req: webhooksWebhookEndpointQueryServiceApi.ExportWebhookEndpointsRequest): Promise<webhooksWebhookEndpointQueryServiceApi.ExportWebhookEndpointsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportWebhookEndpoints", req);
    this.logger.info("export_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = dispatchDispatchOrderQueryServiceApi.SummarizeDispatchOrdersRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        format: (req?.format ?? ""),
      },
    });
    const proxy1 = forwarding(this.dispatchDispatchOrderQueryClient);
    const invoke1: Unary<dispatchDispatchOrderQueryServiceApi.SummarizeDispatchOrdersRequest, dispatchDispatchOrderQueryServiceApi.SummarizeDispatchOrdersResponse> =
      (input, done) => proxy1.summarizeDispatchOrders(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<dispatchDispatchOrderQueryServiceApi.SummarizeDispatchOrdersRequest, dispatchDispatchOrderQueryServiceApi.SummarizeDispatchOrdersResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return webhooksWebhookEndpointQueryServiceApi.ExportWebhookEndpointsResponse.fromPartial({
      result: {
        details: (reply1?.result?.details ?? {}),
        referenceIds: (reply1?.result?.referenceIds ?? []),
      },
    });
  }

  /**
   * Lists webhook endpoints a page at a time.
   */
  async findWebhookEndpoints(req: webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsRequest): Promise<webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindWebhookEndpoints", req);
    this.logger.info("find_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.explainWebhookSecretCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookEndpointQueryServiceApi.FindWebhookEndpointsResponse.fromPartial({
      result: { status: (reply1?.outcome?.status ?? "") },
      webhookEndpoints: [{ audit: { createdBy: (reply1?.webhookSecret?.audit?.createdBy ?? "") } }],
    });
  }

  /**
   * Returns a webhook endpoint.
   */
  async lookupWebhookEndpoint(req: webhooksWebhookEndpointQueryServiceApi.LookupWebhookEndpointRequest): Promise<webhooksWebhookEndpointQueryServiceApi.LookupWebhookEndpointResponse> {
    validateContext(req.context);
    if (!req.webhookEndpointId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_endpoint_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupWebhookEndpoint", req);
    this.logger.info("lookup_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.QuotePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { createdAt: req?.context?.deadline },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse> =
      (input, done) => this.communityPostCalculationClient.quotePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse>(invoke1, spread1);
    return mergeResponses(
      webhooksWebhookEndpointQueryServiceApi.LookupWebhookEndpointResponse.fromPartial({
        webhookEndpoint: { audit: { createdBy: (reply1?.post?.audit?.createdBy ?? "") } },
      }),
      webhooksWebhookEndpointQueryServiceApi.LookupWebhookEndpointResponse.fromPartial({
        webhookEndpoint: { webhookEndpointId: (req?.webhookEndpointId ?? "") },
      }),
    );
  }

  /**
   * Returns a webhook endpoint.
   */
  async peekWebhookEndpoint(req: webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointRequest): Promise<webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointResponse> {
    validateContext(req.context);
    if (!req.webhookEndpointId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_endpoint_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekWebhookEndpoint", req);
    this.logger.info("peek_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityModerationValidationServiceApi.NormalizeModerationRequest.fromPartial({
      context: input1?.context,
      details: { contact: { email: (input1?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<communityModerationValidationServiceApi.NormalizeModerationRequest, communityModerationValidationServiceApi.NormalizeModerationResponse> =
      (input, done) => this.communityModerationValidationClient.normalizeModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationValidationServiceApi.NormalizeModerationRequest, communityModerationValidationServiceApi.NormalizeModerationResponse>(invoke1, request1);
    return mergeResponses(
      webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          owner: { displayName: (reply1?.moderation?.assignee?.displayName ?? "") },
        },
      }),
      webhooksWebhookEndpointQueryServiceApi.PeekWebhookEndpointResponse.fromPartial({
        webhookEndpoint: { webhookEndpointId: (req?.webhookEndpointId ?? "") },
      }),
    );
  }

  /**
   * Returns several webhook endpoints at once.
   */
  async resolveWebhookEndpoints(req: webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsRequest): Promise<webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveWebhookEndpoints", req);
    this.logger.info("resolve_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = routingRouteCalculationServiceApi.RecalculateRoutesRequest.fromPartial({
      context: req?.context,
      route: {
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        issuedAt: req?.context?.deadline,
        metadata: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const cloned1: routingRouteCalculationServiceApi.RecalculateRoutesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<routingRouteCalculationServiceApi.RecalculateRoutesRequest, routingRouteCalculationServiceApi.RecalculateRoutesResponse> =
      (input, done) => this.routingRouteCalculationClient.recalculateRoutes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<routingRouteCalculationServiceApi.RecalculateRoutesRequest, routingRouteCalculationServiceApi.RecalculateRoutesResponse>(invoke1, cloned1);
    return webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsResponse.fromPartial({
      webhookEndpoints: [{ audit: { createdAt: reply1?.route?.audit?.createdAt } }],
    });
  }

  /**
   * Lists webhook endpoints a page at a time.
   */
  async suggestWebhookEndpoints(req: webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsRequest): Promise<webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestWebhookEndpoints", req);
    this.logger.info("suggest_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        ownerId: (req?.filter?.ownerId ?? ""),
        query: (req?.filter?.query ?? ""),
      },
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const decoded1 = authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest.fromJSON(
      JSON.parse(JSON.stringify(authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest.toJSON(request1))),
    );
    const invoke1: Unary<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.countAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse>(invoke1, decoded1);
    const request2 = webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
      webhookSecret: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.ValidateWebhookSecretRequest",
      value: Buffer.from(webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest.encode(request2).finish()),
    });
    const unpacked2 = webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest.decode(envelope2.value);
    const invoke2: Unary<webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient.validateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsResponse.fromPartial({
        webhookEndpoints: [{
          audit: { createdBy: (reply2?.webhookSecret?.audit?.createdBy ?? "") },
          owner: { displayName: (reply2?.webhookSecret?.holder?.displayName ?? "") },
        }],
      }),
    );
  }

  /**
   * Summarizes a webhook endpoint.
   */
  async summarizeWebhookEndpoints(req: webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsRequest): Promise<webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeWebhookEndpoints", req);
    this.logger.info("summarize_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
      webhookSecret: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        holder: { webhookEndpointId: (req?.webhookEndpointId ?? "") },
      },
    });
    const client1 = this.clients.get<webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient>("acme.webhooks.v1.WebhookSecretCalculationService");
    const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse> =
      (input, done) => client1.explainWebhookSecretCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse>(invoke1, request1);
    const request2 = webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: { audit: { updatedBy: (reply1?.webhookSecret?.audit?.updatedBy ?? "") } },
    });
    const invoke2: Unary<webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient.validateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.webhookSecret?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply2?.webhookSecret?.labels ?? {}))),
        ownerId: (reply2?.webhookSecret?.holder?.webhookEndpointId ?? ""),
      },
    });
    const invoke3: Unary<notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest, notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.listSubscriptionWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest, notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      webhooksWebhookEndpointQueryServiceApi.SummarizeWebhookEndpointsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
