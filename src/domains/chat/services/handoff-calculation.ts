/**
 * Computes the figures of a handoff, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatHandoffCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as pipelinesPipelineQueryServiceApi from "../../../../.cache/proto/acme/pipelines/v1/pipeline_query_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { GrpcAdapter, call, forwarding, metadataFor, type RequestPort, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toHandoffRecord } from "../data/records.js";
import { ChatRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate handoff operations and persist audit data.
 */
@injectable()
export class HandoffCalculationWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.pipelines.v1.PipelineQueryService") private readonly pipelinesPipelineQueryClient: pipelinesPipelineQueryServiceApi.PipelineQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretValidationService") private readonly webhooksWebhookSecretValidationClient: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a handoff.
   */
  async calculateHandoff(req: chatHandoffCalculationServiceApi.CalculateHandoffRequest): Promise<chatHandoffCalculationServiceApi.CalculateHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "CalculateHandoff", req);
    this.logger.info("calculate_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: {
          locality: (req?.details?.destination?.locality ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        } },
        audit: { createdBy: (req?.handoff?.audit?.createdBy ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse> =
      (input, done) => this.chatChatRoomValidationClient.checkChatRoomEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffCalculationServiceApi.CalculateHandoffResponse.fromPartial({
        handoff: { audit: { updatedBy: (reply1?.chatRoom?.audit?.updatedBy ?? "") } },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      chatHandoffCalculationServiceApi.CalculateHandoffResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          requester: req?.handoff?.requester,
        },
      }),
    );
  }

  /**
   * Compares a handoff.
   */
  async compareHandoffOptions(req: chatHandoffCalculationServiceApi.CompareHandoffOptionsRequest): Promise<chatHandoffCalculationServiceApi.CompareHandoffOptionsResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "CompareHandoffOptions", req);
    this.logger.info("compare_handoff_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.QuoteChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { region: (req?.details?.destination?.region ?? "") } },
        owner: { email: (req?.handoff?.assignee?.email ?? "") },
      },
      context: req?.context,
    });
    const method1 = "quoteChatRoom" as const;
    const invoke1: Unary<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse>(invoke1, request1);
    const results2 = await Promise.all((req?.handoff?.comments ?? []).map(async (item) => {
      const request2 = communityBadgeCalculationServiceApi.SimulateBadgeRequest.fromPartial({
        badge: {
          audit: { createdAt: item?.createdAt },
          owner: { email: (item?.authorEmail ?? "") },
        },
        context: req?.context,
      });
      const invoke2: Unary<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse> =
        (input, done) => this.communityBadgeCalculationClient.simulateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? communityBadgeCalculationServiceApi.SimulateBadgeResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffCalculationServiceApi.CompareHandoffOptionsResponse.fromPartial({
        handoff: {
          audit: {
            createdBy: (reply1?.chatRoom?.audit?.createdBy ?? ""),
            updatedAt: reply1?.chatRoom?.audit?.updatedAt,
          },
        },
      }),
      chatHandoffCalculationServiceApi.CompareHandoffOptionsResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          subject: (req?.handoff?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a handoff.
   */
  async estimateHandoff(req: chatHandoffCalculationServiceApi.EstimateHandoffRequest): Promise<chatHandoffCalculationServiceApi.EstimateHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "EstimateHandoff", req);
    this.logger.info("estimate_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: {
          postalCode: (req?.details?.destination?.postalCode ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        } },
        audit: { etag: (req?.handoff?.audit?.etag ?? "") },
        owner: { displayName: (req?.handoff?.assignee?.displayName ?? "") },
      },
    });
    const proxy1 = forwarding(this.localizationTranslationKeyCalculationClient);
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse> =
      (input, done) => proxy1.estimateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse>(invoke1, request1);
    let selected2_3: string | undefined;
    switch (reply1?.translationKey?.locator?.$case) {
      case "address":
        selected2_3 = ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = personalizationAffinityCalculationServiceApi.CalculateAffinityRequest.fromPartial({
      affinity: { subject: { displayName: (req?.handoff?.assignee?.displayName ?? "") } },
      context: req?.context,
      details: {
        destination: {
          postalCode: (req?.details?.destination?.postalCode ?? ""),
          recipient: (selected2_3 ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationAffinityCalculationServiceApi.CalculateAffinityRequest, personalizationAffinityCalculationServiceApi.CalculateAffinityResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.calculateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityCalculationServiceApi.CalculateAffinityRequest, personalizationAffinityCalculationServiceApi.CalculateAffinityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffCalculationServiceApi.EstimateHandoffResponse.fromPartial({
        handoff: { assignee: { userId: (reply1?.translationKey?.owner?.userId ?? "") } },
      }),
      chatHandoffCalculationServiceApi.EstimateHandoffResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      chatHandoffCalculationServiceApi.EstimateHandoffResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          priority: (req?.handoff?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Explains a handoff.
   */
  async explainHandoffCalculation(req: chatHandoffCalculationServiceApi.ExplainHandoffCalculationRequest): Promise<chatHandoffCalculationServiceApi.ExplainHandoffCalculationResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "ExplainHandoffCalculation", req);
    this.logger.info("explain_handoff_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.CalculateChatRoomRequest.fromPartial({
      chatRoom: {
        audit: {
          createdBy: (req?.handoff?.audit?.createdBy ?? ""),
          updatedAt: req?.handoff?.audit?.updatedAt,
        },
        owner: {
          email: (req?.handoff?.requester?.email ?? ""),
          userId: (req?.handoff?.assignee?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<chatChatRoomCalculationServiceApi.CalculateChatRoomRequest, chatChatRoomCalculationServiceApi.CalculateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.calculateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomCalculationServiceApi.CalculateChatRoomRequest, chatChatRoomCalculationServiceApi.CalculateChatRoomResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = identityUserValidationServiceApi.PreviewUserRequest.fromPartial({
      context: input2?.context,
      details: { contact: { email: (input2?.handoff?.assignee?.email ?? "") } },
      user: {
        contact: { email: (input2?.details?.contact?.email ?? "") },
        relationshipManager: { email: (reply1?.chatRoom?.owner?.email ?? "") },
      },
    });
    const invoke2: Unary<identityUserValidationServiceApi.PreviewUserRequest, identityUserValidationServiceApi.PreviewUserResponse> =
      (input, done) => this.identityUserValidationClient.previewUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserValidationServiceApi.PreviewUserRequest, identityUserValidationServiceApi.PreviewUserResponse>(invoke2, request2);
    const request3 = webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.chatRoom?.owner?.email ?? "") } },
      webhookSecret: { audit: { updatedAt: reply2?.user?.audit?.updatedAt } },
    });
    const cloned3: webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient.previewWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretResponse>(invoke3, cloned3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffCalculationServiceApi.ExplainHandoffCalculationResponse.fromPartial({
        handoff: {
          audit: { etag: (reply1?.chatRoom?.audit?.etag ?? "") },
          requester: { email: (reply1?.chatRoom?.owner?.email ?? "") },
        },
      }),
      chatHandoffCalculationServiceApi.ExplainHandoffCalculationResponse.fromPartial({
        handoff: { requester: { email: (reply2?.user?.contact?.email ?? "") } },
      }),
      chatHandoffCalculationServiceApi.ExplainHandoffCalculationResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      chatHandoffCalculationServiceApi.ExplainHandoffCalculationResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          status: req?.handoff?.status,
        },
      }),
    );
  }

  /**
   * Returns a handoff.
   */
  async getHandoffRates(req: chatHandoffCalculationServiceApi.GetHandoffRatesRequest): Promise<chatHandoffCalculationServiceApi.GetHandoffRatesResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetHandoffRates", req);
    this.logger.info("get_handoff_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    return chatHandoffCalculationServiceApi.GetHandoffRatesResponse.fromPartial({ handoff: { handoffId: (req?.handoffId ?? "") } });
  }

  /**
   * Quotes a handoff.
   */
  async quoteHandoff(req: chatHandoffCalculationServiceApi.QuoteHandoffRequest): Promise<chatHandoffCalculationServiceApi.QuoteHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "QuoteHandoff", req);
    this.logger.info("quote_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleValidationServiceApi.CheckLocaleEligibilityRequest.fromPartial({
      context: req?.context,
      locale: { audit: { createdBy: (req?.handoff?.audit?.createdBy ?? "") } },
    });
    const decoded1 = localizationLocaleValidationServiceApi.CheckLocaleEligibilityRequest.fromJSON(
      JSON.parse(JSON.stringify(localizationLocaleValidationServiceApi.CheckLocaleEligibilityRequest.toJSON(request1))),
    );
    const invoke1: Unary<localizationLocaleValidationServiceApi.CheckLocaleEligibilityRequest, localizationLocaleValidationServiceApi.CheckLocaleEligibilityResponse> =
      (input, done) => this.localizationLocaleValidationClient.checkLocaleEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleValidationServiceApi.CheckLocaleEligibilityRequest, localizationLocaleValidationServiceApi.CheckLocaleEligibilityResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffCalculationServiceApi.QuoteHandoffResponse.fromPartial({
        handoff: { requester: { email: (reply1?.locale?.owner?.email ?? "") } },
      }),
      chatHandoffCalculationServiceApi.QuoteHandoffResponse.fromPartial({
        handoff: {
          customFields: (req?.handoff?.customFields ?? {}),
          handoffId: (req?.handoffId ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a handoff.
   */
  async recalculateHandoffs(req: chatHandoffCalculationServiceApi.RecalculateHandoffsRequest): Promise<chatHandoffCalculationServiceApi.RecalculateHandoffsResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "RecalculateHandoffs", req);
    this.logger.info("recalculate_handoffs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.QuoteChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { locality: (req?.details?.destination?.locality ?? "") } },
      },
      context: req?.context,
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.QuoteChatRoomRequest",
      value: Buffer.from(chatChatRoomCalculationServiceApi.QuoteChatRoomRequest.encode(request1).finish()),
    });
    const unpacked1 = chatChatRoomCalculationServiceApi.QuoteChatRoomRequest.decode(envelope1.value);
    const invoke1: Unary<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.quoteChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse>(invoke1, unpacked1);
    const request2 = pipelinesPipelineQueryServiceApi.ExportPipelinesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.handoff?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const stream2 = this.pipelinesPipelineQueryClient.exportPipelines(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? pipelinesPipelineQueryServiceApi.ExportPipelinesResponse.fromPartial({});
    let selected3_2: string | undefined;
    switch (reply1?.chatRoom?.locator?.$case) {
      case "address":
        selected3_2 = ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected3_2 = "";
    }
    let selected3_3: string | undefined;
    switch (reply1?.chatRoom?.locator?.$case) {
      case "address":
        selected3_3 = ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected3_3 = "";
    }
    const request3 = communityBadgeCalculationServiceApi.RecalculateBadgesRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (selected3_2 ?? ""),
          postalCode: (selected3_3 ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const invoke3: Unary<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse> =
      (input, done) => this.communityBadgeCalculationClient.recalculateBadges(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffCalculationServiceApi.RecalculateHandoffsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      chatHandoffCalculationServiceApi.RecalculateHandoffsResponse.fromPartial({
        handoff: { assignee: { displayName: (reply3?.badge?.owner?.displayName ?? "") } },
      }),
      chatHandoffCalculationServiceApi.RecalculateHandoffsResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          status: req?.handoff?.status,
        },
      }),
    );
  }

  /**
   * Simulates a handoff.
   */
  async simulateHandoff(req: chatHandoffCalculationServiceApi.SimulateHandoffRequest): Promise<chatHandoffCalculationServiceApi.SimulateHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "SimulateHandoff", req);
    this.logger.info("simulate_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleValidationServiceApi.ValidateLocaleRequest.fromPartial({
      context: req?.context,
      locale: { audit: { createdAt: req?.handoff?.audit?.createdAt } },
    });
    const invoke1: Unary<localizationLocaleValidationServiceApi.ValidateLocaleRequest, localizationLocaleValidationServiceApi.ValidateLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.validateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<localizationLocaleValidationServiceApi.ValidateLocaleRequest, localizationLocaleValidationServiceApi.ValidateLocaleResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffCalculationServiceApi.SimulateHandoffResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      chatHandoffCalculationServiceApi.SimulateHandoffResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          priority: (req?.handoff?.priority ?? 0),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for HandoffCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class HandoffCalculationHandler {
  constructor(@inject(HandoffCalculationWorkflow) private readonly workflow: HandoffCalculationWorkflow) {}

  /**
   * Calculates a handoff.
   */
  calculateHandoff = unary<chatHandoffCalculationServiceApi.CalculateHandoffRequest, chatHandoffCalculationServiceApi.CalculateHandoffResponse>(
    (request) => this.workflow.calculateHandoff(request),
  );

  /**
   * Compares a handoff.
   */
  compareHandoffOptions = unary<chatHandoffCalculationServiceApi.CompareHandoffOptionsRequest, chatHandoffCalculationServiceApi.CompareHandoffOptionsResponse>(
    (request) => this.workflow.compareHandoffOptions(request),
  );

  /**
   * Estimates a handoff.
   */
  estimateHandoff = (call: ServerUnaryCall<chatHandoffCalculationServiceApi.EstimateHandoffRequest, chatHandoffCalculationServiceApi.EstimateHandoffResponse>, done: sendUnaryData<chatHandoffCalculationServiceApi.EstimateHandoffResponse>): void => {
    void this.workflow.estimateHandoff(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a handoff.
   */
  explainHandoffCalculation = unary<chatHandoffCalculationServiceApi.ExplainHandoffCalculationRequest, chatHandoffCalculationServiceApi.ExplainHandoffCalculationResponse>(
    (request) => this.workflow.explainHandoffCalculation(request),
  );

  /**
   * Returns a handoff.
   */
  getHandoffRates = unary<chatHandoffCalculationServiceApi.GetHandoffRatesRequest, chatHandoffCalculationServiceApi.GetHandoffRatesResponse>(
    (request) => this.workflow.getHandoffRates(request),
  );

  /**
   * Quotes a handoff.
   */
  quoteHandoff = (call: ServerUnaryCall<chatHandoffCalculationServiceApi.QuoteHandoffRequest, chatHandoffCalculationServiceApi.QuoteHandoffResponse>, done: sendUnaryData<chatHandoffCalculationServiceApi.QuoteHandoffResponse>): void => {
    void this.workflow.quoteHandoff(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalculates a handoff.
   */
  recalculateHandoffs = unary<chatHandoffCalculationServiceApi.RecalculateHandoffsRequest, chatHandoffCalculationServiceApi.RecalculateHandoffsResponse>(
    (request) => this.workflow.recalculateHandoffs(request),
  );

  /**
   * Simulates a handoff.
   */
  simulateHandoff = unary<chatHandoffCalculationServiceApi.SimulateHandoffRequest, chatHandoffCalculationServiceApi.SimulateHandoffResponse>(
    (request) => this.workflow.simulateHandoff(request),
  );
}

export function implementation(handler: HandoffCalculationHandler): chatHandoffCalculationServiceApi.HandoffCalculationServiceServer {
  return {
    calculateHandoff: handler.calculateHandoff,
    compareHandoffOptions: handler.compareHandoffOptions,
    estimateHandoff: handler.estimateHandoff,
    explainHandoffCalculation: handler.explainHandoffCalculation,
    getHandoffRates: handler.getHandoffRates,
    quoteHandoff: handler.quoteHandoff,
    recalculateHandoffs: handler.recalculateHandoffs,
    simulateHandoff: handler.simulateHandoff,
  };
}
