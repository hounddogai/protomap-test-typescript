/**
 * Runs the long-lived workflow that takes a chat room from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as chatChatBotApprovalServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_approval_service.js";
import * as chatChatBotReportingServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_reporting_service.js";
import * as chatChatRoomApprovalServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import * as chatChatRoomLifecycleServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_lifecycle_service.js";
import * as chatChatRoomWorkflowServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_workflow_service.js";
import * as chatHandoffSyncServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as identityUserValidationServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as showsShowQueryServiceApi from "../../../../../.cache/proto/acme/shows/v1/show_query_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
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
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toChatRoomRecord } from "../../data/records.js";
import { ChatRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat room operations and persist audit data.
 */
@injectable()
export class ChatRoomWorkflowWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotApprovalService") private readonly chatChatBotApprovalClient: chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotReportingService") private readonly chatChatBotReportingClient: chatChatBotReportingServiceApi.ChatBotReportingServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomApprovalService") private readonly chatChatRoomApprovalClient: chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomLifecycleService") private readonly chatChatRoomLifecycleClient: chatChatRoomLifecycleServiceApi.ChatRoomLifecycleServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentApprovalService") private readonly experimentsExperimentApprovalClient: experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("grpc:acme.shows.v1.ShowQueryService") private readonly showsShowQueryClient: showsShowQueryServiceApi.ShowQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointApprovalService") private readonly webhooksWebhookEndpointApprovalClient: webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a chat room.
   */
  async advanceChatRoomWorkflow(req: chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowRequest): Promise<chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "AdvanceChatRoomWorkflow", req);
    this.logger.info("advance_chat_room_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = personalizationRecommendationSyncServiceApi.PushRecommendationRequest.fromPartial({
      context: input1?.context,
      recommendation: {
        billingAddress: {
          locality: ((input1?.chatRoom?.locator?.$case === "address" ? input1?.chatRoom?.locator.address : undefined)?.locality ?? ""),
          postalCode: ((input1?.chatRoom?.locator?.$case === "address" ? input1?.chatRoom?.locator.address : undefined)?.postalCode ?? ""),
        },
        lines: [{
          description: (input1?.chatRoom?.components?.["primary"]?.description ?? ""),
        }],
      },
    });
    const invoke1: Unary<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse> =
      (input, done) => this.personalizationRecommendationSyncClient.pushRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse>(invoke1, request1);
    const request2 = chatChatBotApprovalServiceApi.RecallChatBotRequest.fromPartial({
      chatBot: {
        audit: {
          createdAt: req?.chatRoom?.audit?.createdAt,
          createdBy: (req?.chatRoom?.audit?.createdBy ?? ""),
        },
        owner: { email: (req?.details?.notify?.email ?? "") },
      },
      context: req?.context,
      details: { approver: { email: (req?.chatRoom?.owner?.email ?? "") } },
    });
    const cloned2: chatChatBotApprovalServiceApi.RecallChatBotRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<chatChatBotApprovalServiceApi.RecallChatBotRequest, chatChatBotApprovalServiceApi.RecallChatBotResponse> =
      (input, done) => this.chatChatBotApprovalClient.recallChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatBotApprovalServiceApi.RecallChatBotRequest, chatChatBotApprovalServiceApi.RecallChatBotResponse>(invoke2, cloned2);
    const request3 = notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: { updatedBy: (reply1?.recommendation?.audit?.updatedBy ?? "") },
        settlement: { $case: "bank", bank: {
          iban: ((reply1?.recommendation?.settlement?.$case === "bank" ? reply1?.recommendation?.settlement.bank : undefined)?.iban ?? ""),
        } },
        billingAddress: {
          region: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? ""),
        },
        lines: [{
          tax: {
            amount: (reply2?.chatBot?.action?.$case === "discount" ? reply2?.chatBot?.action.discount : undefined)?.amount,
          },
        }],
      },
    });
    const decoded3 = notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest.toJSON(request3))),
    );
    const invoke3: Unary<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateSyncClient.syncNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse>(invoke3, decoded3);
    const request4 = chatHandoffSyncServiceApi.SyncHandoffsRequest.fromPartial({
      context: req?.context,
      handoff: { assignee: { displayName: (req?.chatRoom?.owner?.displayName ?? "") } },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.SyncHandoffsRequest",
      value: Buffer.from(chatHandoffSyncServiceApi.SyncHandoffsRequest.encode(request4).finish()),
    });
    const unpacked4 = chatHandoffSyncServiceApi.SyncHandoffsRequest.decode(envelope4.value);
    const invoke4: Unary<chatHandoffSyncServiceApi.SyncHandoffsRequest, chatHandoffSyncServiceApi.SyncHandoffsResponse> =
      (input, done) => this.chatHandoffSyncClient.syncHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatHandoffSyncServiceApi.SyncHandoffsRequest, chatHandoffSyncServiceApi.SyncHandoffsResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowResponse.fromPartial({
        chatRoom: {
          audit: { createdBy: (reply1?.recommendation?.audit?.createdBy ?? "") },
        },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowResponse.fromPartial({
        chatRoom: {
          audit: { updatedBy: (reply3?.notificationTemplate?.audit?.updatedBy ?? "") },
        },
        result: { status: (reply3?.outcome?.status ?? "") },
      }),
      chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowResponse.fromPartial({
        chatRoom: { audit: { updatedBy: (reply4?.handoff?.audit?.updatedBy ?? "") } },
        outcome: { referenceId: (reply4?.outcome?.referenceId ?? "") },
      }),
      chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          name: (req?.chatRoom?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a chat room.
   */
  async cancelChatRoomWorkflow(req: chatChatRoomWorkflowServiceApi.CancelChatRoomWorkflowRequest): Promise<chatChatRoomWorkflowServiceApi.CancelChatRoomWorkflowResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "CancelChatRoomWorkflow", req);
    this.logger.info("cancel_chat_room_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chatRoom?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = chatHandoffSyncServiceApi.ListHandoffConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatRoom?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
        ownerId: (req?.chatRoom?.chatRoomId ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<chatHandoffSyncServiceApi.ListHandoffConflictsRequest, chatHandoffSyncServiceApi.ListHandoffConflictsResponse> =
      (input, done) => this.chatHandoffSyncClient.listHandoffConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffSyncServiceApi.ListHandoffConflictsRequest, chatHandoffSyncServiceApi.ListHandoffConflictsResponse>(invoke1, request1);
    const request2 = notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.resolveNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomWorkflowServiceApi.CancelChatRoomWorkflowResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      chatChatRoomWorkflowServiceApi.CancelChatRoomWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      chatChatRoomWorkflowServiceApi.CancelChatRoomWorkflowResponse.fromPartial({
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
  async inspectChatRoomWorkflow(req: chatChatRoomWorkflowServiceApi.InspectChatRoomWorkflowRequest): Promise<chatChatRoomWorkflowServiceApi.InspectChatRoomWorkflowResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectChatRoomWorkflow", req);
    this.logger.info("inspect_chat_room_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotApprovalServiceApi.DelegateChatBotApprovalRequest.fromPartial({
      chatBot: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<chatChatBotApprovalServiceApi.DelegateChatBotApprovalRequest, chatChatBotApprovalServiceApi.DelegateChatBotApprovalResponse> =
      (input, done) => this.chatChatBotApprovalClient.delegateChatBotApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<chatChatBotApprovalServiceApi.DelegateChatBotApprovalRequest, chatChatBotApprovalServiceApi.DelegateChatBotApprovalResponse>(invoke1, request1));
    const request2 = auditAuditEventServiceApi.CreateAuditEventRequest.fromPartial({
      auditEvent: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        occurredAt: reply1?.chatBot?.audit?.updatedAt,
        subject: { displayName: (reply1?.chatBot?.owner?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<auditAuditEventServiceApi.CreateAuditEventRequest, auditAuditEventServiceApi.CreateAuditEventResponse> =
      (input, done) => this.auditAuditEventClient.createAuditEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("InspectChatRoomWorkflow.CreateAuditEvent", () => call<auditAuditEventServiceApi.CreateAuditEventRequest, auditAuditEventServiceApi.CreateAuditEventResponse>(invoke2, request2));
    return mergeResponses(
      chatChatRoomWorkflowServiceApi.InspectChatRoomWorkflowResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      chatChatRoomWorkflowServiceApi.InspectChatRoomWorkflowResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      chatChatRoomWorkflowServiceApi.InspectChatRoomWorkflowResponse.fromPartial({ chatRoom: { chatRoomId: (req?.chatRoomId ?? "") } }),
    );
  }

  /**
   * Lists chat rooms a page at a time.
   */
  async listChatRoomWorkflows(req: chatChatRoomWorkflowServiceApi.ListChatRoomWorkflowsRequest): Promise<chatChatRoomWorkflowServiceApi.ListChatRoomWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListChatRoomWorkflows", req);
    this.logger.info("list_chat_room_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatRoomWorkflowServiceApi.ListChatRoomWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a chat room.
   */
  async pauseChatRoomWorkflow(req: chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowRequest): Promise<chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "PauseChatRoomWorkflow", req);
    this.logger.info("pause_chat_room_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatRoom?.audit?.createdAt,
        ownerId: (req?.chatRoom?.components?.["primary"]?.componentId ?? ""),
        region: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.suggestFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = showsShowQueryServiceApi.FindShowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatRoom?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        region: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<showsShowQueryServiceApi.FindShowsRequest, showsShowQueryServiceApi.FindShowsResponse>(
      "acme.chat.v1.ChatRoomWorkflowService/PauseChatRoomWorkflow:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          owner: req?.chatRoom?.owner,
        },
      }),
    );
  }

  /**
   * Resumes a chat room.
   */
  async resumeChatRoomWorkflow(req: chatChatRoomWorkflowServiceApi.ResumeChatRoomWorkflowRequest): Promise<chatChatRoomWorkflowServiceApi.ResumeChatRoomWorkflowResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "ResumeChatRoomWorkflow", req);
    this.logger.info("resume_chat_room_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomApprovalServiceApi.ApproveChatRoomRequest.fromPartial({
      chatRoom: {
        audit: { etag: (req?.chatRoom?.audit?.etag ?? "") },
        dimensions: { length: (req?.chatRoom?.dimensions?.length ?? 0) },
        owner: { email: (req?.details?.notify?.email ?? "") },
      },
      context: req?.context,
      details: { approver: { userId: (req?.chatRoom?.owner?.userId ?? "") } },
    });
    const invoke1: Unary<chatChatRoomApprovalServiceApi.ApproveChatRoomRequest, chatChatRoomApprovalServiceApi.ApproveChatRoomResponse> =
      (input, done) => this.chatChatRoomApprovalClient.approveChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<chatChatRoomApprovalServiceApi.ApproveChatRoomRequest, chatChatRoomApprovalServiceApi.ApproveChatRoomResponse>(invoke1, request1));
    const request2 = chatChatBotReportingServiceApi.StreamChatBotMetricsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.details?.notify?.email ?? ""),
        phone: (req?.details?.notify?.phone ?? ""),
      },
    });
    const stream2 = this.chatChatBotReportingClient.streamChatBotMetrics(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? chatChatBotReportingServiceApi.StreamChatBotMetricsResponse.fromPartial({});
    const request3 = webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        audit: {
          createdBy: (req?.chatRoom?.audit?.createdBy ?? ""),
          updatedAt: reply1?.chatRoom?.audit?.updatedAt,
        },
        dimensions: { width: (req?.chatRoom?.dimensions?.width ?? 0) },
      },
    });
    const invoke3: Unary<webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointApprovalClient.approveWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = notificationsNotificationSyncServiceApi.PushNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { email: (reply3?.webhookEndpoint?.owner?.email ?? "") },
        audit: { updatedBy: (reply3?.webhookEndpoint?.audit?.updatedBy ?? "") },
        requester: { phone: (req?.details?.notify?.phone ?? "") },
      },
    });
    const invoke4: Unary<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse> =
      (input, done) => this.notificationsNotificationSyncClient.pushNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomWorkflowServiceApi.ResumeChatRoomWorkflowResponse.fromPartial({ chatRoom: { specs: (reply1?.chatRoom?.specs ?? {}) } }),
      chatChatRoomWorkflowServiceApi.ResumeChatRoomWorkflowResponse.fromPartial({
        chatRoom: { tags: (reply3?.webhookEndpoint?.tags ?? []) },
        result: { status: (reply3?.outcome?.status ?? "") },
      }),
      chatChatRoomWorkflowServiceApi.ResumeChatRoomWorkflowResponse.fromPartial({
        chatRoom: { owner: { email: (reply4?.notification?.requester?.email ?? "") } },
      }),
      chatChatRoomWorkflowServiceApi.ResumeChatRoomWorkflowResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          name: (req?.chatRoom?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a chat room.
   */
  async retryChatRoomWorkflow(req: chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest): Promise<chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "RetryChatRoomWorkflow", req);
    this.logger.info("retry_chat_room_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.notify?.email ?? "") } },
      experiment: {
        participants: [{
          contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
        }],
      },
    });
    const invoke1: Unary<experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest, experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse> =
      (input, done) => this.experimentsExperimentApprovalClient.commentExperimentApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = identityUserValidationServiceApi.CheckUserEligibilityRequest.fromPartial({
      context: req?.context,
      user: { contact: { name: req?.details?.notify?.name } },
    });
    const method2 = "checkUserEligibility" as const;
    const invoke2: Unary<identityUserValidationServiceApi.CheckUserEligibilityRequest, identityUserValidationServiceApi.CheckUserEligibilityResponse> =
      (input, done) => this.identityUserValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserValidationServiceApi.CheckUserEligibilityRequest, identityUserValidationServiceApi.CheckUserEligibilityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowResponse.fromPartial({
        chatRoom: { audit: { etag: (reply1?.experiment?.audit?.etag ?? "") } },
      }),
      chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowResponse.fromPartial({
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          specs: (req?.chatRoom?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Signals a chat room.
   */
  async signalChatRoomWorkflow(req: chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowRequest): Promise<chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "SignalChatRoomWorkflow", req);
    this.logger.info("signal_chat_room_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomLifecycleServiceApi.ReinstateChatRoomRequest.fromPartial({
      chatRoomId: (req?.chatRoom?.chatRoomId ?? ""),
      context: req?.context,
      details: { newOwner: { email: (req?.chatRoom?.owner?.email ?? "") } },
    });
    const proxy1 = forwarding(this.chatChatRoomLifecycleClient);
    const invoke1: Unary<chatChatRoomLifecycleServiceApi.ReinstateChatRoomRequest, chatChatRoomLifecycleServiceApi.ReinstateChatRoomResponse> =
      (input, done) => proxy1.reinstateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomLifecycleServiceApi.ReinstateChatRoomRequest, chatChatRoomLifecycleServiceApi.ReinstateChatRoomResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowResponse.fromPartial({ chatRoom: { categoryPath: (reply1?.chatRoom?.categoryPath ?? []) } }),
      chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          code: (req?.chatRoom?.code ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a chat room.
   */
  async startChatRoomWorkflow(req: chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowRequest): Promise<chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "StartChatRoomWorkflow", req);
    this.logger.info("start_chat_room_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationSyncServiceApi.PushNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        requester: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse> =
      (input, done) => this.notificationsNotificationSyncClient.pushNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowResponse.fromPartial({ chatRoom: { tags: (reply1?.notification?.tags ?? []) } }),
      chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          name: (req?.chatRoom?.name ?? ""),
        },
      }),
    );
  }
}
