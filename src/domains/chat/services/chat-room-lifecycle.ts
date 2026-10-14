/**
 * Moves a chat room between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as chatChatBotReportingServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_reporting_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as chatChatRoomLifecycleServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_lifecycle_service.js";
import * as chatChatRoomQueryServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as chatChatRoomServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatHandoffSyncServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as chatHandoffValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_validation_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
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
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { ChatRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat room operations and persist audit data.
 */
@injectable()
export class ChatRoomLifecycleWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotReportingService") private readonly chatChatBotReportingClient: chatChatBotReportingServiceApi.ChatBotReportingServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomQueryService") private readonly chatChatRoomQueryClient: chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.chat.v1.HandoffValidationService") private readonly chatHandoffValidationClient: chatHandoffValidationServiceApi.HandoffValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationWorkflowService") private readonly personalizationRecommendationWorkflowClient: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryWorkflowService") private readonly webhooksWebhookDeliveryWorkflowClient: webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a chat room.
   */
  async activateChatRoom(req: chatChatRoomLifecycleServiceApi.ActivateChatRoomRequest): Promise<chatChatRoomLifecycleServiceApi.ActivateChatRoomResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateChatRoom", req);
    this.logger.info("activate_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest.fromPartial({
      chatRoom: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { phone: (req?.details?.notifyContact?.phone ?? "") } },
    });
    const invoke1: Unary<chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest, chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationResponse> =
      (input, done) => this.chatChatRoomCalculationClient.explainChatRoomCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.details?.notifyContact?.email ?? "") } },
    });
    const method2 = "pauseWebhookDeliveryWorkflow" as const;
    const invoke2: Unary<webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowResponse> =
      (input, done) => this.webhooksWebhookDeliveryWorkflowClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowResponse>(invoke2, request2);
    const request3 = chatChatRoomValidationServiceApi.PreviewChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: {
          countryCode: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.countryCode ?? ""),
        } },
        dimensions: { weight: (reply1?.chatRoom?.dimensions?.weight ?? 0) },
        owner: { email: (req?.details?.notifyContact?.email ?? "") },
      },
      context: req?.context,
    });
    const proxy3 = forwarding(this.chatChatRoomValidationClient);
    const invoke3: Unary<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse> =
      (input, done) => proxy3.previewChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse>(invoke3, request3);
    const request4 = personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (reply3?.chatRoom?.owner?.email ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      recommendation: {
        counterparty: { displayName: (reply2?.webhookDelivery?.subject?.displayName ?? "") },
      },
    });
    const invoke4: Unary<personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowResponse> =
      (input, done) => this.personalizationRecommendationWorkflowClient.cancelRecommendationWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomLifecycleServiceApi.ActivateChatRoomResponse.fromPartial({
        chatRoom: { audit: { updatedAt: reply1?.chatRoom?.audit?.updatedAt } },
      }),
      chatChatRoomLifecycleServiceApi.ActivateChatRoomResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      chatChatRoomLifecycleServiceApi.ActivateChatRoomResponse.fromPartial({
        chatRoom: { owner: { displayName: (reply3?.chatRoom?.owner?.displayName ?? "") } },
      }),
      chatChatRoomLifecycleServiceApi.ActivateChatRoomResponse.fromPartial({
        chatRoom: { audit: { updatedAt: reply4?.recommendation?.audit?.updatedAt } },
      }),
      chatChatRoomLifecycleServiceApi.ActivateChatRoomResponse.fromPartial({
        chatRoom: { chatRoomId: (req?.chatRoomId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a chat room.
   */
  async expireChatRoom(req: chatChatRoomLifecycleServiceApi.ExpireChatRoomRequest): Promise<chatChatRoomLifecycleServiceApi.ExpireChatRoomResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireChatRoom", req);
    this.logger.info("expire_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotReportingServiceApi.ScheduleChatBotReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<chatChatBotReportingServiceApi.ScheduleChatBotReportRequest, chatChatBotReportingServiceApi.ScheduleChatBotReportResponse> =
      (input, done) => this.chatChatBotReportingClient.scheduleChatBotReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotReportingServiceApi.ScheduleChatBotReportRequest, chatChatBotReportingServiceApi.ScheduleChatBotReportResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = localizationLocaleApprovalServiceApi.SubmitLocaleRequest.fromPartial({
      context: input2?.context,
      details: {
        approver: {
          email: (input2?.details?.newOwner?.email ?? ""),
          userId: (input2?.details?.newOwner?.userId ?? ""),
        },
      },
      locale: { owner: { email: (input2?.details?.notifyContact?.email ?? "") } },
    });
    const invoke2: Unary<localizationLocaleApprovalServiceApi.SubmitLocaleRequest, localizationLocaleApprovalServiceApi.SubmitLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient.submitLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleApprovalServiceApi.SubmitLocaleRequest, localizationLocaleApprovalServiceApi.SubmitLocaleResponse>(invoke2, request2);
    const request3 = chatChatRoomQueryServiceApi.LookupChatRoomRequest.fromPartial({
      chatRoomId: (req?.chatRoomId ?? ""),
      context: req?.context,
    });
    const cloned3: chatChatRoomQueryServiceApi.LookupChatRoomRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<chatChatRoomQueryServiceApi.LookupChatRoomRequest, chatChatRoomQueryServiceApi.LookupChatRoomResponse> =
      (input, done) => this.chatChatRoomQueryClient.lookupChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatRoomQueryServiceApi.LookupChatRoomRequest, chatChatRoomQueryServiceApi.LookupChatRoomResponse>(invoke3, cloned3);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      chatChatRoomLifecycleServiceApi.ExpireChatRoomResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      chatChatRoomLifecycleServiceApi.ExpireChatRoomResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      chatChatRoomLifecycleServiceApi.ExpireChatRoomResponse.fromPartial({
        chatRoom: {
          audit: {
            updatedAt: reply3?.chatRoom?.audit?.updatedAt,
            updatedBy: (reply3?.chatRoom?.audit?.updatedBy ?? ""),
          },
        },
      }),
      chatChatRoomLifecycleServiceApi.ExpireChatRoomResponse.fromPartial({
        chatRoom: { chatRoomId: (req?.chatRoomId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a chat room.
   */
  async getChatRoomLifecycle(req: chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleRequest): Promise<chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChatRoomLifecycle", req);
    this.logger.info("get_chat_room_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexQueryServiceApi.ExportSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.context?.deadline },
    });
    const stream1 = this.searchSearchIndexQueryClient.exportSearchIndexes(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? searchSearchIndexQueryServiceApi.ExportSearchIndexesResponse.fromPartial({});
    return chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleResponse.fromPartial({ chatRoom: { chatRoomId: (req?.chatRoomId ?? "") } });
  }

  /**
   * Reinstates a chat room.
   */
  async reinstateChatRoom(req: chatChatRoomLifecycleServiceApi.ReinstateChatRoomRequest): Promise<chatChatRoomLifecycleServiceApi.ReinstateChatRoomResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateChatRoom", req);
    this.logger.info("reinstate_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomServiceApi.GetChatRoomRequest.fromPartial({
      chatRoomId: (req?.chatRoomId ?? ""),
      context: req?.context,
    });
    const decoded1 = chatChatRoomServiceApi.GetChatRoomRequest.fromJSON(
      JSON.parse(JSON.stringify(chatChatRoomServiceApi.GetChatRoomRequest.toJSON(request1))),
    );
    const invoke1: Unary<chatChatRoomServiceApi.GetChatRoomRequest, chatChatRoomServiceApi.GetChatRoomResponse> =
      (input, done) => this.chatChatRoomClient.getChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomServiceApi.GetChatRoomRequest, chatChatRoomServiceApi.GetChatRoomResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomLifecycleServiceApi.ReinstateChatRoomResponse.fromPartial({
        chatRoom: {
          components: { primary: { quantity: (reply1?.chatRoom?.components?.["primary"]?.quantity ?? 0) } },
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      chatChatRoomLifecycleServiceApi.ReinstateChatRoomResponse.fromPartial({
        chatRoom: { chatRoomId: (req?.chatRoomId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews a chat room.
   */
  async renewChatRoom(req: chatChatRoomLifecycleServiceApi.RenewChatRoomRequest): Promise<chatChatRoomLifecycleServiceApi.RenewChatRoomResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewChatRoom", req);
    this.logger.info("renew_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.NotifyNotificationTemplateWatchersRequest",
      value: Buffer.from(notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest, notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse> =
      (input, done) => this.notificationsNotificationTemplateNotificationClient.notifyNotificationTemplateWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest, notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomLifecycleServiceApi.RenewChatRoomResponse.fromPartial({
        chatRoom: {
          audit: { createdBy: (reply1?.notificationTemplate?.audit?.createdBy ?? "") },
        },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      chatChatRoomLifecycleServiceApi.RenewChatRoomResponse.fromPartial({
        chatRoom: { chatRoomId: (req?.chatRoomId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Suspends a chat room.
   */
  async suspendChatRoom(req: chatChatRoomLifecycleServiceApi.SuspendChatRoomRequest): Promise<chatChatRoomLifecycleServiceApi.SuspendChatRoomResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendChatRoom", req);
    this.logger.info("suspend_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffSyncServiceApi.SyncHandoffsRequest.fromPartial({
      context: req?.context,
      handoff: {
        assignee: {
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
        requester: { name: req?.details?.notifyContact?.name },
      },
    });
    const client1 = this.clients.get<chatHandoffSyncServiceApi.HandoffSyncServiceClient>("acme.chat.v1.HandoffSyncService");
    const invoke1: Unary<chatHandoffSyncServiceApi.SyncHandoffsRequest, chatHandoffSyncServiceApi.SyncHandoffsResponse> =
      (input, done) => client1.syncHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffSyncServiceApi.SyncHandoffsRequest, chatHandoffSyncServiceApi.SyncHandoffsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomLifecycleServiceApi.SuspendChatRoomResponse.fromPartial({
        chatRoom: {
          owner: { displayName: (reply1?.handoff?.assignee?.displayName ?? "") },
        },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      chatChatRoomLifecycleServiceApi.SuspendChatRoomResponse.fromPartial({
        chatRoom: { chatRoomId: (req?.chatRoomId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates a chat room.
   */
  async terminateChatRoom(req: chatChatRoomLifecycleServiceApi.TerminateChatRoomRequest): Promise<chatChatRoomLifecycleServiceApi.TerminateChatRoomResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateChatRoom", req);
    this.logger.info("terminate_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleApprovalServiceApi.RejectLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
      locale: { owner: { email: (req?.details?.notifyContact?.email ?? "") } },
    });
    const invoke1: Unary<localizationLocaleApprovalServiceApi.RejectLocaleRequest, localizationLocaleApprovalServiceApi.RejectLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient.rejectLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<localizationLocaleApprovalServiceApi.RejectLocaleRequest, localizationLocaleApprovalServiceApi.RejectLocaleResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = chatHandoffValidationServiceApi.NormalizeHandoffRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.locale?.owner?.email ?? "") } },
      handoff: { requester: { email: (req?.details?.newOwner?.email ?? "") } },
    });
    const invoke2: Unary<chatHandoffValidationServiceApi.NormalizeHandoffRequest, chatHandoffValidationServiceApi.NormalizeHandoffResponse> =
      (input, done) => this.chatHandoffValidationClient.normalizeHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<chatHandoffValidationServiceApi.NormalizeHandoffRequest, chatHandoffValidationServiceApi.NormalizeHandoffResponse>(invoke2, request2));
    const request3 = personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: reply2?.handoff?.audit?.createdAt },
    });
    const invoke3: Unary<personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest, personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse> =
      (input, done) => this.personalizationAffinityReportingClient.countAffinityTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("TerminateChatRoom.CountAffinityTotals", () => call<personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest, personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomLifecycleServiceApi.TerminateChatRoomResponse.fromPartial({ chatRoom: { owner: { email: (reply1?.locale?.owner?.email ?? "") } } }),
      chatChatRoomLifecycleServiceApi.TerminateChatRoomResponse.fromPartial({
        chatRoom: { audit: { createdBy: (reply2?.handoff?.audit?.createdBy ?? "") } },
      }),
      chatChatRoomLifecycleServiceApi.TerminateChatRoomResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      chatChatRoomLifecycleServiceApi.TerminateChatRoomResponse.fromPartial({
        chatRoom: { chatRoomId: (req?.chatRoomId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}

/**
 * The gRPC boundary for ChatRoomLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class ChatRoomLifecycleHandler {
  constructor(@inject(ChatRoomLifecycleWorkflow) private readonly workflow: ChatRoomLifecycleWorkflow) {}

  /**
   * Activates a chat room.
   */
  activateChatRoom = unary<chatChatRoomLifecycleServiceApi.ActivateChatRoomRequest, chatChatRoomLifecycleServiceApi.ActivateChatRoomResponse>(
    (request) => this.workflow.activateChatRoom(request),
  );

  /**
   * Expires a chat room.
   */
  expireChatRoom = unary<chatChatRoomLifecycleServiceApi.ExpireChatRoomRequest, chatChatRoomLifecycleServiceApi.ExpireChatRoomResponse>(
    (request) => this.workflow.expireChatRoom(request),
  );

  /**
   * Returns a chat room.
   */
  getChatRoomLifecycle = (call: ServerUnaryCall<chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleRequest, chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleResponse>, done: sendUnaryData<chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleResponse>): void => {
    void this.workflow.getChatRoomLifecycle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reinstates a chat room.
   */
  reinstateChatRoom = unary<chatChatRoomLifecycleServiceApi.ReinstateChatRoomRequest, chatChatRoomLifecycleServiceApi.ReinstateChatRoomResponse>(
    (request) => this.workflow.reinstateChatRoom(request),
  );

  /**
   * Renews a chat room.
   */
  renewChatRoom = unary<chatChatRoomLifecycleServiceApi.RenewChatRoomRequest, chatChatRoomLifecycleServiceApi.RenewChatRoomResponse>(
    (request) => this.workflow.renewChatRoom(request),
  );

  /**
   * Suspends a chat room.
   */
  suspendChatRoom = (call: ServerUnaryCall<chatChatRoomLifecycleServiceApi.SuspendChatRoomRequest, chatChatRoomLifecycleServiceApi.SuspendChatRoomResponse>, done: sendUnaryData<chatChatRoomLifecycleServiceApi.SuspendChatRoomResponse>): void => {
    void this.workflow.suspendChatRoom(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates a chat room.
   */
  terminateChatRoom = unary<chatChatRoomLifecycleServiceApi.TerminateChatRoomRequest, chatChatRoomLifecycleServiceApi.TerminateChatRoomResponse>(
    (request) => this.workflow.terminateChatRoom(request),
  );
}

export function implementation(handler: ChatRoomLifecycleHandler): chatChatRoomLifecycleServiceApi.ChatRoomLifecycleServiceServer {
  return {
    activateChatRoom: handler.activateChatRoom,
    expireChatRoom: handler.expireChatRoom,
    getChatRoomLifecycle: handler.getChatRoomLifecycle,
    reinstateChatRoom: handler.reinstateChatRoom,
    renewChatRoom: handler.renewChatRoom,
    suspendChatRoom: handler.suspendChatRoom,
    terminateChatRoom: handler.terminateChatRoom,
  };
}
