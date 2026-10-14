/**
 * Keeps handoffs in step with the systems of record in other regions. Remote work stays behind typed client ports.
 */

import * as chatChatBotQueryServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_query_service.js";
import * as chatChatBotValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as chatChatRoomQueryServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as chatChatRoomServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as chatHandoffCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as chatHandoffSyncServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as personalizationProfileWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as ticketingTicketServiceApi from "../../../../.cache/proto/acme/ticketing/v1/ticket_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { duplex, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toHandoffRecord } from "../data/records.js";
import { ChatRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate handoff operations and persist audit data.
 */
@injectable()
export class HandoffSyncWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotQueryService") private readonly chatChatBotQueryClient: chatChatBotQueryServiceApi.ChatBotQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotValidationService") private readonly chatChatBotValidationClient: chatChatBotValidationServiceApi.ChatBotValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomQueryService") private readonly chatChatRoomQueryClient: chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.chat.v1.HandoffCalculationService") private readonly chatHandoffCalculationClient: chatHandoffCalculationServiceApi.HandoffCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileWorkflowService") private readonly personalizationProfileWorkflowClient: personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.ticketing.v1.TicketService") private readonly ticketingTicketClient: ticketingTicketServiceApi.TicketServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a handoff.
   */
  async getHandoffSyncState(req: chatHandoffSyncServiceApi.GetHandoffSyncStateRequest): Promise<chatHandoffSyncServiceApi.GetHandoffSyncStateResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetHandoffSyncState", req);
    this.logger.info("get_handoff_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    return chatHandoffSyncServiceApi.GetHandoffSyncStateResponse.fromPartial({ handoff: { handoffId: (req?.handoffId ?? "") } });
  }

  /**
   * Lists handoffs a page at a time.
   */
  async listHandoffConflicts(req: chatHandoffSyncServiceApi.ListHandoffConflictsRequest): Promise<chatHandoffSyncServiceApi.ListHandoffConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListHandoffConflicts", req);
    this.logger.info("list_handoff_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const proxy1 = forwarding(this.chatChatRoomQueryClient);
    const invoke1: Unary<chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest, chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse> =
      (input, done) => proxy1.summarizeChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest, chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatHandoffSyncServiceApi.ListHandoffConflictsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } });
  }

  /**
   * Pulls a handoff.
   */
  async pullHandoffs(req: chatHandoffSyncServiceApi.PullHandoffsRequest): Promise<chatHandoffSyncServiceApi.PullHandoffsResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "PullHandoffs", req);
    this.logger.info("pull_handoffs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.handoff?.comments ?? []).map(async (item) => {
      const request1 = chatChatBotValidationServiceApi.ExplainChatBotDecisionRequest.fromPartial({
        chatBot: {
          audit: {
            createdAt: item?.createdAt,
            etag: (req?.handoff?.audit?.etag ?? ""),
          },
          action: { $case: "block", block: { notifyEmail: (item?.authorEmail ?? "") } },
        },
        context: req?.context,
      });
      const invoke1: Unary<chatChatBotValidationServiceApi.ExplainChatBotDecisionRequest, chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse> =
        (input, done) => this.chatChatBotValidationClient.explainChatBotDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<chatChatBotValidationServiceApi.ExplainChatBotDecisionRequest, chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse.fromPartial({});
    let selected2_2: number | undefined;
    switch (reply1?.chatBot?.action?.$case) {
      case "route":
        selected2_2 = ((reply1?.chatBot?.action?.$case === "route" ? reply1?.chatBot?.action.route : undefined)?.weight ?? 0);
        break;
      default:
        selected2_2 = 0;
    }
    const request2 = chatChatBotValidationServiceApi.ScoreChatBotRequest.fromPartial({
      chatBot: {
        audit: { updatedBy: (req?.handoff?.audit?.updatedBy ?? "") },
        owner: { email: (req?.handoff?.requester?.email ?? "") },
        action: { $case: "route", route: { weight: (selected2_2 ?? 0) } },
      },
      context: req?.context,
    });
    const invoke2: Unary<chatChatBotValidationServiceApi.ScoreChatBotRequest, chatChatBotValidationServiceApi.ScoreChatBotResponse> =
      (input, done) => this.chatChatBotValidationClient.scoreChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatBotValidationServiceApi.ScoreChatBotRequest, chatChatBotValidationServiceApi.ScoreChatBotResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffSyncServiceApi.PullHandoffsResponse.fromPartial({
        handoff: { assignee: { userId: (reply2?.chatBot?.owner?.userId ?? "") } },
      }),
      chatHandoffSyncServiceApi.PullHandoffsResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          priority: (req?.handoff?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Pushs a handoff.
   */
  async pushHandoff(req: chatHandoffSyncServiceApi.PushHandoffRequest): Promise<chatHandoffSyncServiceApi.PushHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "PushHandoff", req);
    this.logger.info("push_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomServiceApi.CreateChatRoomRequest.fromPartial({
      chatRoom: {
        audit: {
          etag: (req?.handoff?.audit?.etag ?? ""),
          updatedBy: (req?.handoff?.audit?.updatedBy ?? ""),
        },
        owner: {
          displayName: (req?.handoff?.assignee?.displayName ?? ""),
          email: (req?.handoff?.requester?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<chatChatRoomServiceApi.CreateChatRoomRequest, chatChatRoomServiceApi.CreateChatRoomResponse> =
      (input, done) => this.chatChatRoomClient.createChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomServiceApi.CreateChatRoomRequest, chatChatRoomServiceApi.CreateChatRoomResponse>(invoke1, spread1);
    const tasks2: Array<() => Promise<personalizationProfileWorkflowServiceApi.RetryProfileWorkflowResponse>> = [];
    for (const item of (req?.handoff?.comments ?? [])) {
      tasks2.push(async () => {
        const request2 = personalizationProfileWorkflowServiceApi.RetryProfileWorkflowRequest.fromPartial({
          context: req?.context,
          profile: { audit: { createdAt: item?.createdAt } },
        });
        const invoke2: Unary<personalizationProfileWorkflowServiceApi.RetryProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.RetryProfileWorkflowResponse> =
          (input, done) => this.personalizationProfileWorkflowClient.retryProfileWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<personalizationProfileWorkflowServiceApi.RetryProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.RetryProfileWorkflowResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? personalizationProfileWorkflowServiceApi.RetryProfileWorkflowResponse.fromPartial({});
    const results3 = await Promise.all((req?.handoff?.comments ?? []).map(async (item) => {
      const request3 = chatChatRoomCalculationServiceApi.QuoteChatRoomRequest.fromPartial({
        chatRoom: { audit: { createdAt: item?.createdAt } },
        context: req?.context,
      });
      const invoke3: Unary<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse> =
        (input, done) => this.chatChatRoomCalculationClient.quoteChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse>(invoke3, request3);
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? chatChatRoomCalculationServiceApi.QuoteChatRoomResponse.fromPartial({});
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest.fromPartial({
      context: input4?.context,
      filter: {
        createdAfter: reply2?.outcome?.effectiveAt,
        region: (reply2?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const invoke4: Unary<notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest, notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse> =
      (input, done) => this.notificationsNotificationSyncClient.listNotificationConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest, notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffSyncServiceApi.PushHandoffResponse.fromPartial({
        handoff: {
          assignee: { email: (reply1?.chatRoom?.owner?.email ?? "") },
          audit: { etag: (reply1?.chatRoom?.audit?.etag ?? "") },
        },
      }),
      chatHandoffSyncServiceApi.PushHandoffResponse.fromPartial({ result: { correlationId: (reply4?.result?.correlationId ?? "") } }),
      chatHandoffSyncServiceApi.PushHandoffResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          requester: req?.handoff?.requester,
        },
      }),
    );
  }

  /**
   * Reconciles a handoff.
   */
  async reconcileHandoffs(req: chatHandoffSyncServiceApi.ReconcileHandoffsRequest): Promise<chatHandoffSyncServiceApi.ReconcileHandoffsResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "ReconcileHandoffs", req);
    this.logger.info("reconcile_handoffs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.handoff?.history ?? []).map(async (item) => {
      const request1 = notificationsNotificationValidationServiceApi.PreviewNotificationRequest.fromPartial({
        context: req?.context,
        notification: {
          history: [{
            changedAt: item?.changedAt,
            toStatus: (item?.toStatus ?? ""),
          }],
        },
      });
      const invoke1: Unary<notificationsNotificationValidationServiceApi.PreviewNotificationRequest, notificationsNotificationValidationServiceApi.PreviewNotificationResponse> =
        (input, done) => this.notificationsNotificationValidationClient.previewNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsNotificationValidationServiceApi.PreviewNotificationRequest, notificationsNotificationValidationServiceApi.PreviewNotificationResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: notificationsNotificationValidationServiceApi.PreviewNotificationResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? notificationsNotificationValidationServiceApi.PreviewNotificationResponse.fromPartial({});
    const request2 = personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (reply1?.notification?.requester?.email ?? ""),
        name: req?.handoff?.requester?.name,
        preferredChannel: (req?.handoff?.requester?.preferredChannel ?? ""),
      },
    });
    const stream2 = this.personalizationRecommendationReportingClient.streamRecommendationMetrics(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsResponse.fromPartial({});
    const request3 = personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { phone: (reply1?.notification?.requester?.phone ?? "") } },
      profile: { contact: { email: (req?.handoff?.assignee?.email ?? "") } },
    });
    const cloned3: personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse> =
      (input, done) => this.personalizationProfileWorkflowClient.advanceProfileWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse>(invoke3, cloned3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffSyncServiceApi.ReconcileHandoffsResponse.fromPartial({ handoff: { requester: { name: reply3?.profile?.name } } }),
      chatHandoffSyncServiceApi.ReconcileHandoffsResponse.fromPartial({
        handoff: {
          customFields: (req?.handoff?.customFields ?? {}),
          handoffId: (req?.handoffId ?? ""),
        },
      }),
    );
  }

  /**
   * Resolves a handoff.
   */
  async resolveHandoffConflict(req: chatHandoffSyncServiceApi.ResolveHandoffConflictRequest): Promise<chatHandoffSyncServiceApi.ResolveHandoffConflictResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "ResolveHandoffConflict", req);
    this.logger.info("resolve_handoff_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      chatRoomId: ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.chatRoomId ?? ""),
      context: req?.context,
    });
    const decoded1 = chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest.fromJSON(
      JSON.parse(JSON.stringify(chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest.toJSON(request1))),
    );
    const invoke1: Unary<chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest, chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse> =
      (input, done) => this.chatChatRoomQueryClient.summarizeChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest, chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse>(invoke1, decoded1);
    const request2 = ticketingTicketServiceApi.ListTicketsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.handoff?.sla?.dueAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.handoff?.assignee?.userId ?? ""),
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.ticketing.v1.ListTicketsRequest",
      value: Buffer.from(ticketingTicketServiceApi.ListTicketsRequest.encode(request2).finish()),
    });
    const unpacked2 = ticketingTicketServiceApi.ListTicketsRequest.decode(envelope2.value);
    const invoke2: Unary<ticketingTicketServiceApi.ListTicketsRequest, ticketingTicketServiceApi.ListTicketsResponse> =
      (input, done) => this.ticketingTicketClient.listTickets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ticketingTicketServiceApi.ListTicketsRequest, ticketingTicketServiceApi.ListTicketsResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffSyncServiceApi.ResolveHandoffConflictResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      chatHandoffSyncServiceApi.ResolveHandoffConflictResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      chatHandoffSyncServiceApi.ResolveHandoffConflictResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          requester: req?.handoff?.requester,
        },
      }),
    );
  }

  /**
   * Exchanges changes of handoffs with a peer.
   */
  async streamHandoffChanges(req: chatHandoffSyncServiceApi.StreamHandoffChangesRequest): Promise<chatHandoffSyncServiceApi.StreamHandoffChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamHandoffChanges", req);
    this.logger.info("stream_handoff_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected1_1 = ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.requester?.phone ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = chatHandoffCalculationServiceApi.ExplainHandoffCalculationRequest.fromPartial({
      context: req?.context,
      handoff: { requester: { phone: (selected1_1 ?? "") } },
    });
    const invoke1: Unary<chatHandoffCalculationServiceApi.ExplainHandoffCalculationRequest, chatHandoffCalculationServiceApi.ExplainHandoffCalculationResponse> =
      (input, done) => this.chatHandoffCalculationClient.explainHandoffCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffCalculationServiceApi.ExplainHandoffCalculationRequest, chatHandoffCalculationServiceApi.ExplainHandoffCalculationResponse>(invoke1, request1);
    const request2 = chatChatBotQueryServiceApi.BrowseChatBotsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.audit?.createdAt,
        ownerId: ((reply1?.handoff?.origin?.$case === "customer" ? reply1?.handoff?.origin.customer : undefined)?.chatRoomId ?? ""),
      },
    });
    const invoke2: Unary<chatChatBotQueryServiceApi.BrowseChatBotsRequest, chatChatBotQueryServiceApi.BrowseChatBotsResponse> =
      (input, done) => this.chatChatBotQueryClient.browseChatBots(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<chatChatBotQueryServiceApi.BrowseChatBotsRequest, chatChatBotQueryServiceApi.BrowseChatBotsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = chatHandoffCalculationServiceApi.CompareHandoffOptionsRequest.fromPartial({
      context: req?.context,
      handoff: {
        requester: {
          preferredChannel: (reply1?.handoff?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const invoke3: Unary<chatHandoffCalculationServiceApi.CompareHandoffOptionsRequest, chatHandoffCalculationServiceApi.CompareHandoffOptionsResponse> =
      (input, done) => this.chatHandoffCalculationClient.compareHandoffOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<chatHandoffCalculationServiceApi.CompareHandoffOptionsRequest, chatHandoffCalculationServiceApi.CompareHandoffOptionsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      chatHandoffSyncServiceApi.StreamHandoffChangesResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      chatHandoffSyncServiceApi.StreamHandoffChangesResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      chatHandoffSyncServiceApi.StreamHandoffChangesResponse.fromPartial({
        handoff: {
          audit: {
            createdAt: reply3?.handoff?.audit?.createdAt,
            updatedBy: (reply3?.handoff?.audit?.updatedBy ?? ""),
          },
        },
      }),
      chatHandoffSyncServiceApi.StreamHandoffChangesResponse.fromPartial({
        handoff: {
          priority: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.priority ?? 0),
        },
        sequence: ((req?.frame?.$case === "ack" ? req?.frame.ack : undefined)?.sequence ?? 0),
      }),
    );
  }

  /**
   * Syncs a handoff.
   */
  async syncHandoffs(req: chatHandoffSyncServiceApi.SyncHandoffsRequest): Promise<chatHandoffSyncServiceApi.SyncHandoffsResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "SyncHandoffs", req);
    this.logger.info("sync_handoffs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<chatHandoffCalculationServiceApi.RecalculateHandoffsResponse>> = [];
    for (const item of (req?.handoff?.comments ?? [])) {
      tasks1.push(async () => {
        const request1 = chatHandoffCalculationServiceApi.RecalculateHandoffsRequest.fromPartial({
          context: req?.context,
          handoff: { audit: { createdAt: item?.createdAt } },
        });
        const invoke1: Unary<chatHandoffCalculationServiceApi.RecalculateHandoffsRequest, chatHandoffCalculationServiceApi.RecalculateHandoffsResponse> =
          (input, done) => this.chatHandoffCalculationClient.recalculateHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<chatHandoffCalculationServiceApi.RecalculateHandoffsRequest, chatHandoffCalculationServiceApi.RecalculateHandoffsResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? chatHandoffCalculationServiceApi.RecalculateHandoffsResponse.fromPartial({});
    const request2 = chatChatRoomQueryServiceApi.ExportChatRoomsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.handoff?.sla?.dueAt,
        labels: Object.fromEntries(Object.entries((req?.handoff?.customFields ?? {}))),
        ownerId: ((reply1?.handoff?.origin?.$case === "customer" ? reply1?.handoff?.origin.customer : undefined)?.chatRoomId ?? ""),
      },
    });
    const stream2 = this.chatChatRoomQueryClient.exportChatRooms(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? chatChatRoomQueryServiceApi.ExportChatRoomsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return chatHandoffSyncServiceApi.SyncHandoffsResponse.fromPartial({
      handoff: {
        handoffId: (req?.handoffId ?? ""),
        subject: (req?.handoff?.subject ?? ""),
      },
    });
  }
}

/**
 * The gRPC boundary for HandoffSyncService; workflows own validation and database transactions.
 */
@injectable()
export class HandoffSyncHandler {
  constructor(@inject(HandoffSyncWorkflow) private readonly workflow: HandoffSyncWorkflow) {}

  /**
   * Returns a handoff.
   */
  getHandoffSyncState = unary<chatHandoffSyncServiceApi.GetHandoffSyncStateRequest, chatHandoffSyncServiceApi.GetHandoffSyncStateResponse>(
    (request) => this.workflow.getHandoffSyncState(request),
  );

  /**
   * Lists handoffs a page at a time.
   */
  listHandoffConflicts = unary<chatHandoffSyncServiceApi.ListHandoffConflictsRequest, chatHandoffSyncServiceApi.ListHandoffConflictsResponse>(
    (request) => this.workflow.listHandoffConflicts(request),
  );

  /**
   * Pulls a handoff.
   */
  pullHandoffs = (call: ServerUnaryCall<chatHandoffSyncServiceApi.PullHandoffsRequest, chatHandoffSyncServiceApi.PullHandoffsResponse>, done: sendUnaryData<chatHandoffSyncServiceApi.PullHandoffsResponse>): void => {
    void this.workflow.pullHandoffs(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pushs a handoff.
   */
  pushHandoff = unary<chatHandoffSyncServiceApi.PushHandoffRequest, chatHandoffSyncServiceApi.PushHandoffResponse>(
    (request) => this.workflow.pushHandoff(request),
  );

  /**
   * Reconciles a handoff.
   */
  reconcileHandoffs = unary<chatHandoffSyncServiceApi.ReconcileHandoffsRequest, chatHandoffSyncServiceApi.ReconcileHandoffsResponse>(
    (request) => this.workflow.reconcileHandoffs(request),
  );

  /**
   * Resolves a handoff.
   */
  resolveHandoffConflict = (call: ServerUnaryCall<chatHandoffSyncServiceApi.ResolveHandoffConflictRequest, chatHandoffSyncServiceApi.ResolveHandoffConflictResponse>, done: sendUnaryData<chatHandoffSyncServiceApi.ResolveHandoffConflictResponse>): void => {
    void this.workflow.resolveHandoffConflict(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Exchanges changes of handoffs with a peer.
   */
  streamHandoffChanges = duplex<chatHandoffSyncServiceApi.StreamHandoffChangesRequest, chatHandoffSyncServiceApi.StreamHandoffChangesResponse>(
    (request) => this.workflow.streamHandoffChanges(request),
  );

  /**
   * Syncs a handoff.
   */
  syncHandoffs = unary<chatHandoffSyncServiceApi.SyncHandoffsRequest, chatHandoffSyncServiceApi.SyncHandoffsResponse>(
    (request) => this.workflow.syncHandoffs(request),
  );
}

export function implementation(handler: HandoffSyncHandler): chatHandoffSyncServiceApi.HandoffSyncServiceServer {
  return {
    getHandoffSyncState: handler.getHandoffSyncState,
    listHandoffConflicts: handler.listHandoffConflicts,
    pullHandoffs: handler.pullHandoffs,
    pushHandoff: handler.pushHandoff,
    reconcileHandoffs: handler.reconcileHandoffs,
    resolveHandoffConflict: handler.resolveHandoffConflict,
    streamHandoffChanges: handler.streamHandoffChanges,
    syncHandoffs: handler.syncHandoffs,
  };
}
