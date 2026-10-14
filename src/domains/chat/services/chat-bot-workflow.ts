/**
 * Runs the long-lived workflow that takes a chat bot from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as chatChatBotValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as chatChatBotWorkflowServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_workflow_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatChatRoomWorkflowServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_workflow_service.js";
import * as chatHandoffApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import * as chatHandoffSyncServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as communityPostWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as featurestoreFeatureViewCalculationServiceApi from "../../../../.cache/proto/acme/featurestore/v1/feature_view_calculation_service.js";
import * as fuelFuelCardCalculationServiceApi from "../../../../.cache/proto/acme/fuel/v1/fuel_card_calculation_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationTemplateAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import * as personalizationProfileWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
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
  workflow,
} from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
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
export class ChatBotWorkflowWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotValidationService") private readonly chatChatBotValidationClient: chatChatBotValidationServiceApi.ChatBotValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomWorkflowService") private readonly chatChatRoomWorkflowClient: chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceClient,
    @inject("grpc:acme.chat.v1.HandoffApprovalService") private readonly chatHandoffApprovalClient: chatHandoffApprovalServiceApi.HandoffApprovalServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.community.v1.PostWorkflowService") private readonly communityPostWorkflowClient: communityPostWorkflowServiceApi.PostWorkflowServiceClient,
    @inject("grpc:acme.featurestore.v1.FeatureViewCalculationService") private readonly featurestoreFeatureViewCalculationClient: featurestoreFeatureViewCalculationServiceApi.FeatureViewCalculationServiceClient,
    @inject("grpc:acme.fuel.v1.FuelCardCalculationService") private readonly fuelFuelCardCalculationClient: fuelFuelCardCalculationServiceApi.FuelCardCalculationServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateAdminService") private readonly notificationsNotificationTemplateAdminClient: notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileWorkflowService") private readonly personalizationProfileWorkflowClient: personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a chat bot.
   */
  async advanceChatBotWorkflow(req: chatChatBotWorkflowServiceApi.AdvanceChatBotWorkflowRequest): Promise<chatChatBotWorkflowServiceApi.AdvanceChatBotWorkflowResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "AdvanceChatBotWorkflow", req);
    this.logger.info("advance_chat_bot_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest.fromPartial({
      chatRoom: { audit: { updatedBy: (req?.chatBot?.audit?.updatedBy ?? "") } },
      context: req?.context,
      details: { notify: { name: req?.details?.notify?.name } },
    });
    const client1 = this.clients.get<chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceClient>("acme.chat.v1.ChatRoomWorkflowService");
    const invoke1: Unary<chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowResponse> =
      (input, done) => client1.retryChatRoomWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowResponse>(invoke1, request1);
    const request2 = communityPostWorkflowServiceApi.CancelPostWorkflowRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { createdAt: reply1?.chatRoom?.audit?.createdAt },
        counterparty: { displayName: (req?.chatBot?.owner?.displayName ?? "") },
        lines: [{
          tax: {
            amount: (req?.chatBot?.action?.$case === "discount" ? req?.chatBot?.action.discount : undefined)?.amount,
          },
        }],
      },
    });
    const invoke2: Unary<communityPostWorkflowServiceApi.CancelPostWorkflowRequest, communityPostWorkflowServiceApi.CancelPostWorkflowResponse> =
      (input, done) => this.communityPostWorkflowClient.cancelPostWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<communityPostWorkflowServiceApi.CancelPostWorkflowRequest, communityPostWorkflowServiceApi.CancelPostWorkflowResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = chatChatRoomValidationServiceApi.ExplainChatRoomDecisionRequest.fromPartial({
      chatRoom: { audit: { updatedBy: (reply2?.post?.audit?.updatedBy ?? "") } },
      context: req?.context,
    });
    const invoke3: Unary<chatChatRoomValidationServiceApi.ExplainChatRoomDecisionRequest, chatChatRoomValidationServiceApi.ExplainChatRoomDecisionResponse> =
      (input, done) => this.chatChatRoomValidationClient.explainChatRoomDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<chatChatRoomValidationServiceApi.ExplainChatRoomDecisionRequest, chatChatRoomValidationServiceApi.ExplainChatRoomDecisionResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotWorkflowServiceApi.AdvanceChatBotWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      chatChatBotWorkflowServiceApi.AdvanceChatBotWorkflowResponse.fromPartial({
        chatBot: { audit: { createdAt: reply2?.post?.audit?.createdAt } },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      chatChatBotWorkflowServiceApi.AdvanceChatBotWorkflowResponse.fromPartial({ outcome: { nextSteps: (reply3?.outcome?.nextSteps ?? []) } }),
      chatChatBotWorkflowServiceApi.AdvanceChatBotWorkflowResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          parameters: (req?.chatBot?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Returns a chat bot.
   */
  async inspectChatBotWorkflow(req: chatChatBotWorkflowServiceApi.InspectChatBotWorkflowRequest): Promise<chatChatBotWorkflowServiceApi.InspectChatBotWorkflowResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectChatBotWorkflow", req);
    this.logger.info("inspect_chat_bot_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    return chatChatBotWorkflowServiceApi.InspectChatBotWorkflowResponse.fromPartial({ chatBot: { chatBotId: (req?.chatBotId ?? "") } });
  }

  /**
   * Lists chat bots a page at a time.
   */
  async listChatBotWorkflows(req: chatChatBotWorkflowServiceApi.ListChatBotWorkflowsRequest): Promise<chatChatBotWorkflowServiceApi.ListChatBotWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListChatBotWorkflows", req);
    this.logger.info("list_chat_bot_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        attributes: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        correlationId: (req?.filter?.ownerId ?? ""),
        measurements: [{ observedAt: req?.filter?.createdAfter }],
      },
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.pauseDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ListChatBotWorkflows.PauseDeliveryAttemptWorkflow", () => call<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse>(invoke1, request1));
    const request2 = notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        occurredAt: req?.context?.deadline,
        source: (req?.context?.actor?.userId ?? ""),
      } },
      context: req?.context,
    });
    const stream2 = this.notificationsDeliveryAttemptSyncClient.streamDeliveryAttemptChanges(metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const reading2 = collect(stream2);
    const writing2 = (async () => {
      await write(stream2, request2);
      stream2.end();
    })();
    const [messages2] = await Promise.all([reading2, writing2]);
    const reply2 = messages2.at(-1) ?? notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatBotWorkflowServiceApi.ListChatBotWorkflowsResponse.fromPartial({
      chatBots: [{
        owner: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
      }],
    });
  }

  /**
   * Pauses a chat bot.
   */
  async pauseChatBotWorkflow(req: chatChatBotWorkflowServiceApi.PauseChatBotWorkflowRequest): Promise<chatChatBotWorkflowServiceApi.PauseChatBotWorkflowResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "PauseChatBotWorkflow", req);
    this.logger.info("pause_chat_bot_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.details?.notify?.email ?? "") } },
      profile: {
        audit: {
          createdAt: req?.chatBot?.audit?.createdAt,
          updatedBy: (req?.chatBot?.audit?.updatedBy ?? ""),
        },
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse> =
      (input, done) => this.personalizationProfileWorkflowClient.advanceProfileWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = chatHandoffApprovalServiceApi.ListPendingHandoffsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.profile?.audit?.createdAt,
        region: (reply1?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<chatHandoffApprovalServiceApi.ListPendingHandoffsRequest, chatHandoffApprovalServiceApi.ListPendingHandoffsResponse>(
      "acme.chat.v1.ChatBotWorkflowService/PauseChatBotWorkflow:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotWorkflowServiceApi.PauseChatBotWorkflowResponse.fromPartial({
        chatBot: { owner: { email: (reply1?.profile?.relationshipManager?.email ?? "") } },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      chatChatBotWorkflowServiceApi.PauseChatBotWorkflowResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      chatChatBotWorkflowServiceApi.PauseChatBotWorkflowResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          version: (req?.chatBot?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Resumes a chat bot.
   */
  async resumeChatBotWorkflow(req: chatChatBotWorkflowServiceApi.ResumeChatBotWorkflowRequest): Promise<chatChatBotWorkflowServiceApi.ResumeChatBotWorkflowResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "ResumeChatBotWorkflow", req);
    this.logger.info("resume_chat_bot_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fuelFuelCardCalculationServiceApi.QuoteFuelCardRequest.fromPartial({
      context: req?.context,
      fuelCard: {
        audit: { updatedBy: (req?.chatBot?.audit?.updatedBy ?? "") },
        contact: {
          email: (req?.chatBot?.owner?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<fuelFuelCardCalculationServiceApi.QuoteFuelCardRequest, fuelFuelCardCalculationServiceApi.QuoteFuelCardResponse> =
      (input, done) => this.fuelFuelCardCalculationClient.quoteFuelCard(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<fuelFuelCardCalculationServiceApi.QuoteFuelCardRequest, fuelFuelCardCalculationServiceApi.QuoteFuelCardResponse>(invoke1, request1));
    const request2 = chatChatBotValidationServiceApi.CheckChatBotEligibilityRequest.fromPartial({
      chatBot: { owner: { displayName: (reply1?.fuelCard?.holder?.displayName ?? "") } },
      context: req?.context,
    });
    const invoke2: Unary<chatChatBotValidationServiceApi.CheckChatBotEligibilityRequest, chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse> =
      (input, done) => this.chatChatBotValidationClient.checkChatBotEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotWorkflowServiceApi.ResumeChatBotWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      chatChatBotWorkflowServiceApi.ResumeChatBotWorkflowResponse.fromPartial({
        chatBot: { audit: { createdBy: (reply2?.chatBot?.audit?.createdBy ?? "") } },
      }),
      chatChatBotWorkflowServiceApi.ResumeChatBotWorkflowResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          priority: (req?.chatBot?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Retrys a chat bot.
   */
  async retryChatBotWorkflow(req: chatChatBotWorkflowServiceApi.RetryChatBotWorkflowRequest): Promise<chatChatBotWorkflowServiceApi.RetryChatBotWorkflowResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "RetryChatBotWorkflow", req);
    this.logger.info("retry_chat_bot_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: { audit: { createdBy: (req?.chatBot?.audit?.createdBy ?? "") } },
    });
    const invoke1: Unary<notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateAdminClient.repairNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotWorkflowServiceApi.RetryChatBotWorkflowResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      chatChatBotWorkflowServiceApi.RetryChatBotWorkflowResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          description: (req?.chatBot?.description ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a chat bot.
   */
  async signalChatBotWorkflow(req: chatChatBotWorkflowServiceApi.SignalChatBotWorkflowRequest): Promise<chatChatBotWorkflowServiceApi.SignalChatBotWorkflowResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "SignalChatBotWorkflow", req);
    this.logger.info("signal_chat_bot_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserQueryServiceApi.ResolveUsersRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<identityUserQueryServiceApi.ResolveUsersRequest, identityUserQueryServiceApi.ResolveUsersResponse> =
      (input, done) => this.identityUserQueryClient.resolveUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotWorkflowServiceApi.SignalChatBotWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      chatChatBotWorkflowServiceApi.SignalChatBotWorkflowResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          priority: (req?.chatBot?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Starts a chat bot.
   */
  async startChatBotWorkflow(req: chatChatBotWorkflowServiceApi.StartChatBotWorkflowRequest): Promise<chatChatBotWorkflowServiceApi.StartChatBotWorkflowResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "StartChatBotWorkflow", req);
    this.logger.info("start_chat_bot_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featurestoreFeatureViewCalculationServiceApi.ExplainFeatureViewCalculationRequest.fromPartial({
      context: req?.context,
      featureView: {
        audit: { etag: (req?.chatBot?.audit?.etag ?? "") },
        owner: { userId: (req?.chatBot?.owner?.userId ?? "") },
      },
    });
    const method1 = "explainFeatureViewCalculation" as const;
    const invoke1: Unary<featurestoreFeatureViewCalculationServiceApi.ExplainFeatureViewCalculationRequest, featurestoreFeatureViewCalculationServiceApi.ExplainFeatureViewCalculationResponse> =
      (input, done) => this.featurestoreFeatureViewCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featurestoreFeatureViewCalculationServiceApi.ExplainFeatureViewCalculationRequest, featurestoreFeatureViewCalculationServiceApi.ExplainFeatureViewCalculationResponse>(invoke1, request1);
    const request2 = chatHandoffSyncServiceApi.ReconcileHandoffsRequest.fromPartial({
      context: req?.context,
      handoff: { audit: { etag: (req?.chatBot?.audit?.etag ?? "") } },
    });
    const proxy2 = forwarding(this.chatHandoffSyncClient);
    const invoke2: Unary<chatHandoffSyncServiceApi.ReconcileHandoffsRequest, chatHandoffSyncServiceApi.ReconcileHandoffsResponse> =
      (input, done) => proxy2.reconcileHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatHandoffSyncServiceApi.ReconcileHandoffsRequest, chatHandoffSyncServiceApi.ReconcileHandoffsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotWorkflowServiceApi.StartChatBotWorkflowResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      chatChatBotWorkflowServiceApi.StartChatBotWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.outcome?.status ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      chatChatBotWorkflowServiceApi.StartChatBotWorkflowResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          version: (req?.chatBot?.version ?? 0),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ChatBotWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ChatBotWorkflowHandler {
  constructor(@inject(ChatBotWorkflowWorkflow) private readonly workflow: ChatBotWorkflowWorkflow) {}

  /**
   * Advances a chat bot.
   */
  advanceChatBotWorkflow = unary<chatChatBotWorkflowServiceApi.AdvanceChatBotWorkflowRequest, chatChatBotWorkflowServiceApi.AdvanceChatBotWorkflowResponse>(
    (request) => this.workflow.advanceChatBotWorkflow(request),
  );

  /**
   * Returns a chat bot.
   */
  inspectChatBotWorkflow = unary<chatChatBotWorkflowServiceApi.InspectChatBotWorkflowRequest, chatChatBotWorkflowServiceApi.InspectChatBotWorkflowResponse>(
    (request) => this.workflow.inspectChatBotWorkflow(request),
  );

  /**
   * Lists chat bots a page at a time.
   */
  listChatBotWorkflows = (call: ServerUnaryCall<chatChatBotWorkflowServiceApi.ListChatBotWorkflowsRequest, chatChatBotWorkflowServiceApi.ListChatBotWorkflowsResponse>, done: sendUnaryData<chatChatBotWorkflowServiceApi.ListChatBotWorkflowsResponse>): void => {
    void this.workflow.listChatBotWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a chat bot.
   */
  pauseChatBotWorkflow = unary<chatChatBotWorkflowServiceApi.PauseChatBotWorkflowRequest, chatChatBotWorkflowServiceApi.PauseChatBotWorkflowResponse>(
    (request) => this.workflow.pauseChatBotWorkflow(request),
  );

  /**
   * Resumes a chat bot.
   */
  resumeChatBotWorkflow = unary<chatChatBotWorkflowServiceApi.ResumeChatBotWorkflowRequest, chatChatBotWorkflowServiceApi.ResumeChatBotWorkflowResponse>(
    (request) => this.workflow.resumeChatBotWorkflow(request),
  );

  /**
   * Retrys a chat bot.
   */
  retryChatBotWorkflow = (call: ServerUnaryCall<chatChatBotWorkflowServiceApi.RetryChatBotWorkflowRequest, chatChatBotWorkflowServiceApi.RetryChatBotWorkflowResponse>, done: sendUnaryData<chatChatBotWorkflowServiceApi.RetryChatBotWorkflowResponse>): void => {
    void this.workflow.retryChatBotWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a chat bot.
   */
  signalChatBotWorkflow = unary<chatChatBotWorkflowServiceApi.SignalChatBotWorkflowRequest, chatChatBotWorkflowServiceApi.SignalChatBotWorkflowResponse>(
    (request) => this.workflow.signalChatBotWorkflow(request),
  );

  /**
   * Starts a chat bot.
   */
  startChatBotWorkflow = unary<chatChatBotWorkflowServiceApi.StartChatBotWorkflowRequest, chatChatBotWorkflowServiceApi.StartChatBotWorkflowResponse>(
    (request) => this.workflow.startChatBotWorkflow(request),
  );
}

export function implementation(handler: ChatBotWorkflowHandler): chatChatBotWorkflowServiceApi.ChatBotWorkflowServiceServer {
  return {
    advanceChatBotWorkflow: handler.advanceChatBotWorkflow,
    inspectChatBotWorkflow: handler.inspectChatBotWorkflow,
    listChatBotWorkflows: handler.listChatBotWorkflows,
    pauseChatBotWorkflow: handler.pauseChatBotWorkflow,
    resumeChatBotWorkflow: handler.resumeChatBotWorkflow,
    retryChatBotWorkflow: handler.retryChatBotWorkflow,
    signalChatBotWorkflow: handler.signalChatBotWorkflow,
    startChatBotWorkflow: handler.startChatBotWorkflow,
  };
}
