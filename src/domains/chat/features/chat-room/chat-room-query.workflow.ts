/**
 * Answers read-only questions about chat rooms, for screens and reports. Remote work stays behind typed client ports.
 */

import * as auditAuditEventQueryServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_query_service.js";
import * as chatChatBotCalculationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatRoomQueryServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatHandoffValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_validation_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as webhooksWebhookEndpointServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { ChatRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat room operations and persist audit data.
 */
@injectable()
export class ChatRoomQueryWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventQueryService") private readonly auditAuditEventQueryClient: auditAuditEventQueryServiceApi.AuditEventQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffValidationService") private readonly chatHandoffValidationClient: chatHandoffValidationServiceApi.HandoffValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointService") private readonly webhooksWebhookEndpointClient: webhooksWebhookEndpointServiceApi.WebhookEndpointServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists chat rooms a page at a time.
   */
  async browseChatRooms(req: chatChatRoomQueryServiceApi.BrowseChatRoomsRequest): Promise<chatChatRoomQueryServiceApi.BrowseChatRoomsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseChatRooms", req);
    this.logger.info("browse_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventQueryServiceApi.SuggestAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: { query: (req?.filter?.query ?? "") },
    });
    const invoke1: Unary<auditAuditEventQueryServiceApi.SuggestAuditEventsRequest, auditAuditEventQueryServiceApi.SuggestAuditEventsResponse> =
      (input, done) => this.auditAuditEventQueryClient.suggestAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatRoomQueryServiceApi.BrowseChatRoomsResponse.fromPartial({
      pageInfo: {
        nextPageToken: (reply1?.pageInfo?.nextPageToken ?? ""),
        totalSize: (reply1?.pageInfo?.totalSize ?? 0),
      },
    });
  }

  /**
   * Counts chat rooms by status.
   */
  async countChatRooms(req: chatChatRoomQueryServiceApi.CountChatRoomsRequest): Promise<chatChatRoomQueryServiceApi.CountChatRoomsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountChatRooms", req);
    this.logger.info("count_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffValidationServiceApi.PreviewHandoffRequest.fromPartial({
      context: req?.context,
      handoff: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<chatHandoffValidationServiceApi.PreviewHandoffRequest, chatHandoffValidationServiceApi.PreviewHandoffResponse>(
      "acme.chat.v1.ChatRoomQueryService/CountChatRooms:0", request1,
    );
    const request2 = chatHandoffValidationServiceApi.ScoreHandoffRequest.fromPartial({
      context: req?.context,
      handoff: {
        audit: {
          createdBy: (reply1?.handoff?.audit?.createdBy ?? ""),
          etag: (reply1?.handoff?.audit?.etag ?? ""),
        },
      },
    });
    const invoke2: Unary<chatHandoffValidationServiceApi.ScoreHandoffRequest, chatHandoffValidationServiceApi.ScoreHandoffResponse> =
      (input, done) => this.chatHandoffValidationClient.scoreHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<chatHandoffValidationServiceApi.ScoreHandoffRequest, chatHandoffValidationServiceApi.ScoreHandoffResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      chatChatRoomQueryServiceApi.CountChatRoomsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      chatChatRoomQueryServiceApi.CountChatRoomsResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
    );
  }

  /**
   * Streams every matching chat room.
   */
  async exportChatRooms(req: chatChatRoomQueryServiceApi.ExportChatRoomsRequest): Promise<chatChatRoomQueryServiceApi.ExportChatRoomsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportChatRooms", req);
    this.logger.info("export_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: { updatedAt: req?.filter?.createdAfter },
        billingAddress: { region: (req?.filter?.region ?? "") },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest, personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.quoteRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: {
        audit: { etag: (reply1?.recommendation?.audit?.etag ?? "") },
        comments: [{ createdAt: reply1?.recommendation?.audit?.createdAt }],
      },
    });
    const invoke2: Unary<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.annotateNotificationVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      chatChatRoomQueryServiceApi.ExportChatRoomsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      chatChatRoomQueryServiceApi.ExportChatRoomsResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
    );
  }

  /**
   * Lists chat rooms a page at a time.
   */
  async findChatRooms(req: chatChatRoomQueryServiceApi.FindChatRoomsRequest): Promise<chatChatRoomQueryServiceApi.FindChatRoomsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindChatRooms", req);
    this.logger.info("find_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.QuoteChatBotRequest.fromPartial({
      chatBot: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<chatChatBotCalculationServiceApi.QuoteChatBotRequest, chatChatBotCalculationServiceApi.QuoteChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.quoteChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatRoomQueryServiceApi.FindChatRoomsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } });
  }

  /**
   * Returns a chat room.
   */
  async lookupChatRoom(req: chatChatRoomQueryServiceApi.LookupChatRoomRequest): Promise<chatChatRoomQueryServiceApi.LookupChatRoomResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupChatRoom", req);
    this.logger.info("lookup_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomValidationServiceApi.LintChatRoomsRequest.fromPartial({
      chatRoom: { chatRoomId: (req?.chatRoomId ?? "") },
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
    });
    const method1 = "lintChatRooms" as const;
    const invoke1: Unary<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse> =
      (input, done) => this.chatChatRoomValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse>(invoke1, request1);
    const request2 = webhooksWebhookEndpointServiceApi.SearchWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.chatRoom?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        region: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.region ?? ""),
      },
    });
    const proxy2 = forwarding(this.webhooksWebhookEndpointClient);
    const invoke2: Unary<webhooksWebhookEndpointServiceApi.SearchWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.SearchWebhookEndpointsResponse> =
      (input, done) => proxy2.searchWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointServiceApi.SearchWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.SearchWebhookEndpointsResponse>(invoke2, request2);
    return mergeResponses(
      chatChatRoomQueryServiceApi.LookupChatRoomResponse.fromPartial({
        chatRoom: { audit: { createdBy: (reply1?.chatRoom?.audit?.createdBy ?? "") } },
      }),
      chatChatRoomQueryServiceApi.LookupChatRoomResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      chatChatRoomQueryServiceApi.LookupChatRoomResponse.fromPartial({ chatRoom: { chatRoomId: (req?.chatRoomId ?? "") } }),
    );
  }

  /**
   * Returns a chat room.
   */
  async peekChatRoom(req: chatChatRoomQueryServiceApi.PeekChatRoomRequest): Promise<chatChatRoomQueryServiceApi.PeekChatRoomResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekChatRoom", req);
    this.logger.info("peek_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffValidationServiceApi.PreviewHandoffRequest.fromPartial({
      context: req?.context,
      handoff: { requester: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<chatHandoffValidationServiceApi.PreviewHandoffRequest, chatHandoffValidationServiceApi.PreviewHandoffResponse> =
      (input, done) => this.chatHandoffValidationClient.previewHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffValidationServiceApi.PreviewHandoffRequest, chatHandoffValidationServiceApi.PreviewHandoffResponse>(invoke1, request1);
    return mergeResponses(
      chatChatRoomQueryServiceApi.PeekChatRoomResponse.fromPartial({
        chatRoom: {
          audit: { updatedAt: reply1?.handoff?.audit?.updatedAt },
          owner: { email: (reply1?.handoff?.requester?.email ?? "") },
        },
      }),
      chatChatRoomQueryServiceApi.PeekChatRoomResponse.fromPartial({ chatRoom: { chatRoomId: (req?.chatRoomId ?? "") } }),
    );
  }

  /**
   * Returns several chat rooms at once.
   */
  async resolveChatRooms(req: chatChatRoomQueryServiceApi.ResolveChatRoomsRequest): Promise<chatChatRoomQueryServiceApi.ResolveChatRoomsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveChatRooms", req);
    this.logger.info("resolve_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest.fromPartial({
      affinity: { occurredAt: req?.context?.deadline },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.checkAffinityEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse>(invoke1, spread1);
    return chatChatRoomQueryServiceApi.ResolveChatRoomsResponse.fromPartial({
      chatRooms: [{
        owner: { displayName: (reply1?.affinity?.subject?.displayName ?? "") },
      }],
      result: { status: (reply1?.outcome?.status ?? "") },
    });
  }

  /**
   * Lists chat rooms a page at a time.
   */
  async suggestChatRooms(req: chatChatRoomQueryServiceApi.SuggestChatRoomsRequest): Promise<chatChatRoomQueryServiceApi.SuggestChatRoomsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestChatRooms", req);
    this.logger.info("suggest_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = chatHandoffValidationServiceApi.ScoreHandoffRequest.fromPartial({
      context: input1?.context,
      details: { destination: { region: (input1?.filter?.region ?? "") } },
    });
    const invoke1: Unary<chatHandoffValidationServiceApi.ScoreHandoffRequest, chatHandoffValidationServiceApi.ScoreHandoffResponse> =
      (input, done) => this.chatHandoffValidationClient.scoreHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffValidationServiceApi.ScoreHandoffRequest, chatHandoffValidationServiceApi.ScoreHandoffResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatRoomQueryServiceApi.SuggestChatRoomsResponse.fromPartial({
      chatRooms: [{
        owner: {
          email: (reply1?.handoff?.requester?.email ?? ""),
          userId: (reply1?.handoff?.assignee?.userId ?? ""),
        },
      }],
    });
  }

  /**
   * Summarizes a chat room.
   */
  async summarizeChatRooms(req: chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest): Promise<chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeChatRooms", req);
    this.logger.info("summarize_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        components: { primary: { componentId: (req?.chatRoomId ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        tags: (req?.details?.recipientEmails ?? []).map((value) => value),
      },
    });
    const cloned1: webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointRequest, webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointClient.updateWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointRequest, webhooksWebhookEndpointServiceApi.UpdateWebhookEndpointResponse>(invoke1, cloned1);
    const request2 = experimentsExperimentCalculationServiceApi.CalculateExperimentRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: ((reply1?.webhookEndpoint?.locator?.$case === "address" ? reply1?.webhookEndpoint?.locator.address : undefined)?.countryCode ?? ""),
        },
      },
      experiment: {
        organizer: { displayName: (reply1?.webhookEndpoint?.owner?.displayName ?? "") },
      },
    });
    const decoded2 = experimentsExperimentCalculationServiceApi.CalculateExperimentRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExperimentCalculationServiceApi.CalculateExperimentRequest.toJSON(request2))),
    );
    const invoke2: Unary<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.calculateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse>(invoke2, decoded2);
    const request3 = personalizationAffinityValidationServiceApi.PreviewAffinityRequest.fromPartial({
      affinity: {
        measurements: [{ unit: (reply1?.webhookEndpoint?.dimensions?.unit ?? "") }],
      },
      context: req?.context,
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.PreviewAffinityRequest",
      value: Buffer.from(personalizationAffinityValidationServiceApi.PreviewAffinityRequest.encode(request3).finish()),
    });
    const unpacked3 = personalizationAffinityValidationServiceApi.PreviewAffinityRequest.decode(envelope3.value);
    const invoke3: Unary<personalizationAffinityValidationServiceApi.PreviewAffinityRequest, personalizationAffinityValidationServiceApi.PreviewAffinityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.previewAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationAffinityValidationServiceApi.PreviewAffinityRequest, personalizationAffinityValidationServiceApi.PreviewAffinityResponse>(invoke3, unpacked3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse.fromPartial({ result: { message: (reply3?.outcome?.message ?? "") } }),
      chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
