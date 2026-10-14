/**
 * Routes chat bots through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as chatChatBotApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_approval_service.js";
import * as chatChatBotLifecycleServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import * as chatChatBotReportingServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_reporting_service.js";
import * as chatChatRoomApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import * as chatChatRoomServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatHandoffCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as chatHandoffReportingServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as communityModerationApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as driversDriverCalculationServiceApi from "../../../../.cache/proto/acme/drivers/v1/driver_calculation_service.js";
import * as localizationTranslationJobWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_workflow_service.js";
import * as modelregistryRegisteredModelServiceApi from "../../../../.cache/proto/acme/modelregistry/v1/registered_model_service.js";
import * as notificationsNotificationExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as notificationsSubscriptionExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
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
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChatBotRecord } from "../data/records.js";
import { ChatRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat bot operations and persist audit data.
 */
@injectable()
export class ChatBotApprovalWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotLifecycleService") private readonly chatChatBotLifecycleClient: chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotReportingService") private readonly chatChatBotReportingClient: chatChatBotReportingServiceApi.ChatBotReportingServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomApprovalService") private readonly chatChatRoomApprovalClient: chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffCalculationService") private readonly chatHandoffCalculationClient: chatHandoffCalculationServiceApi.HandoffCalculationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffReportingService") private readonly chatHandoffReportingClient: chatHandoffReportingServiceApi.HandoffReportingServiceClient,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.drivers.v1.DriverCalculationService") private readonly driversDriverCalculationClient: driversDriverCalculationServiceApi.DriverCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobWorkflowService") private readonly localizationTranslationJobWorkflowClient: localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceClient,
    @inject("grpc:acme.modelregistry.v1.RegisteredModelService") private readonly modelregistryRegisteredModelClient: modelregistryRegisteredModelServiceApi.RegisteredModelServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationExportService") private readonly notificationsNotificationExportClient: notificationsNotificationExportServiceApi.NotificationExportServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionExportService") private readonly notificationsSubscriptionExportClient: notificationsSubscriptionExportServiceApi.SubscriptionExportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointApprovalService") private readonly webhooksWebhookEndpointApprovalClient: webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a chat bot.
   */
  async approveChatBot(req: chatChatBotApprovalServiceApi.ApproveChatBotRequest): Promise<chatChatBotApprovalServiceApi.ApproveChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "ApproveChatBot", req);
    this.logger.info("approve_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomApprovalServiceApi.RecallChatRoomRequest.fromPartial({
      chatRoom: { owner: { userId: (req?.chatBot?.owner?.userId ?? "") } },
      context: req?.context,
    });
    const invoke1: Unary<chatChatRoomApprovalServiceApi.RecallChatRoomRequest, chatChatRoomApprovalServiceApi.RecallChatRoomResponse> =
      (input, done) => this.chatChatRoomApprovalClient.recallChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<chatChatRoomApprovalServiceApi.RecallChatRoomResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = chatChatRoomApprovalServiceApi.SubmitChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: {
          countryCode: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.countryCode ?? ""),
        } },
        owner: {
          email: (reply1?.chatRoom?.owner?.email ?? ""),
          userId: (reply1?.chatRoom?.owner?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { approver: { displayName: (req?.chatBot?.owner?.displayName ?? "") } },
    });
    const invoke2: Unary<chatChatRoomApprovalServiceApi.SubmitChatRoomRequest, chatChatRoomApprovalServiceApi.SubmitChatRoomResponse> =
      (input, done) => this.chatChatRoomApprovalClient.submitChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    let selected3_1: string | undefined;
    switch (req?.chatBot?.action?.$case) {
      case "block":
        selected3_1 = ((req?.chatBot?.action?.$case === "block" ? req?.chatBot?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = notificationsNotificationExportServiceApi.ScheduleNotificationExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (selected3_1 ?? ""),
    });
    const invoke3: Unary<notificationsNotificationExportServiceApi.ScheduleNotificationExportRequest, notificationsNotificationExportServiceApi.ScheduleNotificationExportResponse> =
      (input, done) => this.notificationsNotificationExportClient.scheduleNotificationExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationExportServiceApi.ScheduleNotificationExportRequest, notificationsNotificationExportServiceApi.ScheduleNotificationExportResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotApprovalServiceApi.ApproveChatBotResponse.fromPartial({
        chatBot: { owner: { displayName: (reply1?.chatRoom?.owner?.displayName ?? "") } },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      chatChatBotApprovalServiceApi.ApproveChatBotResponse.fromPartial({
        chatBot: { audit: { createdBy: (reply2?.chatRoom?.audit?.createdBy ?? "") } },
      }),
      chatChatBotApprovalServiceApi.ApproveChatBotResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      chatChatBotApprovalServiceApi.ApproveChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          priority: (req?.chatBot?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Comments a chat bot.
   */
  async commentChatBotApproval(req: chatChatBotApprovalServiceApi.CommentChatBotApprovalRequest): Promise<chatChatBotApprovalServiceApi.CommentChatBotApprovalResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "CommentChatBotApproval", req);
    this.logger.info("comment_chat_bot_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomApprovalServiceApi.ApproveChatRoomRequest.fromPartial({
      chatRoom: {
        audit: {
          createdBy: (req?.chatBot?.audit?.createdBy ?? ""),
          etag: (req?.chatBot?.audit?.etag ?? ""),
        },
        owner: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const method1 = "approveChatRoom" as const;
    const invoke1: Unary<chatChatRoomApprovalServiceApi.ApproveChatRoomRequest, chatChatRoomApprovalServiceApi.ApproveChatRoomResponse> =
      (input, done) => this.chatChatRoomApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomApprovalServiceApi.ApproveChatRoomRequest, chatChatRoomApprovalServiceApi.ApproveChatRoomResponse>(invoke1, request1);
    const request2 = chatChatRoomApprovalServiceApi.RecallChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: {
          lines: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.lines ?? []).map((value) => value),
        } },
        dimensions: { height: (reply1?.chatRoom?.dimensions?.height ?? 0) },
        owner: { userId: (req?.chatBot?.owner?.userId ?? "") },
      },
      context: req?.context,
      details: { approver: { userId: (reply1?.chatRoom?.owner?.userId ?? "") } },
    });
    const proxy2 = forwarding(this.chatChatRoomApprovalClient);
    const invoke2: Unary<chatChatRoomApprovalServiceApi.RecallChatRoomRequest, chatChatRoomApprovalServiceApi.RecallChatRoomResponse> =
      (input, done) => proxy2.recallChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomApprovalServiceApi.RecallChatRoomRequest, chatChatRoomApprovalServiceApi.RecallChatRoomResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (reply2?.chatRoom?.locator?.$case) {
      case "address":
        selected3_1 = ((reply2?.chatRoom?.locator?.$case === "address" ? reply2?.chatRoom?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = chatChatRoomServiceApi.SearchChatRoomsRequest.fromPartial({
      context: req?.context,
      filter: { region: (selected3_1 ?? "") },
    });
    const invoke3: Unary<chatChatRoomServiceApi.SearchChatRoomsRequest, chatChatRoomServiceApi.SearchChatRoomsResponse> =
      (input, done) => this.chatChatRoomClient.searchChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatRoomServiceApi.SearchChatRoomsRequest, chatChatRoomServiceApi.SearchChatRoomsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotApprovalServiceApi.CommentChatBotApprovalResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      chatChatBotApprovalServiceApi.CommentChatBotApprovalResponse.fromPartial({ chatBot: { name: (reply2?.chatRoom?.name ?? "") } }),
      chatChatBotApprovalServiceApi.CommentChatBotApprovalResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
      }),
      chatChatBotApprovalServiceApi.CommentChatBotApprovalResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          description: (req?.chatBot?.description ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a chat bot.
   */
  async delegateChatBotApproval(req: chatChatBotApprovalServiceApi.DelegateChatBotApprovalRequest): Promise<chatChatBotApprovalServiceApi.DelegateChatBotApprovalResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "DelegateChatBotApproval", req);
    this.logger.info("delegate_chat_bot_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationApprovalServiceApi.DelegateModerationApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.chatBot?.owner?.userId ?? "") } },
      moderation: {
        assignee: { displayName: (req?.details?.approver?.displayName ?? "") },
        origin: { $case: "customer", customer: { email: (req?.details?.approver?.email ?? "") } },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<communityModerationApprovalServiceApi.DelegateModerationApprovalRequest, communityModerationApprovalServiceApi.DelegateModerationApprovalResponse> =
      (input, done) => this.communityModerationApprovalClient.delegateModerationApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationApprovalServiceApi.DelegateModerationApprovalRequest, communityModerationApprovalServiceApi.DelegateModerationApprovalResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotApprovalServiceApi.DelegateChatBotApprovalResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      chatChatBotApprovalServiceApi.DelegateChatBotApprovalResponse.fromPartial({
        chatBot: { chatBotId: (req?.chatBotId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Escalates a chat bot.
   */
  async escalateChatBot(req: chatChatBotApprovalServiceApi.EscalateChatBotRequest): Promise<chatChatBotApprovalServiceApi.EscalateChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "EscalateChatBot", req);
    this.logger.info("escalate_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityPostApprovalServiceApi.SubmitPostRequest.fromPartial({
      context: input1?.context,
      details: {
        approver: {
          displayName: (input1?.details?.approver?.displayName ?? ""),
          email: (input1?.details?.approver?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<communityPostApprovalServiceApi.SubmitPostRequest, communityPostApprovalServiceApi.SubmitPostResponse> =
      (input, done) => this.communityPostApprovalClient.submitPost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostApprovalServiceApi.SubmitPostRequest, communityPostApprovalServiceApi.SubmitPostResponse>(invoke1, request1);
    const request2 = driversDriverCalculationServiceApi.ExplainDriverCalculationRequest.fromPartial({
      context: req?.context,
      driver: {
        relationshipManager: { displayName: (req?.chatBot?.owner?.displayName ?? "") },
      },
    });
    const cloned2: driversDriverCalculationServiceApi.ExplainDriverCalculationRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<driversDriverCalculationServiceApi.ExplainDriverCalculationRequest, driversDriverCalculationServiceApi.ExplainDriverCalculationResponse> =
      (input, done) => this.driversDriverCalculationClient.explainDriverCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<driversDriverCalculationServiceApi.ExplainDriverCalculationRequest, driversDriverCalculationServiceApi.ExplainDriverCalculationResponse>(invoke2, cloned2);
    const request3 = notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: ((req?.chatBot?.action?.$case === "block" ? req?.chatBot?.action.block : undefined)?.reason ?? ""),
    });
    const decoded3 = notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportRequest.toJSON(request3))),
    );
    const invoke3: Unary<notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportResponse> =
      (input, done) => this.notificationsSubscriptionExportClient.scheduleSubscriptionExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportResponse>(invoke3, decoded3);
    const request4 = chatChatBotLifecycleServiceApi.SuspendChatBotRequest.fromPartial({
      chatBotId: (req?.chatBotId ?? ""),
      context: req?.context,
      details: {
        newOwner: { userId: (reply2?.driver?.relationshipManager?.userId ?? "") },
        notifyContact: {
          email: (req?.details?.approver?.email ?? ""),
          phone: (reply2?.driver?.contact?.phone ?? ""),
        },
      },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.SuspendChatBotRequest",
      value: Buffer.from(chatChatBotLifecycleServiceApi.SuspendChatBotRequest.encode(request4).finish()),
    });
    const unpacked4 = chatChatBotLifecycleServiceApi.SuspendChatBotRequest.decode(envelope4.value);
    const invoke4: Unary<chatChatBotLifecycleServiceApi.SuspendChatBotRequest, chatChatBotLifecycleServiceApi.SuspendChatBotResponse> =
      (input, done) => this.chatChatBotLifecycleClient.suspendChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatBotLifecycleServiceApi.SuspendChatBotRequest, chatChatBotLifecycleServiceApi.SuspendChatBotResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotApprovalServiceApi.EscalateChatBotResponse.fromPartial({
        outcome: {
          effectiveAt: reply1?.outcome?.effectiveAt,
          message: (reply1?.result?.message ?? ""),
        },
      }),
      chatChatBotApprovalServiceApi.EscalateChatBotResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      chatChatBotApprovalServiceApi.EscalateChatBotResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      chatChatBotApprovalServiceApi.EscalateChatBotResponse.fromPartial({ chatBot: { audit: { updatedAt: reply4?.chatBot?.audit?.updatedAt } } }),
      chatChatBotApprovalServiceApi.EscalateChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          name: (req?.chatBot?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a chat bot.
   */
  async getChatBotApprovalStatus(req: chatChatBotApprovalServiceApi.GetChatBotApprovalStatusRequest): Promise<chatChatBotApprovalServiceApi.GetChatBotApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChatBotApprovalStatus", req);
    this.logger.info("get_chat_bot_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffCalculationServiceApi.ExplainHandoffCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      handoff: { assignee: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const client1 = this.clients.get<chatHandoffCalculationServiceApi.HandoffCalculationServiceClient>("acme.chat.v1.HandoffCalculationService");
    const invoke1: Unary<chatHandoffCalculationServiceApi.ExplainHandoffCalculationRequest, chatHandoffCalculationServiceApi.ExplainHandoffCalculationResponse> =
      (input, done) => client1.explainHandoffCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffCalculationServiceApi.ExplainHandoffCalculationRequest, chatHandoffCalculationServiceApi.ExplainHandoffCalculationResponse>(invoke1, request1);
    const request2 = localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest.fromPartial({
      context: req?.context,
      translationJob: { requester: { email: (reply1?.handoff?.assignee?.email ?? "") } },
    });
    const invoke2: Unary<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse> =
      (input, done) => this.localizationTranslationJobWorkflowClient.advanceTranslationJobWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    return mergeResponses(
      chatChatBotApprovalServiceApi.GetChatBotApprovalStatusResponse.fromPartial({
        chatBot: { owner: { email: (reply1?.handoff?.requester?.email ?? "") } },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      chatChatBotApprovalServiceApi.GetChatBotApprovalStatusResponse.fromPartial({
        chatBot: { audit: { etag: (reply2?.translationJob?.audit?.etag ?? "") } },
      }),
      chatChatBotApprovalServiceApi.GetChatBotApprovalStatusResponse.fromPartial({ chatBot: { chatBotId: (req?.chatBotId ?? "") } }),
    );
  }

  /**
   * Lists chat bots a page at a time.
   */
  async listPendingChatBots(req: chatChatBotApprovalServiceApi.ListPendingChatBotsRequest): Promise<chatChatBotApprovalServiceApi.ListPendingChatBotsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingChatBots", req);
    this.logger.info("list_pending_chat_bots", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomApprovalServiceApi.ApproveChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        audit: { updatedAt: req?.filter?.createdAfter },
        owner: { email: (req?.context?.actor?.email ?? "") },
      },
      context: req?.context,
      details: { approver: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const invoke1: Unary<chatChatRoomApprovalServiceApi.ApproveChatRoomRequest, chatChatRoomApprovalServiceApi.ApproveChatRoomResponse> =
      (input, done) => this.chatChatRoomApprovalClient.approveChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<chatChatRoomApprovalServiceApi.ApproveChatRoomRequest, chatChatRoomApprovalServiceApi.ApproveChatRoomResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatBotApprovalServiceApi.ListPendingChatBotsResponse.fromPartial({
      chatBots: [{
        audit: { etag: (reply1?.chatRoom?.audit?.etag ?? "") },
        owner: reply1?.chatRoom?.owner,
      }],
    });
  }

  /**
   * Recalls a chat bot.
   */
  async recallChatBot(req: chatChatBotApprovalServiceApi.RecallChatBotRequest): Promise<chatChatBotApprovalServiceApi.RecallChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "RecallChatBot", req);
    this.logger.info("recall_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.chatBot?.action?.$case) {
      case "block":
        selected1_2 = ((req?.chatBot?.action?.$case === "block" ? req?.chatBot?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = notificationsSubscriptionExportServiceApi.ShareSubscriptionExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        recipient: { email: (req?.chatBot?.owner?.email ?? "") },
        variables: Object.fromEntries(Object.entries((req?.chatBot?.parameters ?? {}))),
      },
      reason: (selected1_2 ?? ""),
    });
    const invoke1: Unary<notificationsSubscriptionExportServiceApi.ShareSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.ShareSubscriptionExportResponse> =
      (input, done) => this.notificationsSubscriptionExportClient.shareSubscriptionExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionExportServiceApi.ShareSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.ShareSubscriptionExportResponse>(invoke1, request1);
    const request2 = chatChatRoomServiceApi.BatchGetChatRoomsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<chatChatRoomServiceApi.BatchGetChatRoomsRequest, chatChatRoomServiceApi.BatchGetChatRoomsResponse> =
      (input, done) => this.chatChatRoomClient.batchGetChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = chatChatBotReportingServiceApi.ListChatBotReportsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.chatBot?.audit?.updatedAt },
    });
    const reply3 = await this.workQueue.enqueue<chatChatBotReportingServiceApi.ListChatBotReportsRequest, chatChatBotReportingServiceApi.ListChatBotReportsResponse>(
      "acme.chat.v1.ChatBotApprovalService/RecallChatBot:2", request3,
    );
    const request4 = chatHandoffReportingServiceApi.CountHandoffTotalsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: reply1?.outcome?.effectiveAt },
    });
    const invoke4: Unary<chatHandoffReportingServiceApi.CountHandoffTotalsRequest, chatHandoffReportingServiceApi.CountHandoffTotalsResponse> =
      (input, done) => this.chatHandoffReportingClient.countHandoffTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await inRequest(req.context!, () => call<chatHandoffReportingServiceApi.CountHandoffTotalsRequest, chatHandoffReportingServiceApi.CountHandoffTotalsResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotApprovalServiceApi.RecallChatBotResponse.fromPartial({
        chatBot: { owner: { userId: (reply1?.subscription?.owner?.userId ?? "") } },
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
      }),
      chatChatBotApprovalServiceApi.RecallChatBotResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      chatChatBotApprovalServiceApi.RecallChatBotResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      chatChatBotApprovalServiceApi.RecallChatBotResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      chatChatBotApprovalServiceApi.RecallChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          description: (req?.chatBot?.description ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a chat bot.
   */
  async rejectChatBot(req: chatChatBotApprovalServiceApi.RejectChatBotRequest): Promise<chatChatBotApprovalServiceApi.RejectChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "RejectChatBot", req);
    this.logger.info("reject_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotReportingServiceApi.DeleteChatBotReportRequest.fromPartial({
      chatBotId: (req?.chatBot?.chatBotId ?? ""),
      context: req?.context,
      etag: (req?.chatBot?.audit?.etag ?? ""),
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<chatChatBotReportingServiceApi.DeleteChatBotReportRequest, chatChatBotReportingServiceApi.DeleteChatBotReportResponse> =
      (input, done) => this.chatChatBotReportingClient.deleteChatBotReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<chatChatBotReportingServiceApi.DeleteChatBotReportResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = webhooksWebhookEndpointApprovalServiceApi.DelegateWebhookEndpointApprovalRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: { audit: { updatedBy: (req?.chatBot?.audit?.updatedBy ?? "") } },
    });
    const invoke2: Unary<webhooksWebhookEndpointApprovalServiceApi.DelegateWebhookEndpointApprovalRequest, webhooksWebhookEndpointApprovalServiceApi.DelegateWebhookEndpointApprovalResponse> =
      (input, done) => this.webhooksWebhookEndpointApprovalClient.delegateWebhookEndpointApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = modelregistryRegisteredModelServiceApi.BatchGetRegisteredModelsRequest.fromPartial({ context: req?.context });
    const invoke3: Unary<modelregistryRegisteredModelServiceApi.BatchGetRegisteredModelsRequest, modelregistryRegisteredModelServiceApi.BatchGetRegisteredModelsResponse> =
      (input, done) => this.modelregistryRegisteredModelClient.batchGetRegisteredModels(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest.fromPartial({
      chatRoom: { audit: { createdBy: (req?.chatBot?.audit?.createdBy ?? "") } },
      context: req?.context,
    });
    const method4 = "checkChatRoomEligibility" as const;
    const invoke4: Unary<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse> =
      (input, done) => this.chatChatRoomValidationClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      chatChatBotApprovalServiceApi.RejectChatBotResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      chatChatBotApprovalServiceApi.RejectChatBotResponse.fromPartial({
        chatBot: {
          owner: { displayName: (reply2?.webhookEndpoint?.owner?.displayName ?? "") },
        },
        result: { message: (reply2?.outcome?.message ?? "") },
      }),
      chatChatBotApprovalServiceApi.RejectChatBotResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      chatChatBotApprovalServiceApi.RejectChatBotResponse.fromPartial({ result: { status: (reply4?.outcome?.status ?? "") } }),
      chatChatBotApprovalServiceApi.RejectChatBotResponse.fromPartial({
        chatBot: { chatBotId: (req?.chatBotId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Submits a chat bot.
   */
  async submitChatBot(req: chatChatBotApprovalServiceApi.SubmitChatBotRequest): Promise<chatChatBotApprovalServiceApi.SubmitChatBotResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "SubmitChatBot", req);
    this.logger.info("submit_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomValidationServiceApi.NormalizeChatRoomRequest.fromPartial({
      chatRoom: {
        audit: { createdBy: (req?.chatBot?.audit?.createdBy ?? "") },
        owner: { email: (req?.details?.approver?.email ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.chatBot?.owner?.email ?? "") } },
    });
    const proxy1 = forwarding(this.chatChatRoomValidationClient);
    const invoke1: Unary<chatChatRoomValidationServiceApi.NormalizeChatRoomRequest, chatChatRoomValidationServiceApi.NormalizeChatRoomResponse> =
      (input, done) => proxy1.normalizeChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomValidationServiceApi.NormalizeChatRoomRequest, chatChatRoomValidationServiceApi.NormalizeChatRoomResponse>(invoke1, request1);
    const request2 = chatChatRoomApprovalServiceApi.ApproveChatRoomRequest.fromPartial({
      chatRoom: { audit: { updatedAt: req?.chatBot?.audit?.updatedAt } },
      context: req?.context,
    });
    const invoke2: Unary<chatChatRoomApprovalServiceApi.ApproveChatRoomRequest, chatChatRoomApprovalServiceApi.ApproveChatRoomResponse> =
      (input, done) => this.chatChatRoomApprovalClient.approveChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomApprovalServiceApi.ApproveChatRoomRequest, chatChatRoomApprovalServiceApi.ApproveChatRoomResponse>(invoke2, request2);
    const request3 = personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest.fromPartial({
      affinity: { subject: { displayName: (req?.chatBot?.owner?.displayName ?? "") } },
      context: req?.context,
      details: { contact: { email: (req?.chatBot?.owner?.email ?? "") } },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest, personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse> =
      (input, done) => this.personalizationAffinityImportClient.mapAffinityImportColumns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest, personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotApprovalServiceApi.SubmitChatBotResponse.fromPartial({
        outcome: {
          message: (reply1?.outcome?.message ?? ""),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      chatChatBotApprovalServiceApi.SubmitChatBotResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      chatChatBotApprovalServiceApi.SubmitChatBotResponse.fromPartial({
        outcome: { message: (reply3?.outcome?.message ?? "") },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      chatChatBotApprovalServiceApi.SubmitChatBotResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          parameters: (req?.chatBot?.parameters ?? {}),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ChatBotApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ChatBotApprovalHandler {
  constructor(@inject(ChatBotApprovalWorkflow) private readonly workflow: ChatBotApprovalWorkflow) {}

  /**
   * Approves a chat bot.
   */
  approveChatBot = unary<chatChatBotApprovalServiceApi.ApproveChatBotRequest, chatChatBotApprovalServiceApi.ApproveChatBotResponse>(
    (request) => this.workflow.approveChatBot(request),
  );

  /**
   * Comments a chat bot.
   */
  commentChatBotApproval = unary<chatChatBotApprovalServiceApi.CommentChatBotApprovalRequest, chatChatBotApprovalServiceApi.CommentChatBotApprovalResponse>(
    (request) => this.workflow.commentChatBotApproval(request),
  );

  /**
   * Delegates a chat bot.
   */
  delegateChatBotApproval = (call: ServerUnaryCall<chatChatBotApprovalServiceApi.DelegateChatBotApprovalRequest, chatChatBotApprovalServiceApi.DelegateChatBotApprovalResponse>, done: sendUnaryData<chatChatBotApprovalServiceApi.DelegateChatBotApprovalResponse>): void => {
    void this.workflow.delegateChatBotApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a chat bot.
   */
  escalateChatBot = unary<chatChatBotApprovalServiceApi.EscalateChatBotRequest, chatChatBotApprovalServiceApi.EscalateChatBotResponse>(
    (request) => this.workflow.escalateChatBot(request),
  );

  /**
   * Returns a chat bot.
   */
  getChatBotApprovalStatus = unary<chatChatBotApprovalServiceApi.GetChatBotApprovalStatusRequest, chatChatBotApprovalServiceApi.GetChatBotApprovalStatusResponse>(
    (request) => this.workflow.getChatBotApprovalStatus(request),
  );

  /**
   * Lists chat bots a page at a time.
   */
  listPendingChatBots = (call: ServerUnaryCall<chatChatBotApprovalServiceApi.ListPendingChatBotsRequest, chatChatBotApprovalServiceApi.ListPendingChatBotsResponse>, done: sendUnaryData<chatChatBotApprovalServiceApi.ListPendingChatBotsResponse>): void => {
    void this.workflow.listPendingChatBots(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a chat bot.
   */
  recallChatBot = unary<chatChatBotApprovalServiceApi.RecallChatBotRequest, chatChatBotApprovalServiceApi.RecallChatBotResponse>(
    (request) => this.workflow.recallChatBot(request),
  );

  /**
   * Rejects a chat bot.
   */
  rejectChatBot = unary<chatChatBotApprovalServiceApi.RejectChatBotRequest, chatChatBotApprovalServiceApi.RejectChatBotResponse>(
    (request) => this.workflow.rejectChatBot(request),
  );

  /**
   * Submits a chat bot.
   */
  submitChatBot = (call: ServerUnaryCall<chatChatBotApprovalServiceApi.SubmitChatBotRequest, chatChatBotApprovalServiceApi.SubmitChatBotResponse>, done: sendUnaryData<chatChatBotApprovalServiceApi.SubmitChatBotResponse>): void => {
    void this.workflow.submitChatBot(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ChatBotApprovalHandler): chatChatBotApprovalServiceApi.ChatBotApprovalServiceServer {
  return {
    approveChatBot: handler.approveChatBot,
    commentChatBotApproval: handler.commentChatBotApproval,
    delegateChatBotApproval: handler.delegateChatBotApproval,
    escalateChatBot: handler.escalateChatBot,
    getChatBotApprovalStatus: handler.getChatBotApprovalStatus,
    listPendingChatBots: handler.listPendingChatBots,
    recallChatBot: handler.recallChatBot,
    rejectChatBot: handler.rejectChatBot,
    submitChatBot: handler.submitChatBot,
  };
}
