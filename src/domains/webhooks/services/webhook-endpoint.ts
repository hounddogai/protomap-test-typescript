/**
 * Manages webhook endpoints: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as driversDriverCalculationServiceApi from "../../../../.cache/proto/acme/drivers/v1/driver_calculation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as pipelinesPipelineCalculationServiceApi from "../../../../.cache/proto/acme/pipelines/v1/pipeline_calculation_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as webhooksWebhookEndpointServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toWebhookEndpointRecord } from "../data/records.js";
import { WebhooksRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook endpoint operations and persist audit data.
 */
@injectable()
export class WebhookEndpointWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.drivers.v1.DriverCalculationService") private readonly driversDriverCalculationClient: driversDriverCalculationServiceApi.DriverCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("grpc:acme.pipelines.v1.PipelineCalculationService") private readonly pipelinesPipelineCalculationClient: pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryQueryService") private readonly webhooksWebhookDeliveryQueryClient: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryValidationService") private readonly webhooksWebhookDeliveryValidationClient: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of webhook endpoints and answers once at the end.
   */
  async batchCreateWebhookEndpoints(req: webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsRequest): Promise<webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateWebhookEndpoints", req);
    this.logger.info("batch_create_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected1_1 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.format ?? "");
        break;
      default:
        selected1_1 = "";
    }
    let selected1_2: Record<string, string> | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_2 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.specs ?? {});
        break;
      default:
        selected1_2 = {};
    }
    const request1 = webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      details: {
        filters: (selected1_2 ?? {}),
        format: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse> =
      (input, done) => this.webhooksWebhookDeliveryQueryClient.summarizeWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SummarizeWebhookDeliveriesResponse>(invoke1, request1);
    const request2 = localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: {
          recipient: (((choice) => choice?.$case === "address" ? choice.address : undefined)((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.locator)?.recipient ?? ""),
        } },
        audit: {
          etag: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? ""),
        },
      },
    });
    const invoke2: Unary<localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.quoteTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply2?.translationKey?.owner?.email ?? "") } },
    });
    const reply3 = await this.workQueue.enqueue<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse>(
      "acme.webhooks.v1.WebhookEndpointService/BatchCreateWebhookEndpoints:2", request3,
    );
    let selected4_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected4_1 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.updatedBy ?? "");
        break;
      default:
        selected4_1 = "";
    }
    let selected4_2: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected4_2 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.owner?.displayName ?? "");
        break;
      default:
        selected4_2 = "";
    }
    let selected4_4: string | undefined;
    switch (reply2?.translationKey?.locator?.$case) {
      case "address":
        selected4_4 = ((reply2?.translationKey?.locator?.$case === "address" ? reply2?.translationKey?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected4_4 = "";
    }
    const request4 = webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest.fromPartial({
      context: req?.context,
      details: { destination: { countryCode: (selected4_4 ?? "") } },
      webhookSecret: {
        audit: { updatedBy: (selected4_1 ?? "") },
        contact: { email: (reply2?.translationKey?.owner?.email ?? "") },
        holder: { displayName: (selected4_2 ?? "") },
      },
    });
    const invoke4: Unary<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.simulateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.createdBy ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsResponse.fromPartial({
        rejections: [{
          webhookEndpointId: (reply4?.webhookSecret?.holder?.webhookEndpointId ?? ""),
        }],
      }),
    );
  }

  /**
   * Returns several webhook endpoints at once.
   */
  async batchGetWebhookEndpoints(req: webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsRequest): Promise<webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetWebhookEndpoints", req);
    this.logger.info("batch_get_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      webhookEndpoint: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const invoke1: Unary<webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest, webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.explainWebhookEndpointDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } });
  }

  /**
   * Creates a webhook endpoint.
   */
  async cloneWebhookEndpoint(req: webhooksWebhookEndpointServiceApi.CloneWebhookEndpointRequest): Promise<webhooksWebhookEndpointServiceApi.CloneWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "CloneWebhookEndpoint", req);
    this.logger.info("clone_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.locality ?? ""),
        },
      },
      notificationTemplate: {
        audit: { updatedAt: req?.webhookEndpoint?.audit?.updatedAt },
        billingAddress: {
          postalCode: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.postalCode ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.recalculateNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = pipelinesPipelineCalculationServiceApi.SimulatePipelineRequest.fromPartial({
      context: req?.context,
      pipeline: {
        participants: [{ contact: { email: (req?.webhookEndpoint?.owner?.email ?? "") } }],
      },
    });
    const invoke2: Unary<pipelinesPipelineCalculationServiceApi.SimulatePipelineRequest, pipelinesPipelineCalculationServiceApi.SimulatePipelineResponse> =
      (input, done) => this.pipelinesPipelineCalculationClient.simulatePipeline(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: { audit: { createdAt: reply2?.pipeline?.audit?.createdAt } },
    });
    const method3 = "simulateWebhookSecret" as const;
    const invoke3: Unary<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse>(invoke3, request3);
    const request4 = webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        audit: { etag: (reply2?.pipeline?.audit?.etag ?? "") },
        funding: { $case: "card", card: {
          holderName: ((reply3?.webhookSecret?.funding?.$case === "card" ? reply3?.webhookSecret?.funding.card : undefined)?.holderName ?? ""),
          network: ((reply1?.notificationTemplate?.settlement?.$case === "card" ? reply1?.notificationTemplate?.settlement.card : undefined)?.network ?? ""),
        } },
      },
    });
    const proxy4 = forwarding(this.webhooksWebhookSecretCalculationClient);
    const invoke4: Unary<webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse> =
      (input, done) => proxy4.quoteWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointServiceApi.CloneWebhookEndpointResponse.fromPartial({
        result: { status: (reply1?.result?.status ?? "") },
        webhookEndpoint: {
          owner: {
            displayName: (reply1?.notificationTemplate?.counterparty?.displayName ?? ""),
          },
        },
      }),
      webhooksWebhookEndpointServiceApi.CloneWebhookEndpointResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      webhooksWebhookEndpointServiceApi.CloneWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          owner: { displayName: (reply3?.webhookSecret?.holder?.displayName ?? "") },
        },
      }),
      webhooksWebhookEndpointServiceApi.CloneWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          audit: { etag: (reply4?.webhookSecret?.audit?.etag ?? "") },
          owner: { displayName: (reply4?.webhookSecret?.holder?.displayName ?? "") },
        },
      }),
      webhooksWebhookEndpointServiceApi.CloneWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          capacity: (req?.webhookEndpoint?.capacity ?? 0),
          status: req?.webhookEndpoint?.status,
        },
      }),
    );
  }

  /**
   * Creates a webhook endpoint.
   */
  async createWebhookEndpoint(req: webhooksWebhookEndpointServiceApi.CreateWebhookEndpointRequest): Promise<webhooksWebhookEndpointServiceApi.CreateWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "CreateWebhookEndpoint", req);
    this.logger.info("create_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.webhookEndpoint?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = venuesVenueQueryServiceApi.SuggestVenuesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookEndpoint?.audit?.updatedAt,
        ownerId: (req?.webhookEndpoint?.components?.["primary"]?.componentId ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<venuesVenueQueryServiceApi.SuggestVenuesRequest, venuesVenueQueryServiceApi.SuggestVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient.suggestVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueQueryServiceApi.SuggestVenuesRequest, venuesVenueQueryServiceApi.SuggestVenuesResponse>(invoke1, request1);
    const request2 = searchSearchIndexQueryServiceApi.ExportSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookEndpoint?.audit?.createdAt,
        region: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream2 = this.searchSearchIndexQueryClient.exportSearchIndexes(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? searchSearchIndexQueryServiceApi.ExportSearchIndexesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointServiceApi.CreateWebhookEndpointResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      webhooksWebhookEndpointServiceApi.CreateWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          code: (req?.webhookEndpoint?.code ?? ""),
          specs: (req?.webhookEndpoint?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Deletes a webhook endpoint.
   */
  async deleteWebhookEndpoint(req: webhooksWebhookEndpointServiceApi.DeleteWebhookEndpointRequest): Promise<webhooksWebhookEndpointServiceApi.DeleteWebhookEndpointResponse> {
    validateContext(req.context);
    if (!req.webhookEndpointId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_endpoint_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteWebhookEndpoint", req);
    this.logger.info("delete_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
      webhookSecret: {
        audit: { etag: (req?.etag ?? "") },
        contact: { email: (req?.context?.actor?.email ?? "") },
        holder: { webhookEndpointId: (req?.webhookEndpointId ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.calculateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest.fromPartial({
      context: input2?.context,
      filter: {
        createdAfter: reply1?.webhookSecret?.openedAt,
        labels: Object.fromEntries(Object.entries((reply1?.webhookSecret?.labels ?? {}))),
      },
    });
    const invoke2: Unary<searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest, searchSearchIndexQueryServiceApi.BrowseSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.browseSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest, searchSearchIndexQueryServiceApi.BrowseSearchIndexesResponse>(invoke2, request2);
    const request3 = authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((reply1?.webhookSecret?.labels ?? {}))),
      },
    });
    const cloned3: authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.countAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse>(invoke3, cloned3);
    return mergeResponses(
      webhooksWebhookEndpointServiceApi.DeleteWebhookEndpointResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      webhooksWebhookEndpointServiceApi.DeleteWebhookEndpointResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      webhooksWebhookEndpointServiceApi.DeleteWebhookEndpointResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
    );
  }

  /**
   * Returns a webhook endpoint.
   */
  async getWebhookEndpoint(req: webhooksWebhookEndpointServiceApi.GetWebhookEndpointRequest): Promise<webhooksWebhookEndpointServiceApi.GetWebhookEndpointResponse> {
    validateContext(req.context);
    if (!req.webhookEndpointId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_endpoint_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetWebhookEndpoint", req);
    this.logger.info("get_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    return webhooksWebhookEndpointServiceApi.GetWebhookEndpointResponse.fromPartial({
      webhookEndpoint: { webhookEndpointId: (req?.webhookEndpointId ?? "") },
    });
  }

  /**
   * Lists webhook endpoints a page at a time.
   */
  async listWebhookEndpoints(req: webhooksWebhookEndpointServiceApi.ListWebhookEndpointsRequest): Promise<webhooksWebhookEndpointServiceApi.ListWebhookEndpointsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListWebhookEndpoints", req);
    this.logger.info("list_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = driversDriverCalculationServiceApi.SimulateDriverRequest.fromPartial({
      context: req?.context,
      driver: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        primaryAddress: { region: (req?.filter?.region ?? "") },
      },
    });
    const decoded1 = driversDriverCalculationServiceApi.SimulateDriverRequest.fromJSON(
      JSON.parse(JSON.stringify(driversDriverCalculationServiceApi.SimulateDriverRequest.toJSON(request1))),
    );
    const invoke1: Unary<driversDriverCalculationServiceApi.SimulateDriverRequest, driversDriverCalculationServiceApi.SimulateDriverResponse> =
      (input, done) => this.driversDriverCalculationClient.simulateDriver(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<driversDriverCalculationServiceApi.SimulateDriverRequest, driversDriverCalculationServiceApi.SimulateDriverResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookEndpointServiceApi.ListWebhookEndpointsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } });
  }

  /**
   * Lists webhook endpoints a page at a time.
   */
  async searchWebhookEndpoints(req: webhooksWebhookEndpointServiceApi.SearchWebhookEndpointsRequest): Promise<webhooksWebhookEndpointServiceApi.SearchWebhookEndpointsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchWebhookEndpoints", req);
    this.logger.info("search_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.ExplainWebhookSecretCalculationRequest",
      value: Buffer.from(webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.encode(request1).finish()),
    });
    const unpacked1 = webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.decode(envelope1.value);
    const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.explainWebhookSecretCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookEndpointServiceApi.SearchWebhookEndpointsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } });
  }

  /**
   * Changes a webhook endpoint.
   */
  async updateWebhookEndpoint(req: webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointRequest): Promise<webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "UpdateWebhookEndpoint", req);
    this.logger.info("update_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.webhookEndpoint?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = personalizationRecommendationValidationServiceApi.LintRecommendationsRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: { updatedAt: req?.webhookEndpoint?.audit?.updatedAt },
        billingAddress: { postalCode: (selected1_1 ?? "") },
      },
    });
    const invoke1: Unary<personalizationRecommendationValidationServiceApi.LintRecommendationsRequest, personalizationRecommendationValidationServiceApi.LintRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.lintRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationValidationServiceApi.LintRecommendationsRequest, personalizationRecommendationValidationServiceApi.LintRecommendationsResponse>(invoke1, request1);
    const request2 = communityForumServiceApi.CloneForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { etag: (req?.webhookEndpoint?.audit?.etag ?? "") },
            location: {
              countryCode: (reply1?.recommendation?.billingAddress?.countryCode ?? ""),
            },
          }],
        }],
      },
    });
    const invoke2: Unary<communityForumServiceApi.CloneForumRequest, communityForumServiceApi.CloneForumResponse> =
      (input, done) => this.communityForumClient.cloneForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<communityForumServiceApi.CloneForumRequest, communityForumServiceApi.CloneForumResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.countryCode ?? ""),
        },
      },
      webhookSecret: {
        audit: {
          createdBy: (reply1?.recommendation?.audit?.createdBy ?? ""),
          updatedBy: (reply2?.forum?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke3: Unary<webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest, webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.recalculateWebhookSecrets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest, webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.webhookEndpoint?.audit?.updatedBy ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointResponse.fromPartial({
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
        webhookEndpoint: { name: (reply2?.forum?.name ?? "") },
      }),
      webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointResponse.fromPartial({
        webhookEndpoint: { audit: { createdBy: (reply3?.webhookSecret?.audit?.createdBy ?? "") } },
      }),
      webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          code: (req?.webhookEndpoint?.code ?? ""),
          specs: (req?.webhookEndpoint?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Streams the changes of webhook endpoints as they happen.
   */
  async watchWebhookEndpoints(req: webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsRequest): Promise<webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchWebhookEndpoints", req);
    this.logger.info("watch_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
    });
    const invoke1: Unary<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.countAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("WatchWebhookEndpoints.CountAccessPolicies", () => call<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse>(invoke1, request1));
    const request2 = webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.subscriber?.email ?? ""),
          name: req?.subscriber?.name,
        },
      },
    });
    const invoke2: Unary<webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest, webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.lintWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsResponse.fromPartial({
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
        webhookEndpoint: {
          webhookEndpointId: (reply2?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
        },
      }),
      webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsResponse.fromPartial({ webhookEndpoint: { owner: { email: (req?.subscriber?.email ?? "") } } }),
    );
  }
}

