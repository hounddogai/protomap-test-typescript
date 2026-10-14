/**
 * Computes the figures of a chat bot, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as chatChatBotCalculationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as configurationConfigSetServiceApi from "../../../../../.cache/proto/acme/configuration/v1/config_set_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as identityUserValidationServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as notificationsNotificationTemplateAdminServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as personalizationProfileServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as yardsYardQueryServiceApi from "../../../../../.cache/proto/acme/yards/v1/yard_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
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
} from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toChatBotRecord } from "../../data/records.js";
import { ChatRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat bot operations and persist audit data.
 */
@injectable()
export class ChatBotCalculationWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.configuration.v1.ConfigSetService") private readonly configurationConfigSetClient: configurationConfigSetServiceApi.ConfigSetServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateAdminService") private readonly notificationsNotificationTemplateAdminClient: notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileService") private readonly personalizationProfileClient: personalizationProfileServiceApi.ProfileServiceClient,
    @inject("grpc:acme.yards.v1.YardQueryService") private readonly yardsYardQueryClient: yardsYardQueryServiceApi.YardQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a chat bot.
   */
  async calculateChatBot(req: chatChatBotCalculationServiceApi.CalculateChatBotRequest): Promise<chatChatBotCalculationServiceApi.CalculateChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "CalculateChatBot", req);
    this.logger.info("calculate_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = identityUserValidationServiceApi.ScoreUserRequest.fromPartial({
      context: input1?.context,
      details: {
        destination: { recipient: (input1?.details?.destination?.recipient ?? "") },
      },
    });
    const invoke1: Unary<identityUserValidationServiceApi.ScoreUserRequest, identityUserValidationServiceApi.ScoreUserResponse> =
      (input, done) => this.identityUserValidationClient.scoreUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserValidationServiceApi.ScoreUserRequest, identityUserValidationServiceApi.ScoreUserResponse>(invoke1, request1);
    const request2 = chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { postalCode: (reply1?.user?.primaryAddress?.postalCode ?? "") } },
      },
      context: req?.context,
      details: {
        destination: {
          locality: (req?.details?.destination?.locality ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const cloned2: chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse> =
      (input, done) => this.chatChatRoomCalculationClient.compareChatRoomOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse>(invoke2, cloned2);
    const request3 = chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { countryCode: (req?.details?.destination?.countryCode ?? "") } },
      },
      context: req?.context,
      details: {
        destination: { postalCode: (reply1?.user?.primaryAddress?.postalCode ?? "") },
      },
    });
    const decoded3 = chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest.fromJSON(
      JSON.parse(JSON.stringify(chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest.toJSON(request3))),
    );
    const invoke3: Unary<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse> =
      (input, done) => this.chatChatRoomCalculationClient.recalculateChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse>(invoke3, decoded3);
    const request4 = chatChatRoomCalculationServiceApi.EstimateChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { region: (req?.details?.destination?.region ?? "") } },
        audit: { createdBy: (req?.chatBot?.audit?.createdBy ?? "") },
        components: { primary: { quantity: (reply3?.chatRoom?.components?.["primary"]?.quantity ?? 0) } },
        dimensions: { weight: (reply3?.chatRoom?.dimensions?.weight ?? 0) },
      },
      context: req?.context,
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.EstimateChatRoomRequest",
      value: Buffer.from(chatChatRoomCalculationServiceApi.EstimateChatRoomRequest.encode(request4).finish()),
    });
    const unpacked4 = chatChatRoomCalculationServiceApi.EstimateChatRoomRequest.decode(envelope4.value);
    const invoke4: Unary<chatChatRoomCalculationServiceApi.EstimateChatRoomRequest, chatChatRoomCalculationServiceApi.EstimateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.estimateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatRoomCalculationServiceApi.EstimateChatRoomRequest, chatChatRoomCalculationServiceApi.EstimateChatRoomResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotCalculationServiceApi.CalculateChatBotResponse.fromPartial({ breakdown: { currencyCode: (reply1?.breakdown?.currencyCode ?? "") } }),
      chatChatBotCalculationServiceApi.CalculateChatBotResponse.fromPartial({
        breakdown: { currencyCode: (reply2?.breakdown?.currencyCode ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      chatChatBotCalculationServiceApi.CalculateChatBotResponse.fromPartial({ chatBot: { audit: { updatedAt: reply3?.chatRoom?.audit?.updatedAt } } }),
      chatChatBotCalculationServiceApi.CalculateChatBotResponse.fromPartial({
        chatBot: { owner: { displayName: (reply4?.chatRoom?.owner?.displayName ?? "") } },
      }),
      chatChatBotCalculationServiceApi.CalculateChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          name: (req?.chatBot?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a chat bot.
   */
  async compareChatBotOptions(req: chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest): Promise<chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "CompareChatBotOptions", req);
    this.logger.info("compare_chat_bot_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = configurationConfigSetServiceApi.BatchGetConfigSetsRequest.fromPartial({ context: req?.context });
    const client1 = this.clients.get<configurationConfigSetServiceApi.ConfigSetServiceClient>("acme.configuration.v1.ConfigSetService");
    const invoke1: Unary<configurationConfigSetServiceApi.BatchGetConfigSetsRequest, configurationConfigSetServiceApi.BatchGetConfigSetsResponse> =
      (input, done) => client1.batchGetConfigSets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<configurationConfigSetServiceApi.BatchGetConfigSetsRequest, configurationConfigSetServiceApi.BatchGetConfigSetsResponse>(invoke1, request1);
    const request2 = localizationLocaleValidationServiceApi.NormalizeLocaleRequest.fromPartial({
      context: req?.context,
      locale: { owner: { displayName: (req?.chatBot?.owner?.displayName ?? "") } },
    });
    const invoke2: Unary<localizationLocaleValidationServiceApi.NormalizeLocaleRequest, localizationLocaleValidationServiceApi.NormalizeLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.normalizeLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<localizationLocaleValidationServiceApi.NormalizeLocaleRequest, localizationLocaleValidationServiceApi.NormalizeLocaleResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = yardsYardQueryServiceApi.BrowseYardsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatBot?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (req?.chatBot?.owner?.userId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const invoke3: Unary<yardsYardQueryServiceApi.BrowseYardsRequest, yardsYardQueryServiceApi.BrowseYardsResponse> =
      (input, done) => this.yardsYardQueryClient.browseYards(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<yardsYardQueryServiceApi.BrowseYardsRequest, yardsYardQueryServiceApi.BrowseYardsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          status: req?.chatBot?.status,
        },
      }),
    );
  }

  /**
   * Estimates a chat bot.
   */
  async estimateChatBot(req: chatChatBotCalculationServiceApi.EstimateChatBotRequest): Promise<chatChatBotCalculationServiceApi.EstimateChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "EstimateChatBot", req);
    this.logger.info("estimate_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.SimulateChatRoomRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
    });
    const invoke1: Unary<chatChatRoomCalculationServiceApi.SimulateChatRoomRequest, chatChatRoomCalculationServiceApi.SimulateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.simulateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("EstimateChatBot.SimulateChatRoom", () => call<chatChatRoomCalculationServiceApi.SimulateChatRoomRequest, chatChatRoomCalculationServiceApi.SimulateChatRoomResponse>(invoke1, request1));
    const request2 = chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: {
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          region: (req?.details?.destination?.region ?? ""),
        } },
        audit: { updatedAt: reply1?.chatRoom?.audit?.updatedAt },
      },
      context: req?.context,
      details: {
        destination: {
          region: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.region ?? ""),
        },
      },
    });
    const invoke2: Unary<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse> =
      (input, done) => this.chatChatRoomCalculationClient.recalculateChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest.fromPartial({
      context: req?.context,
      experiment: {
        location: {
          postalCode: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.postalCode ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const reply3 = await this.workQueue.enqueue<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>(
      "acme.chat.v1.ChatBotCalculationService/EstimateChatBot:2", request3,
    );
    let selected4_3: string | undefined;
    switch (reply2?.chatRoom?.locator?.$case) {
      case "address":
        selected4_3 = ((reply2?.chatRoom?.locator?.$case === "address" ? reply2?.chatRoom?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected4_3 = "";
    }
    const request4 = personalizationProfileServiceApi.UpdateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        audit: { createdAt: reply1?.chatRoom?.audit?.createdAt },
        primaryAddress: { locality: (selected4_3 ?? "") },
        relationshipManager: { userId: (req?.chatBot?.owner?.userId ?? "") },
      },
    });
    const invoke4: Unary<personalizationProfileServiceApi.UpdateProfileRequest, personalizationProfileServiceApi.UpdateProfileResponse> =
      (input, done) => this.personalizationProfileClient.updateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<personalizationProfileServiceApi.UpdateProfileRequest, personalizationProfileServiceApi.UpdateProfileResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotCalculationServiceApi.EstimateChatBotResponse.fromPartial({ breakdown: { total: reply1?.breakdown?.total } }),
      chatChatBotCalculationServiceApi.EstimateChatBotResponse.fromPartial({ breakdown: { total: reply2?.breakdown?.total } }),
      chatChatBotCalculationServiceApi.EstimateChatBotResponse.fromPartial({
        chatBot: { owner: { userId: (reply3?.experiment?.organizer?.userId ?? "") } },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      chatChatBotCalculationServiceApi.EstimateChatBotResponse.fromPartial({ result: { status: (reply4?.result?.status ?? "") } }),
      chatChatBotCalculationServiceApi.EstimateChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          version: (req?.chatBot?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Explains a chat bot.
   */
  async explainChatBotCalculation(req: chatChatBotCalculationServiceApi.ExplainChatBotCalculationRequest): Promise<chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "ExplainChatBotCalculation", req);
    this.logger.info("explain_chat_bot_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeCalculationServiceApi.ExplainBadgeCalculationRequest.fromPartial({
      badge: { audit: { updatedAt: req?.chatBot?.audit?.updatedAt } },
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
    });
    const invoke1: Unary<communityBadgeCalculationServiceApi.ExplainBadgeCalculationRequest, communityBadgeCalculationServiceApi.ExplainBadgeCalculationResponse> =
      (input, done) => this.communityBadgeCalculationClient.explainBadgeCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<communityBadgeCalculationServiceApi.ExplainBadgeCalculationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest.fromPartial({
      chatRoom: { owner: { userId: (req?.chatBot?.owner?.userId ?? "") } },
      context: req?.context,
    });
    const invoke2: Unary<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse> =
      (input, done) => this.chatChatRoomCalculationClient.recalculateChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse.fromPartial({
        chatBot: { audit: { updatedBy: (reply1?.badge?.audit?.updatedBy ?? "") } },
      }),
      chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse.fromPartial({ chatBot: { audit: { updatedAt: reply2?.chatRoom?.audit?.updatedAt } } }),
      chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          version: (req?.chatBot?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Returns a chat bot.
   */
  async getChatBotRates(req: chatChatBotCalculationServiceApi.GetChatBotRatesRequest): Promise<chatChatBotCalculationServiceApi.GetChatBotRatesResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChatBotRates", req);
    this.logger.info("get_chat_bot_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.chatBotId ?? ""),
      },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream1 = this.notificationsNotificationTemplateNotificationClient.streamNotificationTemplateNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationTemplateNotificationServiceApi.StreamNotificationTemplateNoticesResponse.fromPartial({});
    return chatChatBotCalculationServiceApi.GetChatBotRatesResponse.fromPartial({ chatBot: { chatBotId: (req?.chatBotId ?? "") } });
  }

  /**
   * Quotes a chat bot.
   */
  async quoteChatBot(req: chatChatBotCalculationServiceApi.QuoteChatBotRequest): Promise<chatChatBotCalculationServiceApi.QuoteChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "QuoteChatBot", req);
    this.logger.info("quote_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.QuoteChatRoomRequest.fromPartial({
      chatRoom: { owner: { email: (req?.chatBot?.owner?.email ?? "") } },
      context: req?.context,
    });
    const invoke1: Unary<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.quoteChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotCalculationServiceApi.QuoteChatBotResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      chatChatBotCalculationServiceApi.QuoteChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          effective: req?.chatBot?.effective,
        },
      }),
    );
  }

  /**
   * Recalculates a chat bot.
   */
  async recalculateChatBots(req: chatChatBotCalculationServiceApi.RecalculateChatBotsRequest): Promise<chatChatBotCalculationServiceApi.RecalculateChatBotsResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "RecalculateChatBots", req);
    this.logger.info("recalculate_chat_bots", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserValidationServiceApi.PreviewUserRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.chatBot?.owner?.email ?? "") } },
      user: {
        audit: { updatedAt: req?.chatBot?.audit?.updatedAt },
        primaryAddress: { countryCode: (req?.details?.destination?.countryCode ?? "") },
      },
    });
    const method1 = "previewUser" as const;
    const invoke1: Unary<identityUserValidationServiceApi.PreviewUserRequest, identityUserValidationServiceApi.PreviewUserResponse> =
      (input, done) => this.identityUserValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserValidationServiceApi.PreviewUserRequest, identityUserValidationServiceApi.PreviewUserResponse>(invoke1, request1);
    const request2 = chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest.fromPartial({
      chatRoom: { audit: { createdBy: (reply1?.user?.audit?.createdBy ?? "") } },
      context: req?.context,
    });
    const proxy2 = forwarding(this.chatChatRoomCalculationClient);
    const invoke2: Unary<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse> =
      (input, done) => proxy2.compareChatRoomOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotCalculationServiceApi.RecalculateChatBotsResponse.fromPartial({
        chatBot: { owner: { userId: (reply1?.user?.relationshipManager?.userId ?? "") } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      chatChatBotCalculationServiceApi.RecalculateChatBotsResponse.fromPartial({
        chatBot: { owner: { userId: (reply2?.chatRoom?.owner?.userId ?? "") } },
      }),
      chatChatBotCalculationServiceApi.RecalculateChatBotsResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          priority: (req?.chatBot?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Simulates a chat bot.
   */
  async simulateChatBot(req: chatChatBotCalculationServiceApi.SimulateChatBotRequest): Promise<chatChatBotCalculationServiceApi.SimulateChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "SimulateChatBot", req);
    this.logger.info("simulate_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: {
          etag: (req?.chatBot?.audit?.etag ?? ""),
          updatedAt: req?.chatBot?.audit?.updatedAt,
        },
        billingAddress: { locality: (req?.details?.destination?.locality ?? "") },
        counterparty: { priority: (req?.chatBot?.priority ?? 0) },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateAdminClient.repairNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotCalculationServiceApi.SimulateChatBotResponse.fromPartial({
        chatBot: {
          audit: { createdBy: (reply1?.notificationTemplate?.audit?.createdBy ?? "") },
        },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      chatChatBotCalculationServiceApi.SimulateChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          version: (req?.chatBot?.version ?? 0),
        },
      }),
    );
  }
}
