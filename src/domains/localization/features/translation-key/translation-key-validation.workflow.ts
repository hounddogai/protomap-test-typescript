/**
 * Checks translation keys against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as communityPostCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as deliveriesDeliveryServiceApi from "../../../../../.cache/proto/acme/deliveries/v1/delivery_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as fuelFuelCardCalculationServiceApi from "../../../../../.cache/proto/acme/fuel/v1/fuel_card_calculation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toTranslationKeyRecord } from "../../data/records.js";
import { LocalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation key operations and persist audit data.
 */
@injectable()
export class TranslationKeyValidationWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.deliveries.v1.DeliveryService") private readonly deliveriesDeliveryClient: deliveriesDeliveryServiceApi.DeliveryServiceClient,
    @inject("grpc:acme.experiments.v1.VariantValidationService") private readonly experimentsVariantValidationClient: experimentsVariantValidationServiceApi.VariantValidationServiceClient,
    @inject("grpc:acme.fuel.v1.FuelCardCalculationService") private readonly fuelFuelCardCalculationClient: fuelFuelCardCalculationServiceApi.FuelCardCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a translation key.
   */
  async checkTranslationKeyEligibility(req: localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest): Promise<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "CheckTranslationKeyEligibility", req);
    this.logger.info("check_translation_key_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        components: { primary: {
          quantity: (req?.translationKey?.components?.["primary"]?.quantity ?? 0),
        } },
        dimensions: { weight: (req?.translationKey?.dimensions?.weight ?? 0) },
        owner: { email: (req?.translationKey?.owner?.email ?? "") },
      },
    });
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.estimateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse.fromPartial({
        result: { details: (reply1?.result?.details ?? {}) },
        translationKey: { owner: reply1?.translationKey?.owner },
      }),
      localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse.fromPartial({
        translationKey: {
          name: (req?.translationKey?.name ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a translation key.
   */
  async explainTranslationKeyDecision(req: localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionRequest): Promise<localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "ExplainTranslationKeyDecision", req);
    this.logger.info("explain_translation_key_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantValidationServiceApi.NormalizeVariantRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
      variant: {
        audit: {
          etag: (req?.translationKey?.audit?.etag ?? ""),
          updatedBy: (req?.translationKey?.audit?.updatedBy ?? ""),
        },
        owner: { userId: (req?.translationKey?.owner?.userId ?? "") },
      },
    });
    const invoke1: Unary<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse> =
      (input, done) => this.experimentsVariantValidationClient.normalizeVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ExplainTranslationKeyDecision.NormalizeVariant", () => call<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse>(invoke1, request1));
    const request2 = localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesRequest.fromPartial({
      context: req?.context,
      translationKeyId: (req?.translationKey?.translationKeyId ?? ""),
    });
    const invoke2: Unary<localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesRequest, localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.getTranslationKeyRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse.fromPartial({
        translationKey: { audit: { updatedBy: (reply1?.variant?.audit?.updatedBy ?? "") } },
      }),
      localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse.fromPartial({
        translationKey: {
          dimensions: { height: (reply2?.translationKey?.dimensions?.height ?? 0) },
          owner: { displayName: (reply2?.translationKey?.owner?.displayName ?? "") },
        },
      }),
      localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse.fromPartial({
        translationKey: {
          specs: (req?.translationKey?.specs ?? {}),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a translation key.
   */
  async getTranslationKeyRules(req: localizationTranslationKeyValidationServiceApi.GetTranslationKeyRulesRequest): Promise<localizationTranslationKeyValidationServiceApi.GetTranslationKeyRulesResponse> {
    validateContext(req.context);
    if (!req.translationKeyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_key_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranslationKeyRules", req);
    this.logger.info("get_translation_key_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    return localizationTranslationKeyValidationServiceApi.GetTranslationKeyRulesResponse.fromPartial({ translationKey: { translationKeyId: (req?.translationKeyId ?? "") } });
  }

  /**
   * Normalizes a translation key.
   */
  async normalizeTranslationKey(req: localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyRequest): Promise<localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "NormalizeTranslationKey", req);
    this.logger.info("normalize_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: {
        audit: {
          createdAt: req?.translationKey?.audit?.createdAt,
          updatedAt: req?.translationKey?.audit?.updatedAt,
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>(
      "acme.localization.v1.TranslationKeyValidationService/NormalizeTranslationKey:0", request1,
    );
    let selected2_1: string | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected2_1 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_3: string | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected2_3 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_3 = "";
    }
    let selected2_4: string | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected2_4 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected2_4 = "";
    }
    const request2 = personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.fromPartial({
      context: req?.context,
      details: { destination: { recipient: (selected2_1 ?? "") } },
      recommendation: {
        audit: { updatedAt: req?.translationKey?.audit?.updatedAt },
        billingAddress: {
          locality: (selected2_4 ?? ""),
          region: (selected2_3 ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.estimateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        translationKey: { audit: { createdBy: (reply1?.notification?.audit?.createdBy ?? "") } },
      }),
      localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyResponse.fromPartial({
        translationKey: { audit: { createdAt: reply2?.recommendation?.audit?.createdAt } },
      }),
      localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyResponse.fromPartial({
        translationKey: {
          capacity: (req?.translationKey?.capacity ?? 0),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a translation key.
   */
  async previewTranslationKey(req: localizationTranslationKeyValidationServiceApi.PreviewTranslationKeyRequest): Promise<localizationTranslationKeyValidationServiceApi.PreviewTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "PreviewTranslationKey", req);
    this.logger.info("preview_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: {
          locality: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.locality ?? ""),
        } },
      },
    });
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.recalculateTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = communityPostCalculationServiceApi.CalculatePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { etag: (req?.translationKey?.audit?.etag ?? "") },
        billingAddress: {
          countryCode: ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.countryCode ?? ""),
        },
        counterparty: { displayName: (req?.translationKey?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse> =
      (input, done) => this.communityPostCalculationClient.calculatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = deliveriesDeliveryServiceApi.CloneDeliveryRequest.fromPartial({
      context: req?.context,
      delivery: {
        lines: [{
          quantity: (reply1?.translationKey?.components?.["primary"]?.quantity ?? 0),
        }],
      },
    });
    const invoke3: Unary<deliveriesDeliveryServiceApi.CloneDeliveryRequest, deliveriesDeliveryServiceApi.CloneDeliveryResponse> =
      (input, done) => this.deliveriesDeliveryClient.cloneDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyValidationServiceApi.PreviewTranslationKeyResponse.fromPartial({
        translationKey: {
          dimensions: { weight: (reply1?.translationKey?.dimensions?.weight ?? 0) },
          specs: (reply1?.translationKey?.specs ?? {}),
        },
      }),
      localizationTranslationKeyValidationServiceApi.PreviewTranslationKeyResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      localizationTranslationKeyValidationServiceApi.PreviewTranslationKeyResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      localizationTranslationKeyValidationServiceApi.PreviewTranslationKeyResponse.fromPartial({
        translationKey: {
          capacity: (req?.translationKey?.capacity ?? 0),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a translation key.
   */
  async scoreTranslationKey(req: localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyRequest): Promise<localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "ScoreTranslationKey", req);
    this.logger.info("score_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: { audit: { updatedAt: req?.translationKey?.audit?.updatedAt } },
    });
    const method1 = "estimateTranslationKey" as const;
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse>(invoke1, request1);
    const request2 = experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest.fromPartial({
      context: req?.context,
      variant: {
        audit: {
          createdBy: (reply1?.translationKey?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.translationKey?.audit?.updatedBy ?? ""),
        },
        owner: {
          email: (req?.translationKey?.owner?.email ?? ""),
          userId: (req?.translationKey?.owner?.userId ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.experimentsVariantValidationClient);
    const invoke2: Unary<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse> =
      (input, done) => proxy2.checkVariantEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse>(invoke2, request2);
    const request3 = localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: { region: (req?.details?.destination?.region ?? "") } },
      },
    });
    const invoke3: Unary<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.calculateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse>(invoke3, request3);
    const request4 = notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: {
          createdAt: reply1?.translationKey?.audit?.createdAt,
          updatedBy: (reply1?.translationKey?.audit?.updatedBy ?? ""),
        },
        owner: {
          displayName: (reply3?.translationKey?.owner?.displayName ?? ""),
          email: (reply3?.translationKey?.owner?.email ?? ""),
        },
      },
    });
    const { context: scope4, ...payload4 } = request4;
    const spread4 = { ...payload4, context: scope4 ?
      { ...scope4, baggage: { ...scope4.baggage } } : undefined };
    const invoke4: Unary<notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.startSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.StartSubscriptionWorkflowResponse>(invoke4, spread4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse.fromPartial({
        translationKey: { audit: { updatedAt: reply1?.translationKey?.audit?.updatedAt } },
      }),
      localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse.fromPartial({
        translationKey: { audit: { updatedAt: reply2?.variant?.audit?.updatedAt } },
      }),
      localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse.fromPartial({
        translationKey: {
          categoryPath: (reply3?.translationKey?.categoryPath ?? []),
          owner: { displayName: (reply3?.translationKey?.owner?.displayName ?? "") },
        },
      }),
      localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse.fromPartial({
        result: { status: (reply4?.outcome?.status ?? "") },
        translationKey: { audit: { createdBy: (reply4?.subscription?.audit?.createdBy ?? "") } },
      }),
      localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse.fromPartial({
        translationKey: {
          capacity: (req?.translationKey?.capacity ?? 0),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a translation key.
   */
  async validateTranslationKey(req: localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyRequest): Promise<localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "ValidateTranslationKey", req);
    this.logger.info("validate_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = personalizationProfileCalculationServiceApi.RecalculateProfilesRequest.fromPartial({
      context: input1?.context,
      details: {
        destination: {
          recipient: ((input1?.translationKey?.locator?.$case === "address" ? input1?.translationKey?.locator.address : undefined)?.recipient ?? ""),
        },
      },
      profile: {
        audit: { updatedBy: (input1?.translationKey?.audit?.updatedBy ?? "") },
      },
    });
    const invoke1: Unary<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse> =
      (input, done) => this.personalizationProfileCalculationClient.recalculateProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse>(invoke1, request1);
    let selected2_2: string | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected2_2 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = communityPostCalculationServiceApi.QuotePostRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (reply1?.profile?.primaryAddress?.countryCode ?? "") },
      },
      post: {
        billingAddress: { recipient: (selected2_2 ?? "") },
        counterparty: { displayName: (req?.translationKey?.owner?.displayName ?? "") },
        lines: [{
          quantity: (req?.translationKey?.components?.["primary"]?.quantity ?? 0),
        }],
      },
    });
    const invoke2: Unary<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse> =
      (input, done) => this.communityPostCalculationClient.quotePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse>(invoke2, request2);
    const request3 = fuelFuelCardCalculationServiceApi.CalculateFuelCardRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { postalCode: (reply2?.post?.billingAddress?.postalCode ?? "") },
      },
      fuelCard: {
        audit: { createdBy: (req?.translationKey?.audit?.createdBy ?? "") },
        contact: { phone: (reply1?.profile?.contact?.phone ?? "") },
        holder: { displayName: (req?.translationKey?.owner?.displayName ?? "") },
      },
    });
    const decoded3 = fuelFuelCardCalculationServiceApi.CalculateFuelCardRequest.fromJSON(
      JSON.parse(JSON.stringify(fuelFuelCardCalculationServiceApi.CalculateFuelCardRequest.toJSON(request3))),
    );
    const invoke3: Unary<fuelFuelCardCalculationServiceApi.CalculateFuelCardRequest, fuelFuelCardCalculationServiceApi.CalculateFuelCardResponse> =
      (input, done) => this.fuelFuelCardCalculationClient.calculateFuelCard(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<fuelFuelCardCalculationServiceApi.CalculateFuelCardRequest, fuelFuelCardCalculationServiceApi.CalculateFuelCardResponse>(invoke3, decoded3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyResponse.fromPartial({
        translationKey: { audit: { updatedBy: (reply2?.post?.audit?.updatedBy ?? "") } },
      }),
      localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyResponse.fromPartial({
        translationKey: {
          audit: { updatedBy: (reply3?.fuelCard?.audit?.updatedBy ?? "") },
          owner: { displayName: (reply3?.fuelCard?.holder?.displayName ?? "") },
        },
      }),
      localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyResponse.fromPartial({
        translationKey: {
          name: (req?.translationKey?.name ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }
}
