/**
 * Moves a handoff between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as chatChatBotReportingServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_reporting_service.js";
import * as chatChatRoomServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatHandoffLifecycleServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_lifecycle_service.js";
import * as chatHandoffReportingServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as chatHandoffSyncServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as chatHandoffValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_validation_service.js";
import * as complianceComplianceCaseCalculationServiceApi from "../../../../../.cache/proto/acme/compliance/v1/compliance_case_calculation_service.js";
import * as configurationConfigSetCalculationServiceApi from "../../../../../.cache/proto/acme/configuration/v1/config_set_calculation_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as personalizationRecommendationApprovalServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_approval_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toHandoffRecord } from "../../data/records.js";
import { ChatRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate handoff operations and persist audit data.
 */
@injectable()
export class HandoffLifecycleWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotReportingService") private readonly chatChatBotReportingClient: chatChatBotReportingServiceApi.ChatBotReportingServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffReportingService") private readonly chatHandoffReportingClient: chatHandoffReportingServiceApi.HandoffReportingServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.chat.v1.HandoffValidationService") private readonly chatHandoffValidationClient: chatHandoffValidationServiceApi.HandoffValidationServiceClient,
    @inject("grpc:acme.compliance.v1.ComplianceCaseCalculationService") private readonly complianceComplianceCaseCalculationClient: complianceComplianceCaseCalculationServiceApi.ComplianceCaseCalculationServiceClient,
    @inject("grpc:acme.configuration.v1.ConfigSetCalculationService") private readonly configurationConfigSetCalculationClient: configurationConfigSetCalculationServiceApi.ConfigSetCalculationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyApprovalService") private readonly localizationTranslationKeyApprovalClient: localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationApprovalService") private readonly personalizationRecommendationApprovalClient: personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a handoff.
   */
  async activateHandoff(req: chatHandoffLifecycleServiceApi.ActivateHandoffRequest): Promise<chatHandoffLifecycleServiceApi.ActivateHandoffResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateHandoff", req);
    this.logger.info("activate_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationApprovalServiceApi.RecallRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
      recommendation: {
        counterparty: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationRecommendationApprovalServiceApi.RecallRecommendationRequest, personalizationRecommendationApprovalServiceApi.RecallRecommendationResponse> =
      (input, done) => this.personalizationRecommendationApprovalClient.recallRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<personalizationRecommendationApprovalServiceApi.RecallRecommendationRequest, personalizationRecommendationApprovalServiceApi.RecallRecommendationResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffLifecycleServiceApi.ActivateHandoffResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      chatHandoffLifecycleServiceApi.ActivateHandoffResponse.fromPartial({
        handoff: { handoffId: (req?.handoffId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a handoff.
   */
  async expireHandoff(req: chatHandoffLifecycleServiceApi.ExpireHandoffRequest): Promise<chatHandoffLifecycleServiceApi.ExpireHandoffResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireHandoff", req);
    this.logger.info("expire_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleApprovalServiceApi.RejectLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
      locale: { owner: { email: (req?.details?.newOwner?.email ?? "") } },
    });
    const invoke1: Unary<localizationLocaleApprovalServiceApi.RejectLocaleRequest, localizationLocaleApprovalServiceApi.RejectLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient.rejectLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ExpireHandoff.RejectLocale", () => call<localizationLocaleApprovalServiceApi.RejectLocaleRequest, localizationLocaleApprovalServiceApi.RejectLocaleResponse>(invoke1, request1));
    const request2 = chatChatRoomValidationServiceApi.PreviewChatRoomRequest.fromPartial({
      chatRoom: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          userId: (reply1?.locale?.owner?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.previewChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
      translationKey: { audit: { createdBy: (reply2?.chatRoom?.audit?.createdBy ?? "") } },
    });
    const reply3 = await this.workQueue.enqueue<localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalRequest, localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse>(
      "acme.chat.v1.HandoffLifecycleService/ExpireHandoff:2", request3,
    );
    let selected4_1: string | undefined;
    switch (reply3?.translationKey?.locator?.$case) {
      case "address":
        selected4_1 = ((reply3?.translationKey?.locator?.$case === "address" ? reply3?.translationKey?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected4_1 = "";
    }
    let selected4_3: Array<string> | undefined;
    switch (reply2?.chatRoom?.locator?.$case) {
      case "address":
        selected4_3 = ((reply2?.chatRoom?.locator?.$case === "address" ? reply2?.chatRoom?.locator.address : undefined)?.lines ?? []);
        break;
      default:
        selected4_3 = [];
    }
    const request4 = configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest.fromPartial({
      configSet: {
        children: [{
          children: [{
            audit: { etag: (reply2?.chatRoom?.audit?.etag ?? "") },
            location: {
              lines: (selected4_3 ?? []),
              locality: (selected4_1 ?? ""),
            },
            manager: { userId: (reply1?.locale?.owner?.userId ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke4: Unary<configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest, configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationResponse> =
      (input, done) => this.configurationConfigSetCalculationClient.explainConfigSetCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest, configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffLifecycleServiceApi.ExpireHandoffResponse.fromPartial({ handoff: { audit: { createdAt: reply1?.locale?.audit?.createdAt } } }),
      chatHandoffLifecycleServiceApi.ExpireHandoffResponse.fromPartial({ handoff: { tags: (reply2?.chatRoom?.tags ?? []) } }),
      chatHandoffLifecycleServiceApi.ExpireHandoffResponse.fromPartial({
        handoff: {
          assignee: { displayName: (reply3?.translationKey?.owner?.displayName ?? "") },
        },
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
      }),
      chatHandoffLifecycleServiceApi.ExpireHandoffResponse.fromPartial({ handoff: { audit: { etag: (reply4?.configSet?.audit?.etag ?? "") } } }),
      chatHandoffLifecycleServiceApi.ExpireHandoffResponse.fromPartial({
        handoff: { handoffId: (req?.handoffId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a handoff.
   */
  async getHandoffLifecycle(req: chatHandoffLifecycleServiceApi.GetHandoffLifecycleRequest): Promise<chatHandoffLifecycleServiceApi.GetHandoffLifecycleResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetHandoffLifecycle", req);
    this.logger.info("get_handoff_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    return chatHandoffLifecycleServiceApi.GetHandoffLifecycleResponse.fromPartial({ handoff: { handoffId: (req?.handoffId ?? "") } });
  }

  /**
   * Reinstates a handoff.
   */
  async reinstateHandoff(req: chatHandoffLifecycleServiceApi.ReinstateHandoffRequest): Promise<chatHandoffLifecycleServiceApi.ReinstateHandoffResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateHandoff", req);
    this.logger.info("reinstate_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleApprovalServiceApi.EscalateLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
      locale: { owner: { email: (req?.details?.notifyContact?.email ?? "") } },
    });
    const invoke1: Unary<localizationLocaleApprovalServiceApi.EscalateLocaleRequest, localizationLocaleApprovalServiceApi.EscalateLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient.escalateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<localizationLocaleApprovalServiceApi.EscalateLocaleResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = chatHandoffReportingServiceApi.ScheduleHandoffReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { period: reply1?.locale?.effective },
      handoffId: (req?.handoffId ?? ""),
      reason: ((reply1?.locale?.action?.$case === "block" ? reply1?.locale?.action.block : undefined)?.reason ?? ""),
    });
    const invoke2: Unary<chatHandoffReportingServiceApi.ScheduleHandoffReportRequest, chatHandoffReportingServiceApi.ScheduleHandoffReportResponse> =
      (input, done) => this.chatHandoffReportingClient.scheduleHandoffReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = chatHandoffValidationServiceApi.CheckHandoffEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.notifyContact?.name } },
      handoff: {
        comments: [{ createdAt: reply1?.locale?.audit?.createdAt }],
        requester: { email: (req?.details?.newOwner?.email ?? "") },
      },
    });
    const invoke3: Unary<chatHandoffValidationServiceApi.CheckHandoffEligibilityRequest, chatHandoffValidationServiceApi.CheckHandoffEligibilityResponse> =
      (input, done) => this.chatHandoffValidationClient.checkHandoffEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = chatChatBotReportingServiceApi.ListChatBotReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.locale?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (reply1?.locale?.owner?.userId ?? ""),
      },
    });
    const method4 = "listChatBotReports" as const;
    const invoke4: Unary<chatChatBotReportingServiceApi.ListChatBotReportsRequest, chatChatBotReportingServiceApi.ListChatBotReportsResponse> =
      (input, done) => this.chatChatBotReportingClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatBotReportingServiceApi.ListChatBotReportsRequest, chatChatBotReportingServiceApi.ListChatBotReportsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffLifecycleServiceApi.ReinstateHandoffResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      chatHandoffLifecycleServiceApi.ReinstateHandoffResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      chatHandoffLifecycleServiceApi.ReinstateHandoffResponse.fromPartial({ handoff: { tags: (reply3?.handoff?.tags ?? []) } }),
      chatHandoffLifecycleServiceApi.ReinstateHandoffResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      chatHandoffLifecycleServiceApi.ReinstateHandoffResponse.fromPartial({
        handoff: { handoffId: (req?.handoffId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews a handoff.
   */
  async renewHandoff(req: chatHandoffLifecycleServiceApi.RenewHandoffRequest): Promise<chatHandoffLifecycleServiceApi.RenewHandoffResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewHandoff", req);
    this.logger.info("renew_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomServiceApi.CloneChatRoomRequest.fromPartial({
      chatRoom: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const proxy1 = forwarding(this.chatChatRoomClient);
    const invoke1: Unary<chatChatRoomServiceApi.CloneChatRoomRequest, chatChatRoomServiceApi.CloneChatRoomResponse> =
      (input, done) => proxy1.cloneChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomServiceApi.CloneChatRoomRequest, chatChatRoomServiceApi.CloneChatRoomResponse>(invoke1, request1);
    const request2 = chatHandoffSyncServiceApi.ReconcileHandoffsRequest.fromPartial({
      context: req?.context,
      handoff: {
        assignee: {
          displayName: (reply1?.chatRoom?.owner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
        },
        audit: { updatedBy: (reply1?.chatRoom?.audit?.updatedBy ?? "") },
        requester: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<chatHandoffSyncServiceApi.ReconcileHandoffsRequest, chatHandoffSyncServiceApi.ReconcileHandoffsResponse> =
      (input, done) => this.chatHandoffSyncClient.reconcileHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatHandoffSyncServiceApi.ReconcileHandoffsRequest, chatHandoffSyncServiceApi.ReconcileHandoffsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffLifecycleServiceApi.RenewHandoffResponse.fromPartial({
        handoff: { audit: { updatedBy: (reply1?.chatRoom?.audit?.updatedBy ?? "") } },
      }),
      chatHandoffLifecycleServiceApi.RenewHandoffResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      chatHandoffLifecycleServiceApi.RenewHandoffResponse.fromPartial({
        handoff: { handoffId: (req?.handoffId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules a handoff.
   */
  async scheduleHandoffExpiry(req: chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryRequest): Promise<chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "ScheduleHandoffExpiry", req);
    this.logger.info("schedule_handoff_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = complianceComplianceCaseCalculationServiceApi.QuoteComplianceCaseRequest.fromPartial({
      complianceCase: {
        origin: { $case: "channel", channel: {
          address: ((req?.handoff?.origin?.$case === "channel" ? req?.handoff?.origin.channel : undefined)?.address ?? ""),
        } },
        requester: { email: (req?.details?.notify?.email ?? "") },
      },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<complianceComplianceCaseCalculationServiceApi.QuoteComplianceCaseRequest, complianceComplianceCaseCalculationServiceApi.QuoteComplianceCaseResponse> =
      (input, done) => this.complianceComplianceCaseCalculationClient.quoteComplianceCase(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<complianceComplianceCaseCalculationServiceApi.QuoteComplianceCaseRequest, complianceComplianceCaseCalculationServiceApi.QuoteComplianceCaseResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = chatChatRoomServiceApi.ListChatRoomsRequest.fromPartial({
      context: input2?.context,
      filter: {
        createdAfter: input2?.handoff?.sla?.dueAt,
        labels: Object.fromEntries(Object.entries((input2?.details?.parameters ?? {}))),
        ownerId: (input2?.handoff?.sla?.policyId ?? ""),
      },
    });
    const invoke2: Unary<chatChatRoomServiceApi.ListChatRoomsRequest, chatChatRoomServiceApi.ListChatRoomsResponse> =
      (input, done) => this.chatChatRoomClient.listChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomServiceApi.ListChatRoomsRequest, chatChatRoomServiceApi.ListChatRoomsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryResponse.fromPartial({
        handoff: {
          assignee: { email: (reply1?.complianceCase?.assignee?.email ?? "") },
          audit: { updatedAt: reply1?.complianceCase?.audit?.updatedAt },
        },
      }),
      chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          priority: (req?.handoff?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Suspends a handoff.
   */
  async suspendHandoff(req: chatHandoffLifecycleServiceApi.SuspendHandoffRequest): Promise<chatHandoffLifecycleServiceApi.SuspendHandoffResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendHandoff", req);
    this.logger.info("suspend_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
    });
    const cloned1: notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.reconcileDeliveryAttempts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffLifecycleServiceApi.SuspendHandoffResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      chatHandoffLifecycleServiceApi.SuspendHandoffResponse.fromPartial({
        handoff: { handoffId: (req?.handoffId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}