/**
 * The gRPC boundary for WebhookEndpointService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookEndpointHandler {
  constructor(@inject(WebhookEndpointWorkflow) private readonly workflow: WebhookEndpointWorkflow) {}

  /**
   * Takes a stream of webhook endpoints and answers once at the end.
   */
  batchCreateWebhookEndpoints = clientStream<webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsResponse>(
    (request) => this.workflow.batchCreateWebhookEndpoints(request), () => webhooksWebhookEndpointServiceApi.BatchCreateWebhookEndpointsResponse.fromPartial({}),
  );

  /**
   * Returns several webhook endpoints at once.
   */
  batchGetWebhookEndpoints = unary<webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.BatchGetWebhookEndpointsResponse>(
    (request) => this.workflow.batchGetWebhookEndpoints(request),
  );

  /**
   * Creates a webhook endpoint.
   */
  cloneWebhookEndpoint = (call: ServerUnaryCall<webhooksWebhookEndpointServiceApi.CloneWebhookEndpointRequest, webhooksWebhookEndpointServiceApi.CloneWebhookEndpointResponse>, done: sendUnaryData<webhooksWebhookEndpointServiceApi.CloneWebhookEndpointResponse>): void => {
    void this.workflow.cloneWebhookEndpoint(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Creates a webhook endpoint.
   */
  createWebhookEndpoint = unary<webhooksWebhookEndpointServiceApi.CreateWebhookEndpointRequest, webhooksWebhookEndpointServiceApi.CreateWebhookEndpointResponse>(
    (request) => this.workflow.createWebhookEndpoint(request),
  );

  /**
   * Deletes a webhook endpoint.
   */
  deleteWebhookEndpoint = unary<webhooksWebhookEndpointServiceApi.DeleteWebhookEndpointRequest, webhooksWebhookEndpointServiceApi.DeleteWebhookEndpointResponse>(
    (request) => this.workflow.deleteWebhookEndpoint(request),
  );

  /**
   * Returns a webhook endpoint.
   */
  getWebhookEndpoint = (call: ServerUnaryCall<webhooksWebhookEndpointServiceApi.GetWebhookEndpointRequest, webhooksWebhookEndpointServiceApi.GetWebhookEndpointResponse>, done: sendUnaryData<webhooksWebhookEndpointServiceApi.GetWebhookEndpointResponse>): void => {
    void this.workflow.getWebhookEndpoint(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists webhook endpoints a page at a time.
   */
  listWebhookEndpoints = unary<webhooksWebhookEndpointServiceApi.ListWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.ListWebhookEndpointsResponse>(
    (request) => this.workflow.listWebhookEndpoints(request),
  );

  /**
   * Lists webhook endpoints a page at a time.
   */
  searchWebhookEndpoints = unary<webhooksWebhookEndpointServiceApi.SearchWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.SearchWebhookEndpointsResponse>(
    (request) => this.workflow.searchWebhookEndpoints(request),
  );

  /**
   * Changes a webhook endpoint.
   */
  updateWebhookEndpoint = (call: ServerUnaryCall<webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointRequest, webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointResponse>, done: sendUnaryData<webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointResponse>): void => {
    void this.workflow.updateWebhookEndpoint(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of webhook endpoints as they happen.
   */
  watchWebhookEndpoints = serverStream<webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.WatchWebhookEndpointsResponse>(
    (request) => this.workflow.watchWebhookEndpoints(request),
  );
}

export function implementation(handler: WebhookEndpointHandler): webhooksWebhookEndpointServiceApi.WebhookEndpointServiceServer {
  return {
    batchCreateWebhookEndpoints: handler.batchCreateWebhookEndpoints,
    batchGetWebhookEndpoints: handler.batchGetWebhookEndpoints,
    cloneWebhookEndpoint: handler.cloneWebhookEndpoint,
    createWebhookEndpoint: handler.createWebhookEndpoint,
    deleteWebhookEndpoint: handler.deleteWebhookEndpoint,
    getWebhookEndpoint: handler.getWebhookEndpoint,
    listWebhookEndpoints: handler.listWebhookEndpoints,
    searchWebhookEndpoints: handler.searchWebhookEndpoints,
    updateWebhookEndpoint: handler.updateWebhookEndpoint,
    watchWebhookEndpoints: handler.watchWebhookEndpoints,
  };
}
