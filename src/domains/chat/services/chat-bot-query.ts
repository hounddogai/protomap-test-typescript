/**
 * Answers read-only questions about chat bots, for screens and reports. Remote work stays behind typed client ports.
 */

import * as admissionsAdmissionCalculationServiceApi from "../../../../.cache/proto/acme/admissions/v1/admission_calculation_service.js";
import * as chatChatBotQueryServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_query_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as chatHandoffCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as deliveriesDeliveryQueryServiceApi from "../../../../.cache/proto/acme/deliveries/v1/delivery_query_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as notificationsNotificationTemplateAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { ChatRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat bot operations and persist audit data.
 */
@injectable()
export class ChatBotQueryWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.admissions.v1.AdmissionCalculationService") private readonly admissionsAdmissionCalculationClient: admissionsAdmissionCalculationServiceApi.AdmissionCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffCalculationService") private readonly chatHandoffCalculationClient: chatHandoffCalculationServiceApi.HandoffCalculationServiceClient,
    @inject("grpc:acme.deliveries.v1.DeliveryQueryService") private readonly deliveriesDeliveryQueryClient: deliveriesDeliveryQueryServiceApi.DeliveryQueryServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateAdminService") private readonly notificationsNotificationTemplateAdminClient: notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists chat bots a page at a time.
   */
  async browseChatBots(req: chatChatBotQueryServiceApi.BrowseChatBotsRequest): Promise<chatChatBotQueryServiceApi.BrowseChatBotsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseChatBots", req);
    this.logger.info("browse_chat_bots", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatBotQueryServiceApi.BrowseChatBotsResponse.fromPartial({});
  }

  /**
   * Counts chat bots by status.
   */
  async countChatBots(req: chatChatBotQueryServiceApi.CountChatBotsRequest): Promise<chatChatBotQueryServiceApi.CountChatBotsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountChatBots", req);
    this.logger.info("count_chat_bots", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatBotQueryServiceApi.CountChatBotsResponse.fromPartial({});
  }

  /**
   * Streams every matching chat bot.
   */
  async exportChatBots(req: chatChatBotQueryServiceApi.ExportChatBotsRequest): Promise<chatChatBotQueryServiceApi.ExportChatBotsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportChatBots", req);
    this.logger.info("export_chat_bots", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffCalculationServiceApi.CalculateHandoffRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const proxy1 = forwarding(this.chatHandoffCalculationClient);
    const invoke1: Unary<chatHandoffCalculationServiceApi.CalculateHandoffRequest, chatHandoffCalculationServiceApi.CalculateHandoffResponse> =
      (input, done) => proxy1.calculateHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffCalculationServiceApi.CalculateHandoffRequest, chatHandoffCalculationServiceApi.CalculateHandoffResponse>(invoke1, request1);
    const request2 = featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (reply1?.handoff?.requester?.phone ?? "") } },
      featureFlag: {
        audit: {
          createdAt: reply1?.handoff?.audit?.createdAt,
          createdBy: (reply1?.handoff?.audit?.createdBy ?? ""),
        },
        owner: { email: (reply1?.handoff?.assignee?.email ?? "") },
      },
    });
    const invoke2: Unary<featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.previewFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagResponse>(invoke2, request2);
    const request3 = notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        action: { $case: "discount", discount: {
          amount: (reply2?.featureFlag?.action?.$case === "discount" ? reply2?.featureFlag?.action.discount : undefined)?.amount,
        } },
        owner: { email: (reply1?.handoff?.assignee?.email ?? "") },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest, notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient.pushSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest, notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      chatChatBotQueryServiceApi.ExportChatBotsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      chatChatBotQueryServiceApi.ExportChatBotsResponse.fromPartial({ chatBot: { owner: reply2?.featureFlag?.owner } }),
      chatChatBotQueryServiceApi.ExportChatBotsResponse.fromPartial({
        chatBot: { owner: { userId: (reply3?.subscription?.owner?.userId ?? "") } },
      }),
    );
  }

  /**
   * Lists chat bots a page at a time.
   */
  async findChatBots(req: chatChatBotQueryServiceApi.FindChatBotsRequest): Promise<chatChatBotQueryServiceApi.FindChatBotsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindChatBots", req);
    this.logger.info("find_chat_bots", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = chatChatRoomCalculationServiceApi.EstimateChatRoomRequest.fromPartial({
      context: input1?.context,
      details: { destination: { region: (input1?.filter?.region ?? "") } },
    });
    const invoke1: Unary<chatChatRoomCalculationServiceApi.EstimateChatRoomRequest, chatChatRoomCalculationServiceApi.EstimateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.estimateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomCalculationServiceApi.EstimateChatRoomRequest, chatChatRoomCalculationServiceApi.EstimateChatRoomResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (reply1?.chatRoom?.locator?.$case) {
      case "address":
        selected2_1 = ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_2: string | undefined;
    switch (reply1?.chatRoom?.locator?.$case) {
      case "address":
        selected2_2 = ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: {
          etag: (reply1?.chatRoom?.audit?.etag ?? ""),
          updatedAt: reply1?.chatRoom?.audit?.updatedAt,
        },
        billingAddress: {
          countryCode: (selected2_2 ?? ""),
          postalCode: (selected2_1 ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateAdminClient.repairNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      chatChatBotQueryServiceApi.FindChatBotsResponse.fromPartial({
        chatBots: [{ audit: { updatedAt: reply1?.chatRoom?.audit?.updatedAt } }],
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      chatChatBotQueryServiceApi.FindChatBotsResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
    );
  }

  /**
   * Returns a chat bot.
   */
  async lookupChatBot(req: chatChatBotQueryServiceApi.LookupChatBotRequest): Promise<chatChatBotQueryServiceApi.LookupChatBotResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupChatBot", req);
    this.logger.info("lookup_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const decoded1 = notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest.toJSON(request1))),
    );
    const invoke1: Unary<notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest, notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.lintNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest, notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse>(invoke1, decoded1);
    const request2 = deliveriesDeliveryQueryServiceApi.ExportDeliveriesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.notificationTemplate?.audit?.updatedAt,
        ownerId: (reply1?.notificationTemplate?.counterparty?.notificationId ?? ""),
        region: (reply1?.notificationTemplate?.billingAddress?.region ?? ""),
      },
    });
    const stream2 = this.deliveriesDeliveryQueryClient.exportDeliveries(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? deliveriesDeliveryQueryServiceApi.ExportDeliveriesResponse.fromPartial({});
    return mergeResponses(
      chatChatBotQueryServiceApi.LookupChatBotResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      chatChatBotQueryServiceApi.LookupChatBotResponse.fromPartial({ chatBot: { chatBotId: (req?.chatBotId ?? "") } }),
    );
  }

  /**
   * Returns several chat bots at once.
   */
  async resolveChatBots(req: chatChatBotQueryServiceApi.ResolveChatBotsRequest): Promise<chatChatBotQueryServiceApi.ResolveChatBotsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveChatBots", req);
    this.logger.info("resolve_chat_bots", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityCalculationServiceApi.SimulateAffinityRequest.fromPartial({
      affinity: { measurements: [{ observedAt: req?.context?.deadline }] },
      context: req?.context,
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.SimulateAffinityRequest",
      value: Buffer.from(personalizationAffinityCalculationServiceApi.SimulateAffinityRequest.encode(request1).finish()),
    });
    const unpacked1 = personalizationAffinityCalculationServiceApi.SimulateAffinityRequest.decode(envelope1.value);
    const invoke1: Unary<personalizationAffinityCalculationServiceApi.SimulateAffinityRequest, personalizationAffinityCalculationServiceApi.SimulateAffinityResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.simulateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityCalculationServiceApi.SimulateAffinityRequest, personalizationAffinityCalculationServiceApi.SimulateAffinityResponse>(invoke1, unpacked1);
    return chatChatBotQueryServiceApi.ResolveChatBotsResponse.fromPartial({
      result: {
        correlationId: (reply1?.affinity?.correlationId ?? ""),
        referenceIds: (reply1?.result?.referenceIds ?? []),
      },
    });
  }

  /**
   * Summarizes a chat bot.
   */
  async summarizeChatBots(req: chatChatBotQueryServiceApi.SummarizeChatBotsRequest): Promise<chatChatBotQueryServiceApi.SummarizeChatBotsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeChatBots", req);
    this.logger.info("summarize_chat_bots", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const client1 = this.clients.get<admissionsAdmissionCalculationServiceApi.AdmissionCalculationServiceClient>("acme.admissions.v1.AdmissionCalculationService");
    const invoke1: Unary<admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest, admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationResponse> =
      (input, done) => client1.explainAdmissionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest, admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      chatChatBotQueryServiceApi.SummarizeChatBotsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      chatChatBotQueryServiceApi.SummarizeChatBotsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for ChatBotQueryService; workflows own validation and database transactions.
 */
@injectable()
export class ChatBotQueryHandler {
  constructor(@inject(ChatBotQueryWorkflow) private readonly workflow: ChatBotQueryWorkflow) {}

  /**
   * Lists chat bots a page at a time.
   */
  browseChatBots = unary<chatChatBotQueryServiceApi.BrowseChatBotsRequest, chatChatBotQueryServiceApi.BrowseChatBotsResponse>(
    (request) => this.workflow.browseChatBots(request),
  );

  /**
   * Counts chat bots by status.
   */
  countChatBots = unary<chatChatBotQueryServiceApi.CountChatBotsRequest, chatChatBotQueryServiceApi.CountChatBotsResponse>(
    (request) => this.workflow.countChatBots(request),
  );

  /**
   * Streams every matching chat bot.
   */
  exportChatBots = serverStream<chatChatBotQueryServiceApi.ExportChatBotsRequest, chatChatBotQueryServiceApi.ExportChatBotsResponse>(
    (request) => this.workflow.exportChatBots(request),
  );

  /**
   * Lists chat bots a page at a time.
   */
  findChatBots = unary<chatChatBotQueryServiceApi.FindChatBotsRequest, chatChatBotQueryServiceApi.FindChatBotsResponse>(
    (request) => this.workflow.findChatBots(request),
  );

  /**
   * Returns a chat bot.
   */
  lookupChatBot = unary<chatChatBotQueryServiceApi.LookupChatBotRequest, chatChatBotQueryServiceApi.LookupChatBotResponse>(
    (request) => this.workflow.lookupChatBot(request),
  );

  /**
   * Returns several chat bots at once.
   */
  resolveChatBots = (call: ServerUnaryCall<chatChatBotQueryServiceApi.ResolveChatBotsRequest, chatChatBotQueryServiceApi.ResolveChatBotsResponse>, done: sendUnaryData<chatChatBotQueryServiceApi.ResolveChatBotsResponse>): void => {
    void this.workflow.resolveChatBots(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Summarizes a chat bot.
   */
  summarizeChatBots = unary<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse>(
    (request) => this.workflow.summarizeChatBots(request),
  );
}

export function implementation(handler: ChatBotQueryHandler): chatChatBotQueryServiceApi.ChatBotQueryServiceServer {
  return {
    browseChatBots: handler.browseChatBots,
    countChatBots: handler.countChatBots,
    exportChatBots: handler.exportChatBots,
    findChatBots: handler.findChatBots,
    lookupChatBot: handler.lookupChatBot,
    resolveChatBots: handler.resolveChatBots,
    summarizeChatBots: handler.summarizeChatBots,
  };
}
