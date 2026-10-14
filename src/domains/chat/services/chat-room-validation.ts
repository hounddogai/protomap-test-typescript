/**
 * Checks chat rooms against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as chatChatBotCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as fleetVehicleServiceApi from "../../../../.cache/proto/acme/fleet/v1/vehicle_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChatRoomRecord } from "../data/records.js";
import { ChatRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat room operations and persist audit data.
 */
@injectable()
export class ChatRoomValidationWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.fleet.v1.VehicleService") private readonly fleetVehicleClient: fleetVehicleServiceApi.VehicleServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryValidationService") private readonly webhooksWebhookDeliveryValidationClient: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a chat room.
   */
  async checkChatRoomEligibility(req: chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest): Promise<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "CheckChatRoomEligibility", req);
    this.logger.info("check_chat_room_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.NormalizePostRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      post: {
        billingAddress: {
          region: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? ""),
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse> =
      (input, done) => this.communityPostValidationClient.normalizePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest.fromPartial({
      chatBot: {
        audit: { updatedBy: (reply1?.post?.audit?.updatedBy ?? "") },
        owner: { email: (input2?.details?.contact?.email ?? "") },
      },
      context: input2?.context,
    });
    const invoke2: Unary<chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest, chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse> =
      (input, done) => this.chatChatBotCalculationClient.compareChatBotOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest, chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse.fromPartial({ chatRoom: { audit: { updatedAt: reply1?.post?.audit?.updatedAt } } }),
      chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse.fromPartial({
        chatRoom: {
          owner: {
            displayName: (reply2?.chatBot?.owner?.displayName ?? ""),
            userId: (reply2?.chatBot?.owner?.userId ?? ""),
          },
        },
      }),
      chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          status: req?.chatRoom?.status,
        },
      }),
    );
  }

  /**
   * Explains a chat room.
   */
  async explainChatRoomDecision(req: chatChatRoomValidationServiceApi.ExplainChatRoomDecisionRequest): Promise<chatChatRoomValidationServiceApi.ExplainChatRoomDecisionResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "ExplainChatRoomDecision", req);
    this.logger.info("explain_chat_room_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.chatRoom?.locator?.$case) {
      case "address":
        selected1_2 = ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest.fromPartial({
      chatBot: { audit: { createdAt: req?.chatRoom?.audit?.createdAt } },
      context: req?.context,
      details: { destination: { countryCode: (selected1_2 ?? "") } },
    });
    const invoke1: Unary<chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest, chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse> =
      (input, done) => this.chatChatBotCalculationClient.compareChatBotOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest, chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.chatBot?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.chatRoom?.specs ?? {}))),
        region: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? ""),
      },
    });
    const decoded2 = notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.toJSON(request2))),
    );
    const invoke2: Unary<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.listDeliveryAttemptConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse>(invoke2, decoded2);
    const request3 = chatChatBotCalculationServiceApi.EstimateChatBotRequest.fromPartial({
      chatBot: { owner: { displayName: (req?.chatRoom?.owner?.displayName ?? "") } },
      context: req?.context,
      details: {
        destination: {
          lines: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.lines ?? []).map((value) => value),
        },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.EstimateChatBotRequest",
      value: Buffer.from(chatChatBotCalculationServiceApi.EstimateChatBotRequest.encode(request3).finish()),
    });
    const unpacked3 = chatChatBotCalculationServiceApi.EstimateChatBotRequest.decode(envelope3.value);
    const invoke3: Unary<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.estimateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse>(invoke3, unpacked3);
    let selected4_1: number | undefined;
    switch (reply1?.chatBot?.action?.$case) {
      case "discount":
        selected4_1 = ((reply1?.chatBot?.action?.$case === "discount" ? reply1?.chatBot?.action.discount : undefined)?.percent ?? 0);
        break;
      default:
        selected4_1 = 0;
    }
    let selected4_2: string | undefined;
    switch (req?.chatRoom?.locator?.$case) {
      case "address":
        selected4_2 = ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected4_2 = "";
    }
    const request4 = chatChatBotCalculationServiceApi.CalculateChatBotRequest.fromPartial({
      chatBot: {
        audit: { updatedBy: (reply3?.chatBot?.audit?.updatedBy ?? "") },
        action: { $case: "discount", discount: { percent: (selected4_1 ?? 0) } },
      },
      context: req?.context,
      details: { destination: { recipient: (selected4_2 ?? "") } },
    });
    const invoke4: Unary<chatChatBotCalculationServiceApi.CalculateChatBotRequest, chatChatBotCalculationServiceApi.CalculateChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.calculateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatBotCalculationServiceApi.CalculateChatBotRequest, chatChatBotCalculationServiceApi.CalculateChatBotResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomValidationServiceApi.ExplainChatRoomDecisionResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      chatChatRoomValidationServiceApi.ExplainChatRoomDecisionResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      chatChatRoomValidationServiceApi.ExplainChatRoomDecisionResponse.fromPartial({
        chatRoom: { owner: { email: (reply3?.chatBot?.owner?.email ?? "") } },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      chatChatRoomValidationServiceApi.ExplainChatRoomDecisionResponse.fromPartial({ chatRoom: { owner: reply4?.chatBot?.owner } }),
      chatChatRoomValidationServiceApi.ExplainChatRoomDecisionResponse.fromPartial({
        chatRoom: {
          capacity: (req?.chatRoom?.capacity ?? 0),
          chatRoomId: (req?.chatRoomId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a chat room.
   */
  async getChatRoomRules(req: chatChatRoomValidationServiceApi.GetChatRoomRulesRequest): Promise<chatChatRoomValidationServiceApi.GetChatRoomRulesResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChatRoomRules", req);
    this.logger.info("get_chat_room_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.SimulateChatBotRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      chatBot: {
        audit: { createdAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<chatChatBotCalculationServiceApi.SimulateChatBotRequest, chatChatBotCalculationServiceApi.SimulateChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.simulateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<chatChatBotCalculationServiceApi.SimulateChatBotRequest, chatChatBotCalculationServiceApi.SimulateChatBotResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: {
          createdBy: (reply1?.chatBot?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.chatBot?.audit?.updatedBy ?? ""),
        },
        lines: [{
          amount: (reply1?.chatBot?.action?.$case === "discount" ? reply1?.chatBot?.action.discount : undefined)?.amount,
        }],
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.recalculateNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse>(invoke2, request2));
    return mergeResponses(
      chatChatRoomValidationServiceApi.GetChatRoomRulesResponse.fromPartial({
        chatRoom: {
          components: { primary: { description: (reply1?.chatBot?.description ?? "") } },
        },
      }),
      chatChatRoomValidationServiceApi.GetChatRoomRulesResponse.fromPartial({
        chatRoom: { audit: { etag: (reply2?.notificationTemplate?.audit?.etag ?? "") } },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      chatChatRoomValidationServiceApi.GetChatRoomRulesResponse.fromPartial({ chatRoom: { chatRoomId: (req?.chatRoomId ?? "") } }),
    );
  }

  /**
   * Lints a chat room.
   */
  async lintChatRooms(req: chatChatRoomValidationServiceApi.LintChatRoomsRequest): Promise<chatChatRoomValidationServiceApi.LintChatRoomsResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "LintChatRooms", req);
    this.logger.info("lint_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.ScorePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: {
          createdAt: req?.chatRoom?.audit?.createdAt,
          etag: (req?.chatRoom?.audit?.etag ?? ""),
        },
        counterparty: { displayName: (req?.chatRoom?.owner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<communityPostValidationServiceApi.ScorePostRequest, communityPostValidationServiceApi.ScorePostResponse> =
      (input, done) => this.communityPostValidationClient.scorePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("LintChatRooms.ScorePost", () => call<communityPostValidationServiceApi.ScorePostRequest, communityPostValidationServiceApi.ScorePostResponse>(invoke1, request1));
    const request2 = personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        settlement: { $case: "bank", bank: {
          accountHolder: ((reply1?.post?.settlement?.$case === "bank" ? reply1?.post?.settlement.bank : undefined)?.accountHolder ?? ""),
        } },
      },
    });
    const invoke2: Unary<personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest, personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.normalizeRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomValidationServiceApi.LintChatRoomsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      chatChatRoomValidationServiceApi.LintChatRoomsResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { message: (reply2?.outcome?.message ?? "") },
      }),
      chatChatRoomValidationServiceApi.LintChatRoomsResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          name: (req?.chatRoom?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a chat room.
   */
  async normalizeChatRoom(req: chatChatRoomValidationServiceApi.NormalizeChatRoomRequest): Promise<chatChatRoomValidationServiceApi.NormalizeChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "NormalizeChatRoom", req);
    this.logger.info("normalize_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.CalculateChatBotRequest.fromPartial({
      chatBot: {
        audit: {
          etag: (req?.chatRoom?.audit?.etag ?? ""),
          updatedAt: req?.chatRoom?.audit?.updatedAt,
          updatedBy: (req?.chatRoom?.audit?.updatedBy ?? ""),
        },
      },
      context: req?.context,
      details: {
        destination: {
          lines: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.lines ?? []).map((value) => value),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<chatChatBotCalculationServiceApi.CalculateChatBotRequest, chatChatBotCalculationServiceApi.CalculateChatBotResponse>(
      "acme.chat.v1.ChatRoomValidationService/NormalizeChatRoom:0", request1,
    );
    let selected2_1: string | undefined;
    switch (reply1?.chatBot?.action?.$case) {
      case "block":
        selected2_1 = ((reply1?.chatBot?.action?.$case === "block" ? reply1?.chatBot?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = localizationLocaleValidationServiceApi.ValidateLocaleRequest.fromPartial({
      context: req?.context,
      locale: {
        audit: {
          updatedAt: req?.chatRoom?.audit?.updatedAt,
          updatedBy: (reply1?.chatBot?.audit?.updatedBy ?? ""),
        },
        action: { $case: "block", block: { reason: (selected2_1 ?? "") } },
        owner: { email: (reply1?.chatBot?.owner?.email ?? "") },
      },
    });
    const invoke2: Unary<localizationLocaleValidationServiceApi.ValidateLocaleRequest, localizationLocaleValidationServiceApi.ValidateLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.validateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleValidationServiceApi.ValidateLocaleRequest, localizationLocaleValidationServiceApi.ValidateLocaleResponse>(invoke2, request2);
    const request3 = chatChatBotCalculationServiceApi.QuoteChatBotRequest.fromPartial({
      chatBot: {
        audit: {
          createdBy: (reply2?.locale?.audit?.createdBy ?? ""),
          updatedAt: reply2?.locale?.audit?.updatedAt,
        },
        owner: { email: (reply1?.chatBot?.owner?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke3: Unary<chatChatBotCalculationServiceApi.QuoteChatBotRequest, chatChatBotCalculationServiceApi.QuoteChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.quoteChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<chatChatBotCalculationServiceApi.QuoteChatBotResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = localizationLocaleValidationServiceApi.LintLocalesRequest.fromPartial({
      context: req?.context,
      locale: {
        audit: { createdAt: reply1?.chatBot?.audit?.createdAt },
        owner: { email: (reply1?.chatBot?.owner?.email ?? "") },
      },
    });
    const invoke4: Unary<localizationLocaleValidationServiceApi.LintLocalesRequest, localizationLocaleValidationServiceApi.LintLocalesResponse> =
      (input, done) => this.localizationLocaleValidationClient.lintLocales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomValidationServiceApi.NormalizeChatRoomResponse.fromPartial({
        chatRoom: {
          audit: { updatedAt: reply1?.chatBot?.audit?.updatedAt },
          components: { primary: { description: (reply1?.chatBot?.description ?? "") } },
        },
      }),
      chatChatRoomValidationServiceApi.NormalizeChatRoomResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      chatChatRoomValidationServiceApi.NormalizeChatRoomResponse.fromPartial({ chatRoom: { owner: reply3?.chatBot?.owner } }),
      chatChatRoomValidationServiceApi.NormalizeChatRoomResponse.fromPartial({ chatRoom: { name: (reply4?.locale?.name ?? "") } }),
      chatChatRoomValidationServiceApi.NormalizeChatRoomResponse.fromPartial({
        chatRoom: {
          capacity: (req?.chatRoom?.capacity ?? 0),
          chatRoomId: (req?.chatRoomId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a chat room.
   */
  async previewChatRoom(req: chatChatRoomValidationServiceApi.PreviewChatRoomRequest): Promise<chatChatRoomValidationServiceApi.PreviewChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "PreviewChatRoom", req);
    this.logger.info("preview_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          phone: (req?.details?.contact?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.previewWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.countryCode ?? ""),
          recipient: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.recipient ?? ""),
        },
      },
      post: {
        counterparty: { displayName: (reply1?.webhookDelivery?.subject?.displayName ?? "") },
      },
    });
    const method2 = "comparePostOptions" as const;
    const invoke2: Unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse> =
      (input, done) => this.communityPostCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomValidationServiceApi.PreviewChatRoomResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      chatChatRoomValidationServiceApi.PreviewChatRoomResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      chatChatRoomValidationServiceApi.PreviewChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          specs: (req?.chatRoom?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Validates a chat room.
   */
  async validateChatRoom(req: chatChatRoomValidationServiceApi.ValidateChatRoomRequest): Promise<chatChatRoomValidationServiceApi.ValidateChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "ValidateChatRoom", req);
    this.logger.info("validate_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.EstimateChatBotRequest.fromPartial({
      chatBot: { audit: { updatedBy: (req?.chatRoom?.audit?.updatedBy ?? "") } },
      context: req?.context,
      details: {
        destination: {
          lines: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.lines ?? []).map((value) => value),
          recipient: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.recipient ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.chatChatBotCalculationClient);
    const invoke1: Unary<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse> =
      (input, done) => proxy1.estimateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotCalculationServiceApi.EstimateChatBotRequest, chatChatBotCalculationServiceApi.EstimateChatBotResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (reply1?.chatBot?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest, notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.resolveDeliveryAttemptConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictRequest, notificationsDeliveryAttemptSyncServiceApi.ResolveDeliveryAttemptConflictResponse>(invoke2, request2);
    const request3 = fleetVehicleServiceApi.ListVehiclesRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? ""),
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<fleetVehicleServiceApi.ListVehiclesRequest, fleetVehicleServiceApi.ListVehiclesResponse> =
      (input, done) => this.fleetVehicleClient.listVehicles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<fleetVehicleServiceApi.ListVehiclesRequest, fleetVehicleServiceApi.ListVehiclesResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomValidationServiceApi.ValidateChatRoomResponse.fromPartial({ chatRoom: { name: (reply1?.chatBot?.name ?? "") } }),
      chatChatRoomValidationServiceApi.ValidateChatRoomResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      chatChatRoomValidationServiceApi.ValidateChatRoomResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          message: (reply3?.result?.message ?? ""),
        },
      }),
      chatChatRoomValidationServiceApi.ValidateChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          specs: (req?.chatRoom?.specs ?? {}),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ChatRoomValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ChatRoomValidationHandler {
  constructor(@inject(ChatRoomValidationWorkflow) private readonly workflow: ChatRoomValidationWorkflow) {}

  /**
   * Checks a chat room.
   */
  checkChatRoomEligibility = unary<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse>(
    (request) => this.workflow.checkChatRoomEligibility(request),
  );

  /**
   * Explains a chat room.
   */
  explainChatRoomDecision = unary<chatChatRoomValidationServiceApi.ExplainChatRoomDecisionRequest, chatChatRoomValidationServiceApi.ExplainChatRoomDecisionResponse>(
    (request) => this.workflow.explainChatRoomDecision(request),
  );

  /**
   * Returns a chat room.
   */
  getChatRoomRules = (call: ServerUnaryCall<chatChatRoomValidationServiceApi.GetChatRoomRulesRequest, chatChatRoomValidationServiceApi.GetChatRoomRulesResponse>, done: sendUnaryData<chatChatRoomValidationServiceApi.GetChatRoomRulesResponse>): void => {
    void this.workflow.getChatRoomRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints a chat room.
   */
  lintChatRooms = unary<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse>(
    (request) => this.workflow.lintChatRooms(request),
  );

  /**
   * Normalizes a chat room.
   */
  normalizeChatRoom = unary<chatChatRoomValidationServiceApi.NormalizeChatRoomRequest, chatChatRoomValidationServiceApi.NormalizeChatRoomResponse>(
    (request) => this.workflow.normalizeChatRoom(request),
  );

  /**
   * Previews a chat room.
   */
  previewChatRoom = (call: ServerUnaryCall<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse>, done: sendUnaryData<chatChatRoomValidationServiceApi.PreviewChatRoomResponse>): void => {
    void this.workflow.previewChatRoom(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a chat room.
   */
  validateChatRoom = unary<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse>(
    (request) => this.workflow.validateChatRoom(request),
  );
}

export function implementation(handler: ChatRoomValidationHandler): chatChatRoomValidationServiceApi.ChatRoomValidationServiceServer {
  return {
    checkChatRoomEligibility: handler.checkChatRoomEligibility,
    explainChatRoomDecision: handler.explainChatRoomDecision,
    getChatRoomRules: handler.getChatRoomRules,
    lintChatRooms: handler.lintChatRooms,
    normalizeChatRoom: handler.normalizeChatRoom,
    previewChatRoom: handler.previewChatRoom,
    validateChatRoom: handler.validateChatRoom,
  };
}
