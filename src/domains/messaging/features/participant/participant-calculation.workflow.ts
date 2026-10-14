/**
 * Computes the figures of a participant, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as careplansCarePlanCalculationServiceApi from "../../../../../.cache/proto/acme/careplans/v1/care_plan_calculation_service.js";
import * as chatChatBotQueryServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_query_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as mediaTranscodeJobValidationServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingConversationValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as messagingParticipantCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
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
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toParticipantRecord } from "../../data/records.js";
import { MessagingRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate participant operations and persist audit data.
 */
@injectable()
export class ParticipantCalculationWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.careplans.v1.CarePlanCalculationService") private readonly careplansCarePlanCalculationClient: careplansCarePlanCalculationServiceApi.CarePlanCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotQueryService") private readonly chatChatBotQueryClient: chatChatBotQueryServiceApi.ChatBotQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobValidationService") private readonly mediaTranscodeJobValidationClient: mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelCalculationService") private readonly messagingChannelCalculationClient: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageCalculationService") private readonly messagingChatMessageCalculationClient: messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a participant.
   */
  async calculateParticipant(req: messagingParticipantCalculationServiceApi.CalculateParticipantRequest): Promise<messagingParticipantCalculationServiceApi.CalculateParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "CalculateParticipant", req);
    this.logger.info("calculate_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = careplansCarePlanCalculationServiceApi.EstimateCarePlanRequest.fromPartial({
      carePlan: {
        billingAddress: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
      context: req?.context,
      details: {
        destination: {
          locality: (req?.participant?.primaryAddress?.locality ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      },
    });
    const client1 = this.clients.get<careplansCarePlanCalculationServiceApi.CarePlanCalculationServiceClient>("acme.careplans.v1.CarePlanCalculationService");
    const invoke1: Unary<careplansCarePlanCalculationServiceApi.EstimateCarePlanRequest, careplansCarePlanCalculationServiceApi.EstimateCarePlanResponse> =
      (input, done) => client1.estimateCarePlan(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<careplansCarePlanCalculationServiceApi.EstimateCarePlanRequest, careplansCarePlanCalculationServiceApi.EstimateCarePlanResponse>(invoke1, request1);
    const request2 = mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        audit: {
          createdAt: req?.participant?.audit?.createdAt,
          etag: (reply1?.carePlan?.audit?.etag ?? ""),
        },
      },
    });
    const invoke2: Unary<mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobRequest, mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobValidationClient.normalizeTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobRequest, mediaTranscodeJobValidationServiceApi.NormalizeTranscodeJobResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantCalculationServiceApi.CalculateParticipantResponse.fromPartial({
        participant: { audit: { createdAt: reply1?.carePlan?.audit?.createdAt } },
      }),
      messagingParticipantCalculationServiceApi.CalculateParticipantResponse.fromPartial({
        participant: {
          contact: { phone: (reply2?.transcodeJob?.requester?.phone ?? "") },
          name: reply2?.transcodeJob?.requester?.name,
        },
      }),
      messagingParticipantCalculationServiceApi.CalculateParticipantResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          primaryAddress: req?.participant?.primaryAddress,
        },
      }),
    );
  }

  /**
   * Compares a participant.
   */
  async compareParticipantOptions(req: messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest): Promise<messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "CompareParticipantOptions", req);
    this.logger.info("compare_participant_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.participant?.contact?.email ?? ""),
          name: req?.participant?.name,
          phone: (req?.participant?.contact?.phone ?? ""),
          preferredChannel: (req?.participant?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest, notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.notifyDeliveryAttemptWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest, notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersResponse>(invoke1, request1));
    const request2 = messagingConversationCalculationServiceApi.SimulateConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        origin: { $case: "customer", customer: {
          displayName: (req?.participant?.relationshipManager?.displayName ?? ""),
        } },
        requester: { email: (req?.participant?.relationshipManager?.email ?? "") },
      },
      details: {
        destination: {
          locality: (req?.details?.destination?.locality ?? ""),
          postalCode: (req?.participant?.primaryAddress?.postalCode ?? ""),
        },
      },
    });
    const invoke2: Unary<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient.simulateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("CompareParticipantOptions.SimulateConversation", () => call<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse.fromPartial({
        result: {
          correlationId: (reply1?.deliveryAttempt?.correlationId ?? ""),
          message: (reply1?.outcome?.message ?? ""),
        },
      }),
      messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse.fromPartial({ participant: { name: reply2?.conversation?.requester?.name } }),
      messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          relationshipManager: req?.participant?.relationshipManager,
        },
      }),
    );
  }

  /**
   * Estimates a participant.
   */
  async estimateParticipant(req: messagingParticipantCalculationServiceApi.EstimateParticipantRequest): Promise<messagingParticipantCalculationServiceApi.EstimateParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "EstimateParticipant", req);
    this.logger.info("estimate_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelCalculationServiceApi.RecalculateChannelsRequest.fromPartial({
      channel: {
        locator: { $case: "address", address: { region: (req?.participant?.primaryAddress?.region ?? "") } },
        audit: { updatedBy: (req?.participant?.audit?.updatedBy ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<messagingChannelCalculationServiceApi.RecalculateChannelsRequest, messagingChannelCalculationServiceApi.RecalculateChannelsResponse> =
      (input, done) => this.messagingChannelCalculationClient.recalculateChannels(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantCalculationServiceApi.EstimateParticipantResponse.fromPartial({
        participant: { relationshipManager: { email: (reply1?.channel?.owner?.email ?? "") } },
      }),
      messagingParticipantCalculationServiceApi.EstimateParticipantResponse.fromPartial({
        participant: {
          attributes: (req?.participant?.attributes ?? {}),
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a participant.
   */
  async explainParticipantCalculation(req: messagingParticipantCalculationServiceApi.ExplainParticipantCalculationRequest): Promise<messagingParticipantCalculationServiceApi.ExplainParticipantCalculationResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "ExplainParticipantCalculation", req);
    this.logger.info("explain_participant_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.participant?.attributes ?? {}))),
        period: req?.participant?.preferences?.quietHours,
      },
      reason: (req?.reason ?? ""),
    });
    const reply1 = await this.workQueue.enqueue<ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsResponse>(
      "acme.messaging.v1.ParticipantCalculationService/ExplainParticipantCalculation:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      messagingParticipantCalculationServiceApi.ExplainParticipantCalculationResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      messagingParticipantCalculationServiceApi.ExplainParticipantCalculationResponse.fromPartial({
        participant: {
          name: req?.participant?.name,
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a participant.
   */
  async getParticipantRates(req: messagingParticipantCalculationServiceApi.GetParticipantRatesRequest): Promise<messagingParticipantCalculationServiceApi.GetParticipantRatesResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetParticipantRates", req);
    this.logger.info("get_participant_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    return messagingParticipantCalculationServiceApi.GetParticipantRatesResponse.fromPartial({ participant: { participantId: (req?.participantId ?? "") } });
  }

  /**
   * Quotes a participant.
   */
  async quoteParticipant(req: messagingParticipantCalculationServiceApi.QuoteParticipantRequest): Promise<messagingParticipantCalculationServiceApi.QuoteParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "QuoteParticipant", req);
    this.logger.info("quote_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageCalculationServiceApi.QuoteChatMessageRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          postalCode: (req?.participant?.primaryAddress?.postalCode ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingChatMessageCalculationServiceApi.QuoteChatMessageRequest, messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.quoteChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<messagingChatMessageCalculationServiceApi.QuoteChatMessageRequest, messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse>(invoke1, request1));
    const request2 = messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest.fromPartial({
      chatMessage: {
        subject: { displayName: (reply1?.chatMessage?.subject?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        destination: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          postalCode: (req?.details?.destination?.postalCode ?? ""),
          recipient: (req?.participant?.primaryAddress?.recipient ?? ""),
        },
      },
    });
    const invoke2: Unary<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest, messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.recalculateChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = messagingChannelCalculationServiceApi.RecalculateChannelsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.participant?.primaryAddress?.lines ?? []).map((value) => value),
          region: (req?.participant?.primaryAddress?.region ?? ""),
        },
      },
    });
    const invoke3: Unary<messagingChannelCalculationServiceApi.RecalculateChannelsRequest, messagingChannelCalculationServiceApi.RecalculateChannelsResponse> =
      (input, done) => this.messagingChannelCalculationClient.recalculateChannels(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    let selected4_1: string | undefined;
    switch (reply3?.channel?.locator?.$case) {
      case "address":
        selected4_1 = ((reply3?.channel?.locator?.$case === "address" ? reply3?.channel?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = chatChatBotQueryServiceApi.CountChatBotsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply3?.channel?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply2?.chatMessage?.attributes ?? {}))),
        ownerId: (req?.participant?.relationshipManager?.userId ?? ""),
        region: (selected4_1 ?? ""),
      },
    });
    const invoke4: Unary<chatChatBotQueryServiceApi.CountChatBotsRequest, chatChatBotQueryServiceApi.CountChatBotsResponse> =
      (input, done) => this.chatChatBotQueryClient.countChatBots(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatBotQueryServiceApi.CountChatBotsRequest, chatChatBotQueryServiceApi.CountChatBotsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantCalculationServiceApi.QuoteParticipantResponse.fromPartial({
        participant: { attributes: (reply1?.chatMessage?.attributes ?? {}) },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      messagingParticipantCalculationServiceApi.QuoteParticipantResponse.fromPartial({ breakdown: { currencyCode: (reply2?.breakdown?.currencyCode ?? "") } }),
      messagingParticipantCalculationServiceApi.QuoteParticipantResponse.fromPartial({
        participant: { relationshipManager: { email: (reply3?.channel?.owner?.email ?? "") } },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      messagingParticipantCalculationServiceApi.QuoteParticipantResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      messagingParticipantCalculationServiceApi.QuoteParticipantResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          primaryAddress: req?.participant?.primaryAddress,
        },
      }),
    );
  }

  /**
   * Recalculates a participant.
   */
  async recalculateParticipants(req: messagingParticipantCalculationServiceApi.RecalculateParticipantsRequest): Promise<messagingParticipantCalculationServiceApi.RecalculateParticipantsResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "RecalculateParticipants", req);
    this.logger.info("recalculate_participants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest.fromPartial({
      chatRoom: {
        audit: {
          createdBy: (req?.participant?.audit?.createdBy ?? ""),
          etag: (req?.participant?.audit?.etag ?? ""),
        },
        owner: {
          email: (req?.participant?.relationshipManager?.email ?? ""),
          userId: (req?.participant?.relationshipManager?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const method1 = "explainChatRoomCalculation" as const;
    const invoke1: Unary<chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest, chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationResponse> =
      (input, done) => this.chatChatRoomCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest, chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationResponse>(invoke1, request1);
    const request2 = messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.postalCode ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.messagingChatMessageCalculationClient);
    const invoke2: Unary<messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest, messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse> =
      (input, done) => proxy2.estimateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest, messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (reply1?.chatRoom?.locator?.$case) {
      case "address":
        selected3_1 = ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected3_1 = "";
    }
    let selected3_2: string | undefined;
    switch (reply1?.chatRoom?.locator?.$case) {
      case "address":
        selected3_2 = ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected3_2 = "";
    }
    const request3 = messagingChatMessageCalculationServiceApi.SimulateChatMessageRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (selected3_1 ?? ""),
          postalCode: (selected3_2 ?? ""),
        },
      },
    });
    const invoke3: Unary<messagingChatMessageCalculationServiceApi.SimulateChatMessageRequest, messagingChatMessageCalculationServiceApi.SimulateChatMessageResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.simulateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingChatMessageCalculationServiceApi.SimulateChatMessageRequest, messagingChatMessageCalculationServiceApi.SimulateChatMessageResponse>(invoke3, request3);
    const request4 = messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest.fromPartial({
      chatMessage: {
        subject: { channelId: (reply3?.chatMessage?.subject?.channelId ?? "") },
      },
      context: req?.context,
      details: {
        destination: {
          lines: (req?.participant?.primaryAddress?.lines ?? []).map((value) => value),
          locality: (req?.details?.destination?.locality ?? ""),
        },
      },
    });
    const { context: scope4, ...payload4 } = request4;
    const spread4 = { ...payload4, context: scope4 ?
      { ...scope4, baggage: { ...scope4.baggage } } : undefined };
    const invoke4: Unary<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest, messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.recalculateChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest, messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse>(invoke4, spread4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantCalculationServiceApi.RecalculateParticipantsResponse.fromPartial({
        participant: {
          contact: { email: (reply1?.chatRoom?.owner?.email ?? "") },
          primaryAddress: {
            lines: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.lines ?? []),
          },
        },
      }),
      messagingParticipantCalculationServiceApi.RecalculateParticipantsResponse.fromPartial({
        participant: {
          relationshipManager: { displayName: (reply2?.chatMessage?.subject?.displayName ?? "") },
        },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      messagingParticipantCalculationServiceApi.RecalculateParticipantsResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      messagingParticipantCalculationServiceApi.RecalculateParticipantsResponse.fromPartial({
        breakdown: { total: reply4?.breakdown?.total },
        result: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      messagingParticipantCalculationServiceApi.RecalculateParticipantsResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          status: req?.participant?.status,
        },
      }),
    );
  }

  /**
   * Simulates a participant.
   */
  async simulateParticipant(req: messagingParticipantCalculationServiceApi.SimulateParticipantRequest): Promise<messagingParticipantCalculationServiceApi.SimulateParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "SimulateParticipant", req);
    this.logger.info("simulate_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = messagingConversationValidationServiceApi.CheckConversationEligibilityRequest.fromPartial({
      context: input1?.context,
      conversation: {
        audit: {
          createdAt: input1?.participant?.audit?.createdAt,
          updatedAt: input1?.participant?.audit?.updatedAt,
        },
      },
      details: {
        contact: {
          email: (input1?.participant?.relationshipManager?.email ?? ""),
          preferredChannel: (input1?.participant?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingConversationValidationServiceApi.CheckConversationEligibilityRequest, messagingConversationValidationServiceApi.CheckConversationEligibilityResponse> =
      (input, done) => this.messagingConversationValidationClient.checkConversationEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationValidationServiceApi.CheckConversationEligibilityRequest, messagingConversationValidationServiceApi.CheckConversationEligibilityResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantCalculationServiceApi.SimulateParticipantResponse.fromPartial({
        participant: {
          contact: { email: (reply1?.conversation?.assignee?.email ?? "") },
          relationshipManager: { displayName: (reply1?.conversation?.assignee?.displayName ?? "") },
        },
      }),
      messagingParticipantCalculationServiceApi.SimulateParticipantResponse.fromPartial({
        participant: {
          name: req?.participant?.name,
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }
}
