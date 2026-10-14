/**
 * Manages conversations: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChannelValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as messagingChatMessageQueryServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_query_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingConversationQueryServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as messagingConversationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as surveysQuestionValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../platform/handlers.js";
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
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toConversationRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate conversation operations and persist audit data.
 */
@injectable()
export class ConversationWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelCalculationService") private readonly messagingChannelCalculationClient: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelValidationService") private readonly messagingChannelValidationClient: messagingChannelValidationServiceApi.ChannelValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageQueryService") private readonly messagingChatMessageQueryClient: messagingChatMessageQueryServiceApi.ChatMessageQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageValidationService") private readonly messagingChatMessageValidationClient: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationQueryService") private readonly messagingConversationQueryClient: messagingConversationQueryServiceApi.ConversationQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionValidationService") private readonly surveysQuestionValidationClient: surveysQuestionValidationServiceApi.QuestionValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of conversations and answers once at the end.
   */
  async batchCreateConversations(req: messagingConversationServiceApi.BatchCreateConversationsRequest): Promise<messagingConversationServiceApi.BatchCreateConversationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateConversations", req);
    this.logger.info("batch_create_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelValidationServiceApi.NormalizeChannelRequest.fromPartial({
      channel: {
        audit: {
          etag: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? ""),
        },
        owner: {
          displayName: (((choice) => choice?.$case === "customer" ? choice.customer : undefined)((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.origin)?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: {
        contact: {
          name: (req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.name,
        },
      },
    });
    const invoke1: Unary<messagingChannelValidationServiceApi.NormalizeChannelRequest, messagingChannelValidationServiceApi.NormalizeChannelResponse> =
      (input, done) => this.messagingChannelValidationClient.normalizeChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_1: string | undefined;
    switch (reply1?.channel?.locator?.$case) {
      case "address":
        selected2_1 = ((reply1?.channel?.locator?.$case === "address" ? reply1?.channel?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_3: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected2_3 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.assignee?.userId ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest.fromPartial({
      channel: {
        locator: { $case: "address", address: { locality: (selected2_1 ?? "") } },
        components: { primary: {
          componentId: (reply1?.channel?.components?.["primary"]?.componentId ?? ""),
          quantity: (reply1?.channel?.components?.["primary"]?.quantity ?? 0),
        } },
        owner: { userId: (selected2_3 ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest, messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse> =
      (input, done) => this.messagingChannelCalculationClient.explainChannelCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest, messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.updatedBy ?? "") });
    return mergeResponses(
      messagingConversationServiceApi.BatchCreateConversationsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingConversationServiceApi.BatchCreateConversationsResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
    );
  }

  /**
   * Returns several conversations at once.
   */
  async batchGetConversations(req: messagingConversationServiceApi.BatchGetConversationsRequest): Promise<messagingConversationServiceApi.BatchGetConversationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetConversations", req);
    this.logger.info("batch_get_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const method1 = "explainAffinityDecision" as const;
    const invoke1: Unary<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest, personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse> =
      (input, done) => this.personalizationAffinityValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest, personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse>(invoke1, request1);
    const request2 = messagingConversationQueryServiceApi.ResolveConversationsRequest.fromPartial({
      context: req?.context,
      conversationIds: (req?.conversationIds ?? []).map((value) => value),
    });
    const proxy2 = forwarding(this.messagingConversationQueryClient);
    const invoke2: Unary<messagingConversationQueryServiceApi.ResolveConversationsRequest, messagingConversationQueryServiceApi.ResolveConversationsResponse> =
      (input, done) => proxy2.resolveConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationQueryServiceApi.ResolveConversationsRequest, messagingConversationQueryServiceApi.ResolveConversationsResponse>(invoke2, request2);
    return mergeResponses(
      messagingConversationServiceApi.BatchGetConversationsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      messagingConversationServiceApi.BatchGetConversationsResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
    );
  }

  /**
   * Creates a conversation.
   */
  async cloneConversation(req: messagingConversationServiceApi.CloneConversationRequest): Promise<messagingConversationServiceApi.CloneConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "CloneConversation", req);
    this.logger.info("clone_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageQueryServiceApi.CountChatMessagesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.conversation?.audit?.updatedAt },
    });
    const invoke1: Unary<messagingChatMessageQueryServiceApi.CountChatMessagesRequest, messagingChatMessageQueryServiceApi.CountChatMessagesResponse> =
      (input, done) => this.messagingChatMessageQueryClient.countChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageQueryServiceApi.CountChatMessagesRequest, messagingChatMessageQueryServiceApi.CountChatMessagesResponse>(invoke1, request1);
    const request2 = messagingChannelValidationServiceApi.CheckChannelEligibilityRequest.fromPartial({
      channel: {
        audit: {
          etag: (req?.conversation?.audit?.etag ?? ""),
          updatedBy: (req?.conversation?.audit?.updatedBy ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { phone: (req?.conversation?.requester?.phone ?? "") } },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<messagingChannelValidationServiceApi.CheckChannelEligibilityRequest, messagingChannelValidationServiceApi.CheckChannelEligibilityResponse> =
      (input, done) => this.messagingChannelValidationClient.checkChannelEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChannelValidationServiceApi.CheckChannelEligibilityRequest, messagingChannelValidationServiceApi.CheckChannelEligibilityResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      messagingConversationServiceApi.CloneConversationResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      messagingConversationServiceApi.CloneConversationResponse.fromPartial({
        conversation: { requester: { email: (reply2?.channel?.owner?.email ?? "") } },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      messagingConversationServiceApi.CloneConversationResponse.fromPartial({
        conversation: {
          assignee: req?.conversation?.assignee,
          priority: (req?.conversation?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Creates a conversation.
   */
  async createConversation(req: messagingConversationServiceApi.CreateConversationRequest): Promise<messagingConversationServiceApi.CreateConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "CreateConversation", req);
    this.logger.info("create_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.conversation?.history ?? []).map(async (item) => {
      const request1 = messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest.fromPartial({
        context: req?.context,
        conversation: { history: [{ fromStatus: (item?.fromStatus ?? "") }] },
      });
      const invoke1: Unary<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse> =
        (input, done) => this.messagingConversationCalculationClient.explainConversationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse.fromPartial({});
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = messagingChatMessageValidationServiceApi.ScoreChatMessageRequest.fromPartial({
      chatMessage: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: {
          channelId: ((reply1?.conversation?.origin?.$case === "customer" ? reply1?.conversation?.origin.customer : undefined)?.channelId ?? ""),
          code: ((input2?.conversation?.origin?.$case === "customer" ? input2?.conversation?.origin.customer : undefined)?.code ?? ""),
          displayName: ((reply1?.conversation?.origin?.$case === "customer" ? reply1?.conversation?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
      context: input2?.context,
    });
    const invoke2: Unary<messagingChatMessageValidationServiceApi.ScoreChatMessageRequest, messagingChatMessageValidationServiceApi.ScoreChatMessageResponse> =
      (input, done) => this.messagingChatMessageValidationClient.scoreChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageValidationServiceApi.ScoreChatMessageRequest, messagingChatMessageValidationServiceApi.ScoreChatMessageResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      messagingConversationServiceApi.CreateConversationResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      messagingConversationServiceApi.CreateConversationResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversation?.conversationId ?? ""),
          requester: req?.conversation?.requester,
        },
      }),
    );
  }

  /**
   * Deletes a conversation.
   */
  async deleteConversation(req: messagingConversationServiceApi.DeleteConversationRequest): Promise<messagingConversationServiceApi.DeleteConversationResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteConversation", req);
    this.logger.info("delete_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationValidationServiceApi.PreviewConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        audit: { etag: (req?.etag ?? "") },
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
      conversationId: (req?.conversationId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const cloned1: messagingConversationValidationServiceApi.PreviewConversationRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<messagingConversationValidationServiceApi.PreviewConversationRequest, messagingConversationValidationServiceApi.PreviewConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.previewConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationValidationServiceApi.PreviewConversationRequest, messagingConversationValidationServiceApi.PreviewConversationResponse>(invoke1, cloned1);
    return messagingConversationServiceApi.DeleteConversationResponse.fromPartial({
      result: {
        details: (reply1?.result?.details ?? {}),
        referenceIds: (reply1?.result?.referenceIds ?? []),
      },
    });
  }

  /**
   * Returns a conversation.
   */
  async getConversation(req: messagingConversationServiceApi.GetConversationRequest): Promise<messagingConversationServiceApi.GetConversationResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetConversation", req);
    this.logger.info("get_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    return messagingConversationServiceApi.GetConversationResponse.fromPartial({ conversation: { conversationId: (req?.conversationId ?? "") } });
  }

  /**
   * Lists conversations a page at a time.
   */
  async listConversations(req: messagingConversationServiceApi.ListConversationsRequest): Promise<messagingConversationServiceApi.ListConversationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListConversations", req);
    this.logger.info("list_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingConversationServiceApi.ListConversationsResponse.fromPartial({});
  }

  /**
   * Lists conversations a page at a time.
   */
  async searchConversations(req: messagingConversationServiceApi.SearchConversationsRequest): Promise<messagingConversationServiceApi.SearchConversationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchConversations", req);
    this.logger.info("search_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationCalculationServiceApi.SimulateConversationRequest.fromPartial({
      context: req?.context,
      conversation: { requester: { email: (req?.context?.actor?.email ?? "") } },
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const decoded1 = messagingConversationCalculationServiceApi.SimulateConversationRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingConversationCalculationServiceApi.SimulateConversationRequest.toJSON(request1))),
    );
    const invoke1: Unary<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient.simulateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingConversationServiceApi.SearchConversationsResponse.fromPartial({
      conversations: [{ audit: { createdBy: (reply1?.conversation?.audit?.createdBy ?? "") } }],
    });
  }

  /**
   * Changes a conversation.
   */
  async updateConversation(req: messagingConversationServiceApi.UpdateConversationRequest): Promise<messagingConversationServiceApi.UpdateConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "UpdateConversation", req);
    this.logger.info("update_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest.fromPartial({
      chatMessage: {
        subject: {
          channelId: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.channelId ?? ""),
          code: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.code ?? ""),
          displayName: (req?.conversation?.assignee?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { email: (req?.conversation?.requester?.email ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.ExplainChatMessageDecisionRequest",
      value: Buffer.from(messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest.encode(request1).finish()),
    });
    const unpacked1 = messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest.decode(envelope1.value);
    const invoke1: Unary<messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest, messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse> =
      (input, done) => this.messagingChatMessageValidationClient.explainChatMessageDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest, messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.conversation?.audit?.etag ?? "") });
    return mergeResponses(
      messagingConversationServiceApi.UpdateConversationResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      messagingConversationServiceApi.UpdateConversationResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversation?.conversationId ?? ""),
          customFields: (req?.conversation?.customFields ?? {}),
        },
      }),
    );
  }

  /**
   * Streams the changes of conversations as they happen.
   */
  async watchConversations(req: messagingConversationServiceApi.WatchConversationsRequest): Promise<messagingConversationServiceApi.WatchConversationsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchConversations", req);
    this.logger.info("watch_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionValidationServiceApi.NormalizeQuestionRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.subscriber?.name } },
      question: { owner: { email: (req?.subscriber?.email ?? "") } },
    });
    const client1 = this.clients.get<surveysQuestionValidationServiceApi.QuestionValidationServiceClient>("acme.surveys.v1.QuestionValidationService");
    const invoke1: Unary<surveysQuestionValidationServiceApi.NormalizeQuestionRequest, surveysQuestionValidationServiceApi.NormalizeQuestionResponse> =
      (input, done) => client1.normalizeQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysQuestionValidationServiceApi.NormalizeQuestionRequest, surveysQuestionValidationServiceApi.NormalizeQuestionResponse>(invoke1, request1);
    const request2 = experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      variant: {
        audit: { createdBy: (reply1?.question?.audit?.createdBy ?? "") },
        action: { $case: "route", route: {
          target: ((reply1?.question?.action?.$case === "route" ? reply1?.question?.action.route : undefined)?.target ?? ""),
        } },
      },
    });
    const invoke2: Unary<experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest, experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse> =
      (input, done) => this.experimentsVariantCalculationClient.compareVariantOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest, experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest.fromPartial({
      channel: {
        audit: { createdBy: (reply1?.question?.audit?.createdBy ?? "") },
        owner: { userId: (reply1?.question?.owner?.userId ?? "") },
      },
      context: req?.context,
    });
    const invoke3: Unary<messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest, messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse> =
      (input, done) => this.messagingChannelCalculationClient.explainChannelCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest, messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse>(invoke3, request3));
    const request4 = notificationsNotificationServiceApi.BatchGetNotificationsRequest.fromPartial({ context: req?.context });
    const invoke4: Unary<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient.batchGetNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("WatchConversations.BatchGetNotifications", () => call<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.subscriber?.phone ?? "") });
    return mergeResponses(
      messagingConversationServiceApi.WatchConversationsResponse.fromPartial({
        conversation: { comments: [{ createdAt: reply1?.question?.audit?.createdAt }] },
      }),
      messagingConversationServiceApi.WatchConversationsResponse.fromPartial({
        conversation: { requester: { email: (reply2?.variant?.owner?.email ?? "") } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      messagingConversationServiceApi.WatchConversationsResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      messagingConversationServiceApi.WatchConversationsResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      messagingConversationServiceApi.WatchConversationsResponse.fromPartial({
        conversation: {
          requester: {
            name: req?.subscriber?.name,
            preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
          },
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ConversationService; workflows own validation and database transactions.
 */
@injectable()
export class ConversationHandler {
  constructor(@inject(ConversationWorkflow) private readonly workflow: ConversationWorkflow) {}

  /**
   * Takes a stream of conversations and answers once at the end.
   */
  batchCreateConversations = clientStream<messagingConversationServiceApi.BatchCreateConversationsRequest, messagingConversationServiceApi.BatchCreateConversationsResponse>(
    (request) => this.workflow.batchCreateConversations(request), () => messagingConversationServiceApi.BatchCreateConversationsResponse.fromPartial({}),
  );

  /**
   * Returns several conversations at once.
   */
  batchGetConversations = unary<messagingConversationServiceApi.BatchGetConversationsRequest, messagingConversationServiceApi.BatchGetConversationsResponse>(
    (request) => this.workflow.batchGetConversations(request),
  );

  /**
   * Creates a conversation.
   */
  cloneConversation = (call: ServerUnaryCall<messagingConversationServiceApi.CloneConversationRequest, messagingConversationServiceApi.CloneConversationResponse>, done: sendUnaryData<messagingConversationServiceApi.CloneConversationResponse>): void => {
    void this.workflow.cloneConversation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Creates a conversation.
   */
  createConversation = unary<messagingConversationServiceApi.CreateConversationRequest, messagingConversationServiceApi.CreateConversationResponse>(
    (request) => this.workflow.createConversation(request),
  );

  /**
   * Deletes a conversation.
   */
  deleteConversation = unary<messagingConversationServiceApi.DeleteConversationRequest, messagingConversationServiceApi.DeleteConversationResponse>(
    (request) => this.workflow.deleteConversation(request),
  );

  /**
   * Returns a conversation.
   */
  getConversation = (call: ServerUnaryCall<messagingConversationServiceApi.GetConversationRequest, messagingConversationServiceApi.GetConversationResponse>, done: sendUnaryData<messagingConversationServiceApi.GetConversationResponse>): void => {
    void this.workflow.getConversation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists conversations a page at a time.
   */
  listConversations = unary<messagingConversationServiceApi.ListConversationsRequest, messagingConversationServiceApi.ListConversationsResponse>(
    (request) => this.workflow.listConversations(request),
  );

  /**
   * Lists conversations a page at a time.
   */
  searchConversations = unary<messagingConversationServiceApi.SearchConversationsRequest, messagingConversationServiceApi.SearchConversationsResponse>(
    (request) => this.workflow.searchConversations(request),
  );

  /**
   * Changes a conversation.
   */
  updateConversation = (call: ServerUnaryCall<messagingConversationServiceApi.UpdateConversationRequest, messagingConversationServiceApi.UpdateConversationResponse>, done: sendUnaryData<messagingConversationServiceApi.UpdateConversationResponse>): void => {
    void this.workflow.updateConversation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of conversations as they happen.
   */
  watchConversations = serverStream<messagingConversationServiceApi.WatchConversationsRequest, messagingConversationServiceApi.WatchConversationsResponse>(
    (request) => this.workflow.watchConversations(request),
  );
}

export function implementation(handler: ConversationHandler): messagingConversationServiceApi.ConversationServiceServer {
  return {
    batchCreateConversations: handler.batchCreateConversations,
    batchGetConversations: handler.batchGetConversations,
    cloneConversation: handler.cloneConversation,
    createConversation: handler.createConversation,
    deleteConversation: handler.deleteConversation,
    getConversation: handler.getConversation,
    listConversations: handler.listConversations,
    searchConversations: handler.searchConversations,
    updateConversation: handler.updateConversation,
    watchConversations: handler.watchConversations,
  };
}
