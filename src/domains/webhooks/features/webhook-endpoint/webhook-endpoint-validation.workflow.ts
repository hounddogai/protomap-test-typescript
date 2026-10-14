/**
 * Checks webhook endpoints against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as communityPostValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as documentsDocumentServiceApi from "../../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as identityUserValidationServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as modelregistryRegisteredModelCalculationServiceApi from "../../../../../.cache/proto/acme/modelregistry/v1/registered_model_calculation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as venuesVenueQueryServiceApi from "../../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toWebhookEndpointRecord } from "../../data/records.js";
import { WebhooksRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook endpoint operations and persist audit data.
 */
@injectable()
export class WebhookEndpointValidationWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobValidationService") private readonly localizationTranslationJobValidationClient: localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient,
    @inject("grpc:acme.modelregistry.v1.RegisteredModelCalculationService") private readonly modelregistryRegisteredModelCalculationClient: modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a webhook endpoint.
   */
  async checkWebhookEndpointEligibility(req: webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityRequest): Promise<webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "CheckWebhookEndpointEligibility", req);
    this.logger.info("check_webhook_endpoint_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueQueryServiceApi.SummarizeVenuesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const reply1 = await this.workQueue.enqueue<venuesVenueQueryServiceApi.SummarizeVenuesRequest, venuesVenueQueryServiceApi.SummarizeVenuesResponse>(
      "acme.webhooks.v1.WebhookEndpointValidationService/CheckWebhookEndpointEligibility:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityResponse.fromPartial({
        webhookEndpoint: {
          specs: (req?.webhookEndpoint?.specs ?? {}),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a webhook endpoint.
   */
  async explainWebhookEndpointDecision(req: webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest): Promise<webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "ExplainWebhookEndpointDecision", req);
    this.logger.info("explain_webhook_endpoint_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserValidationServiceApi.NormalizeUserRequest.fromPartial({
      context: req?.context,
      user: {
        audit: { createdBy: (req?.webhookEndpoint?.audit?.createdBy ?? "") },
        relationshipManager: { displayName: (req?.webhookEndpoint?.owner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<identityUserValidationServiceApi.NormalizeUserRequest, identityUserValidationServiceApi.NormalizeUserResponse> =
      (input, done) => this.identityUserValidationClient.normalizeUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<identityUserValidationServiceApi.NormalizeUserRequest, identityUserValidationServiceApi.NormalizeUserResponse>(invoke1, request1));
    const request2 = featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { period: reply1?.user?.preferences?.quietHours },
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.summarizeFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = personalizationProfileQueryServiceApi.SuggestProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.outcome?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.webhookEndpoint?.specs ?? {}))),
        region: (reply1?.user?.primaryAddress?.region ?? ""),
      },
    });
    const invoke3: Unary<personalizationProfileQueryServiceApi.SuggestProfilesRequest, personalizationProfileQueryServiceApi.SuggestProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.suggestProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    const request4 = localizationLocaleValidationServiceApi.ScoreLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (reply1?.user?.primaryAddress?.countryCode ?? "") },
      },
    });
    const invoke4: Unary<localizationLocaleValidationServiceApi.ScoreLocaleRequest, localizationLocaleValidationServiceApi.ScoreLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.scoreLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke4 = promisify(invoke4);
    const reply4 = requireReply(await asyncInvoke4(request4));
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse.fromPartial({
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
        webhookEndpoint: { audit: { updatedAt: reply1?.user?.audit?.updatedAt } },
      }),
      webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse.fromPartial({
        result: {
          message: (reply4?.result?.message ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse.fromPartial({
        webhookEndpoint: {
          owner: req?.webhookEndpoint?.owner,
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a webhook endpoint.
   */
  async getWebhookEndpointRules(req: webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest): Promise<webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse> {
    validateContext(req.context);
    if (!req.webhookEndpointId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_endpoint_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetWebhookEndpointRules", req);
    this.logger.info("get_webhook_endpoint_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobValidationServiceApi.ScoreTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        audit: { createdAt: req?.context?.deadline },
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const method1 = "scoreTranslationJob" as const;
    const invoke1: Unary<localizationTranslationJobValidationServiceApi.ScoreTranslationJobRequest, localizationTranslationJobValidationServiceApi.ScoreTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobValidationServiceApi.ScoreTranslationJobRequest, localizationTranslationJobValidationServiceApi.ScoreTranslationJobResponse>(invoke1, request1);
    const request2 = documentsDocumentServiceApi.BatchGetDocumentsRequest.fromPartial({ context: req?.context });
    const proxy2 = forwarding(this.documentsDocumentClient);
    const invoke2: Unary<documentsDocumentServiceApi.BatchGetDocumentsRequest, documentsDocumentServiceApi.BatchGetDocumentsResponse> =
      (input, done) => proxy2.batchGetDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<documentsDocumentServiceApi.BatchGetDocumentsRequest, documentsDocumentServiceApi.BatchGetDocumentsResponse>(invoke2, request2);
    return mergeResponses(
      webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse.fromPartial({
        webhookEndpoint: { webhookEndpointId: (req?.webhookEndpointId ?? "") },
      }),
    );
  }

  /**
   * Lints a webhook endpoint.
   */
  async lintWebhookEndpoints(req: webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest): Promise<webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "LintWebhookEndpoints", req);
    this.logger.info("lint_webhook_endpoints", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.contact?.email ?? ""),
          phone: (req?.details?.contact?.phone ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest, notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse> =
      (input, done) => this.notificationsNotificationTemplateNotificationClient.notifyNotificationTemplateWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest, notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsResponse.fromPartial({ outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") } }),
      webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsResponse.fromPartial({
        webhookEndpoint: {
          name: (req?.webhookEndpoint?.name ?? ""),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a webhook endpoint.
   */
  async normalizeWebhookEndpoint(req: webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest): Promise<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "NormalizeWebhookEndpoint", req);
    this.logger.info("normalize_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesRequest, notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesResponse> =
      (input, done) => this.notificationsNotificationTemplateNotificationClient.unsubscribeNotificationTemplateUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesRequest, notificationsNotificationTemplateNotificationServiceApi.UnsubscribeNotificationTemplateUpdatesResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest.fromPartial({
      context: input2?.context,
      details: {
        recipient: {
          email: (input2?.details?.contact?.email ?? ""),
          name: input2?.details?.contact?.name,
        },
      },
    });
    const invoke2: Unary<notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesResponse> =
      (input, done) => this.notificationsSubscriptionNotificationClient.unsubscribeSubscriptionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          audit: { createdBy: (reply1?.notificationTemplate?.audit?.createdBy ?? "") },
        },
      }),
      webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse.fromPartial({
        webhookEndpoint: { owner: { email: (reply2?.subscription?.owner?.email ?? "") } },
      }),
      webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          code: (req?.webhookEndpoint?.code ?? ""),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a webhook endpoint.
   */
  async previewWebhookEndpoint(req: webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointRequest): Promise<webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "PreviewWebhookEndpoint", req);
    this.logger.info("preview_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.webhookEndpoint?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = modelregistryRegisteredModelCalculationServiceApi.SimulateRegisteredModelRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (selected1_1 ?? "") } },
      registeredModel: { owner: { email: (req?.webhookEndpoint?.owner?.email ?? "") } },
    });
    const invoke1: Unary<modelregistryRegisteredModelCalculationServiceApi.SimulateRegisteredModelRequest, modelregistryRegisteredModelCalculationServiceApi.SimulateRegisteredModelResponse> =
      (input, done) => this.modelregistryRegisteredModelCalculationClient.simulateRegisteredModel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<modelregistryRegisteredModelCalculationServiceApi.SimulateRegisteredModelRequest, modelregistryRegisteredModelCalculationServiceApi.SimulateRegisteredModelResponse>(invoke1, request1);
    const request2 = notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest.fromPartial({
      context: req?.context,
      notification: {
        requester: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const decoded2 = notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest.toJSON(request2))),
    );
    const invoke2: Unary<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.compareNotificationVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointResponse.fromPartial({
        outcome: { status: (reply2?.outcome?.status ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      webhooksWebhookEndpointValidationServiceApi.PreviewWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          status: req?.webhookEndpoint?.status,
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a webhook endpoint.
   */
  async scoreWebhookEndpoint(req: webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointRequest): Promise<webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "ScoreWebhookEndpoint", req);
    this.logger.info("score_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: { audit: { etag: (req?.webhookEndpoint?.audit?.etag ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.ValidateTranslationJobRequest",
      value: Buffer.from(localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest.encode(request1).finish()),
    });
    const unpacked1 = localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest.decode(envelope1.value);
    const invoke1: Unary<localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest, localizationTranslationJobValidationServiceApi.ValidateTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobValidationClient.validateTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest, localizationTranslationJobValidationServiceApi.ValidateTranslationJobResponse>(invoke1, unpacked1);
    let selected2_1: string | undefined;
    switch (reply1?.translationJob?.origin?.$case) {
      case "customer":
        selected2_1 = ((reply1?.translationJob?.origin?.$case === "customer" ? reply1?.translationJob?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { displayName: (selected2_1 ?? "") },
        audit: { updatedAt: reply1?.translationJob?.audit?.updatedAt },
      },
    });
    const invoke2: Unary<notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest, notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.recordNotificationVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest, notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointResponse.fromPartial({
        webhookEndpoint: { owner: { email: (reply1?.translationJob?.assignee?.email ?? "") } },
      }),
      webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointResponse.fromPartial({
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
        webhookEndpoint: { owner: { email: (reply2?.notification?.requester?.email ?? "") } },
      }),
      webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          code: (req?.webhookEndpoint?.code ?? ""),
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a webhook endpoint.
   */
  async validateWebhookEndpoint(req: webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest): Promise<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse> {
    validateContext(req.context);
    if (req.webhookEndpoint) {
      await this.repository.save(toWebhookEndpointRecord(req.context.tenantId, req.webhookEndpoint));
    }
    await this.repository.record(req.context.tenantId, "ValidateWebhookEndpoint", req);
    this.logger.info("validate_webhook_endpoint", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest.fromPartial({
      context: req?.context,
      recommendation: { audit: { createdAt: req?.webhookEndpoint?.audit?.createdAt } },
    });
    const invoke1: Unary<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest, personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.checkRecommendationEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest, personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = communityPostValidationServiceApi.ScorePostRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          recipient: ((req?.webhookEndpoint?.locator?.$case === "address" ? req?.webhookEndpoint?.locator.address : undefined)?.recipient ?? ""),
        },
      },
      post: {
        counterparty: { displayName: (req?.webhookEndpoint?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<communityPostValidationServiceApi.ScorePostRequest, communityPostValidationServiceApi.ScorePostResponse> =
      (input, done) => this.communityPostValidationClient.scorePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<communityPostValidationServiceApi.ScorePostRequest, communityPostValidationServiceApi.ScorePostResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse.fromPartial({
        result: { details: (reply2?.result?.details ?? {}) },
        webhookEndpoint: { audit: { createdBy: (reply2?.post?.audit?.createdBy ?? "") } },
      }),
      webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse.fromPartial({
        webhookEndpoint: {
          status: req?.webhookEndpoint?.status,
          webhookEndpointId: (req?.webhookEndpointId ?? ""),
        },
      }),
    );
  }
}
