/**
 * Runs the long-lived workflow that takes a handoff from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventQueryServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_query_service.js";
import * as authorizationAccessPolicyServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as chatChatBotCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatRoomApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import * as chatHandoffApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import * as chatHandoffLifecycleServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_lifecycle_service.js";
import * as chatHandoffSyncServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as chatHandoffWorkflowServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_workflow_service.js";
import * as experimentsVariantWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_workflow_service.js";
import * as insurancePolicyCalculationServiceApi from "../../../../.cache/proto/acme/insurance/v1/policy_calculation_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as schedulingShiftQueryServiceApi from "../../../../.cache/proto/acme/scheduling/v1/shift_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
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
import { upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toHandoffRecord } from "../data/records.js";
import { ChatRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate handoff operations and persist audit data.
 */
@injectable()
export class HandoffWorkflowWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventQueryService") private readonly auditAuditEventQueryClient: auditAuditEventQueryServiceApi.AuditEventQueryServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomApprovalService") private readonly chatChatRoomApprovalClient: chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient,
    @inject("grpc:acme.chat.v1.HandoffApprovalService") private readonly chatHandoffApprovalClient: chatHandoffApprovalServiceApi.HandoffApprovalServiceClient,
    @inject("grpc:acme.chat.v1.HandoffLifecycleService") private readonly chatHandoffLifecycleClient: chatHandoffLifecycleServiceApi.HandoffLifecycleServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.experiments.v1.VariantWorkflowService") private readonly experimentsVariantWorkflowClient: experimentsVariantWorkflowServiceApi.VariantWorkflowServiceClient,
    @inject("grpc:acme.insurance.v1.PolicyCalculationService") private readonly insurancePolicyCalculationClient: insurancePolicyCalculationServiceApi.PolicyCalculationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobReportingService") private readonly localizationTranslationJobReportingClient: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.scheduling.v1.ShiftQueryService") private readonly schedulingShiftQueryClient: schedulingShiftQueryServiceApi.ShiftQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a handoff.
   */
  async advanceHandoffWorkflow(req: chatHandoffWorkflowServiceApi.AdvanceHandoffWorkflowRequest): Promise<chatHandoffWorkflowServiceApi.AdvanceHandoffWorkflowResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "AdvanceHandoffWorkflow", req);
    this.logger.info("advance_handoff_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.handoff?.audit?.createdAt },
    });
    const invoke1: Unary<localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsRequest, localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsResponse> =
      (input, done) => this.localizationTranslationJobReportingClient.countTranslationJobTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("AdvanceHandoffWorkflow.CountTranslationJobTotals", () => call<localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsRequest, localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsResponse>(invoke1, request1));
    const request2 = experimentsVariantWorkflowServiceApi.SignalVariantWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.handoff?.requester?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
      variant: { audit: { etag: (req?.handoff?.audit?.etag ?? "") } },
    });
    const invoke2: Unary<experimentsVariantWorkflowServiceApi.SignalVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.SignalVariantWorkflowResponse> =
      (input, done) => this.experimentsVariantWorkflowClient.signalVariantWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = chatHandoffApprovalServiceApi.ListPendingHandoffsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.variant?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (req?.handoff?.handoffId ?? ""),
      },
    });
    const reply3 = await this.workQueue.enqueue<chatHandoffApprovalServiceApi.ListPendingHandoffsRequest, chatHandoffApprovalServiceApi.ListPendingHandoffsResponse>(
      "acme.chat.v1.HandoffWorkflowService/AdvanceHandoffWorkflow:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffWorkflowServiceApi.AdvanceHandoffWorkflowResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      chatHandoffWorkflowServiceApi.AdvanceHandoffWorkflowResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      chatHandoffWorkflowServiceApi.AdvanceHandoffWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          message: (reply3?.result?.message ?? ""),
        },
      }),
      chatHandoffWorkflowServiceApi.AdvanceHandoffWorkflowResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          subject: (req?.handoff?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a handoff.
   */
  async cancelHandoffWorkflow(req: chatHandoffWorkflowServiceApi.CancelHandoffWorkflowRequest): Promise<chatHandoffWorkflowServiceApi.CancelHandoffWorkflowResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "CancelHandoffWorkflow", req);
    this.logger.info("cancel_handoff_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_4: string | undefined;
    switch (req?.handoff?.origin?.$case) {
      case "customer":
        selected1_4 = ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.chatRoomId ?? "");
        break;
      default:
        selected1_4 = "";
    }
    const request1 = chatChatRoomApprovalServiceApi.SubmitChatRoomRequest.fromPartial({
      chatRoom: {
        audit: { createdAt: req?.handoff?.audit?.createdAt },
        chatRoomId: (selected1_4 ?? ""),
        owner: { email: (req?.handoff?.assignee?.email ?? "") },
      },
      context: req?.context,
      details: { approver: { email: (req?.handoff?.requester?.email ?? "") } },
    });
    const invoke1: Unary<chatChatRoomApprovalServiceApi.SubmitChatRoomRequest, chatChatRoomApprovalServiceApi.SubmitChatRoomResponse> =
      (input, done) => this.chatChatRoomApprovalClient.submitChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomApprovalServiceApi.SubmitChatRoomRequest, chatChatRoomApprovalServiceApi.SubmitChatRoomResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffWorkflowServiceApi.CancelHandoffWorkflowResponse.fromPartial({
        handoff: { requester: { email: (reply1?.chatRoom?.owner?.email ?? "") } },
      }),
      chatHandoffWorkflowServiceApi.CancelHandoffWorkflowResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          status: req?.handoff?.status,
        },
      }),
    );
  }

  /**
   * Returns a handoff.
   */
  async inspectHandoffWorkflow(req: chatHandoffWorkflowServiceApi.InspectHandoffWorkflowRequest): Promise<chatHandoffWorkflowServiceApi.InspectHandoffWorkflowResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectHandoffWorkflow", req);
    this.logger.info("inspect_handoff_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.handoffId ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.findNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return mergeResponses(
      chatHandoffWorkflowServiceApi.InspectHandoffWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      chatHandoffWorkflowServiceApi.InspectHandoffWorkflowResponse.fromPartial({ handoff: { handoffId: (req?.handoffId ?? "") } }),
    );
  }

  /**
   * Lists handoffs a page at a time.
   */
  async listHandoffWorkflows(req: chatHandoffWorkflowServiceApi.ListHandoffWorkflowsRequest): Promise<chatHandoffWorkflowServiceApi.ListHandoffWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListHandoffWorkflows", req);
    this.logger.info("list_handoff_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: {
        recipient: { email: (req?.context?.actor?.email ?? "") },
        variables: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse> =
      (input, done) => this.notificationsDeliveryAttemptExportClient.shareDeliveryAttemptExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatHandoffWorkflowServiceApi.ListHandoffWorkflowsResponse.fromPartial({
      handoffs: [{
        assignee: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
      }],
      result: { status: (reply1?.result?.status ?? "") },
    });
  }

  /**
   * Pauses a handoff.
   */
  async pauseHandoffWorkflow(req: chatHandoffWorkflowServiceApi.PauseHandoffWorkflowRequest): Promise<chatHandoffWorkflowServiceApi.PauseHandoffWorkflowResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "PauseHandoffWorkflow", req);
    this.logger.info("pause_handoff_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.RecalculateChatBotsRequest.fromPartial({
      chatBot: {
        audit: {
          etag: (req?.handoff?.audit?.etag ?? ""),
          updatedAt: req?.handoff?.audit?.updatedAt,
        },
        owner: { email: (req?.details?.notify?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<chatChatBotCalculationServiceApi.RecalculateChatBotsRequest, chatChatBotCalculationServiceApi.RecalculateChatBotsResponse> =
      (input, done) => this.chatChatBotCalculationClient.recalculateChatBots(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = chatHandoffLifecycleServiceApi.GetHandoffLifecycleRequest.fromPartial({
      context: req?.context,
      handoffId: (req?.handoff?.handoffId ?? ""),
    });
    const method2 = "getHandoffLifecycle" as const;
    const invoke2: Unary<chatHandoffLifecycleServiceApi.GetHandoffLifecycleRequest, chatHandoffLifecycleServiceApi.GetHandoffLifecycleResponse> =
      (input, done) => this.chatHandoffLifecycleClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatHandoffLifecycleServiceApi.GetHandoffLifecycleRequest, chatHandoffLifecycleServiceApi.GetHandoffLifecycleResponse>(invoke2, request2);
    const request3 = chatHandoffApprovalServiceApi.SubmitHandoffRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (reply1?.chatBot?.owner?.displayName ?? "") },
      },
      handoff: {
        origin: { $case: "channel", channel: {
          channel: ((req?.handoff?.origin?.$case === "channel" ? req?.handoff?.origin.channel : undefined)?.channel ?? ""),
        } },
      },
    });
    const proxy3 = forwarding(this.chatHandoffApprovalClient);
    const invoke3: Unary<chatHandoffApprovalServiceApi.SubmitHandoffRequest, chatHandoffApprovalServiceApi.SubmitHandoffResponse> =
      (input, done) => proxy3.submitHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatHandoffApprovalServiceApi.SubmitHandoffRequest, chatHandoffApprovalServiceApi.SubmitHandoffResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffWorkflowServiceApi.PauseHandoffWorkflowResponse.fromPartial({
        handoff: {
          assignee: { displayName: (reply1?.chatBot?.owner?.displayName ?? "") },
          audit: { etag: (reply1?.chatBot?.audit?.etag ?? "") },
        },
      }),
      chatHandoffWorkflowServiceApi.PauseHandoffWorkflowResponse.fromPartial({ handoff: { assignee: reply2?.handoff?.assignee } }),
      chatHandoffWorkflowServiceApi.PauseHandoffWorkflowResponse.fromPartial({
        handoff: {
          assignee: {
            displayName: ((reply3?.handoff?.origin?.$case === "customer" ? reply3?.handoff?.origin.customer : undefined)?.displayName ?? ""),
          },
          requester: { email: (reply3?.handoff?.requester?.email ?? "") },
        },
      }),
      chatHandoffWorkflowServiceApi.PauseHandoffWorkflowResponse.fromPartial({
        handoff: {
          customFields: (req?.handoff?.customFields ?? {}),
          handoffId: (req?.handoffId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a handoff.
   */
  async resumeHandoffWorkflow(req: chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowRequest): Promise<chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "ResumeHandoffWorkflow", req);
    this.logger.info("resume_handoff_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_3: string | undefined;
    switch (req?.handoff?.origin?.$case) {
      case "customer":
        selected1_3 = ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = chatHandoffSyncServiceApi.PushHandoffRequest.fromPartial({
      context: req?.context,
      handoff: {
        origin: { $case: "customer", customer: { displayName: (selected1_3 ?? "") } },
        requester: {
          email: (req?.handoff?.assignee?.email ?? ""),
          preferredChannel: (req?.handoff?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<chatHandoffSyncServiceApi.PushHandoffRequest, chatHandoffSyncServiceApi.PushHandoffResponse> =
      (input, done) => this.chatHandoffSyncClient.pushHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffSyncServiceApi.PushHandoffRequest, chatHandoffSyncServiceApi.PushHandoffResponse>(invoke1, request1);
    const request2 = chatHandoffSyncServiceApi.PullHandoffsRequest.fromPartial({
      context: req?.context,
      handoff: {
        assignee: {
          email: (req?.handoff?.requester?.email ?? ""),
          userId: (req?.handoff?.assignee?.userId ?? ""),
        },
        origin: { $case: "customer", customer: {
          displayName: ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.displayName ?? ""),
        } },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<chatHandoffSyncServiceApi.PullHandoffsRequest, chatHandoffSyncServiceApi.PullHandoffsResponse> =
      (input, done) => this.chatHandoffSyncClient.pullHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatHandoffSyncServiceApi.PullHandoffsRequest, chatHandoffSyncServiceApi.PullHandoffsResponse>(invoke2, spread2);
    const request3 = personalizationAffinityImportServiceApi.ImportAffinitiesRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.details?.notify,
      } },
    });
    const reply3 = await upload<personalizationAffinityImportServiceApi.ImportAffinitiesRequest, personalizationAffinityImportServiceApi.ImportAffinitiesResponse>(
      (done) => this.personalizationAffinityImportClient.importAffinities(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowResponse.fromPartial({
        handoff: { sla: { breached: (reply1?.handoff?.sla?.breached ?? false) } },
      }),
      chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowResponse.fromPartial({
        handoff: { requester: { phone: (reply2?.handoff?.requester?.phone ?? "") } },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      chatHandoffWorkflowServiceApi.ResumeHandoffWorkflowResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          priority: (req?.handoff?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Retrys a handoff.
   */
  async retryHandoffWorkflow(req: chatHandoffWorkflowServiceApi.RetryHandoffWorkflowRequest): Promise<chatHandoffWorkflowServiceApi.RetryHandoffWorkflowResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "RetryHandoffWorkflow", req);
    this.logger.info("retry_handoff_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = schedulingShiftQueryServiceApi.SummarizeShiftsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input1?.annotations ?? {}))),
      context: input1?.context,
      reason: (input1?.reason ?? ""),
    });
    const invoke1: Unary<schedulingShiftQueryServiceApi.SummarizeShiftsRequest, schedulingShiftQueryServiceApi.SummarizeShiftsResponse> =
      (input, done) => this.schedulingShiftQueryClient.summarizeShifts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<schedulingShiftQueryServiceApi.SummarizeShiftsRequest, schedulingShiftQueryServiceApi.SummarizeShiftsResponse>(invoke1, request1);
    const request2 = localizationLocaleApprovalServiceApi.EscalateLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.handoff?.assignee?.displayName ?? ""),
          email: (req?.handoff?.requester?.email ?? ""),
        },
      },
      locale: { owner: { userId: (req?.handoff?.assignee?.userId ?? "") } },
    });
    const cloned2: localizationLocaleApprovalServiceApi.EscalateLocaleRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<localizationLocaleApprovalServiceApi.EscalateLocaleRequest, localizationLocaleApprovalServiceApi.EscalateLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient.escalateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleApprovalServiceApi.EscalateLocaleRequest, localizationLocaleApprovalServiceApi.EscalateLocaleResponse>(invoke2, cloned2);
    const request3 = chatHandoffLifecycleServiceApi.ReinstateHandoffRequest.fromPartial({
      context: req?.context,
      details: {
        notifyContact: {
          name: req?.handoff?.requester?.name,
          preferredChannel: (req?.handoff?.requester?.preferredChannel ?? ""),
        },
      },
      handoffId: (req?.handoffId ?? ""),
    });
    const decoded3 = chatHandoffLifecycleServiceApi.ReinstateHandoffRequest.fromJSON(
      JSON.parse(JSON.stringify(chatHandoffLifecycleServiceApi.ReinstateHandoffRequest.toJSON(request3))),
    );
    const invoke3: Unary<chatHandoffLifecycleServiceApi.ReinstateHandoffRequest, chatHandoffLifecycleServiceApi.ReinstateHandoffResponse> =
      (input, done) => this.chatHandoffLifecycleClient.reinstateHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatHandoffLifecycleServiceApi.ReinstateHandoffRequest, chatHandoffLifecycleServiceApi.ReinstateHandoffResponse>(invoke3, decoded3);
    const request4 = auditAuditEventQueryServiceApi.BrowseAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.handoff?.audit?.updatedAt },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.audit.v1.BrowseAuditEventsRequest",
      value: Buffer.from(auditAuditEventQueryServiceApi.BrowseAuditEventsRequest.encode(request4).finish()),
    });
    const unpacked4 = auditAuditEventQueryServiceApi.BrowseAuditEventsRequest.decode(envelope4.value);
    const invoke4: Unary<auditAuditEventQueryServiceApi.BrowseAuditEventsRequest, auditAuditEventQueryServiceApi.BrowseAuditEventsResponse> =
      (input, done) => this.auditAuditEventQueryClient.browseAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<auditAuditEventQueryServiceApi.BrowseAuditEventsRequest, auditAuditEventQueryServiceApi.BrowseAuditEventsResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      chatHandoffWorkflowServiceApi.RetryHandoffWorkflowResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      chatHandoffWorkflowServiceApi.RetryHandoffWorkflowResponse.fromPartial({
        handoff: { audit: { createdBy: (reply2?.locale?.audit?.createdBy ?? "") } },
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
      }),
      chatHandoffWorkflowServiceApi.RetryHandoffWorkflowResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      chatHandoffWorkflowServiceApi.RetryHandoffWorkflowResponse.fromPartial({
        outcome: { message: (reply4?.result?.message ?? "") },
        result: { referenceIds: (reply4?.result?.referenceIds ?? []) },
      }),
      chatHandoffWorkflowServiceApi.RetryHandoffWorkflowResponse.fromPartial({
        handoff: {
          customFields: (req?.handoff?.customFields ?? {}),
          handoffId: (req?.handoffId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a handoff.
   */
  async signalHandoffWorkflow(req: chatHandoffWorkflowServiceApi.SignalHandoffWorkflowRequest): Promise<chatHandoffWorkflowServiceApi.SignalHandoffWorkflowResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "SignalHandoffWorkflow", req);
    this.logger.info("signal_handoff_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventQueryServiceApi.BrowseAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.handoff?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.handoff?.customFields ?? {}))),
      },
    });
    const client1 = this.clients.get<auditAuditEventQueryServiceApi.AuditEventQueryServiceClient>("acme.audit.v1.AuditEventQueryService");
    const invoke1: Unary<auditAuditEventQueryServiceApi.BrowseAuditEventsRequest, auditAuditEventQueryServiceApi.BrowseAuditEventsResponse> =
      (input, done) => client1.browseAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventQueryServiceApi.BrowseAuditEventsRequest, auditAuditEventQueryServiceApi.BrowseAuditEventsResponse>(invoke1, request1);
    const request2 = insurancePolicyCalculationServiceApi.CalculatePolicyRequest.fromPartial({
      context: req?.context,
      policy: {
        audit: {
          createdAt: req?.handoff?.audit?.createdAt,
          updatedBy: (req?.handoff?.audit?.updatedBy ?? ""),
        },
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          preferredChannel: (req?.handoff?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<insurancePolicyCalculationServiceApi.CalculatePolicyRequest, insurancePolicyCalculationServiceApi.CalculatePolicyResponse> =
      (input, done) => this.insurancePolicyCalculationClient.calculatePolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<insurancePolicyCalculationServiceApi.CalculatePolicyRequest, insurancePolicyCalculationServiceApi.CalculatePolicyResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = authorizationAccessPolicyServiceApi.CreateAccessPolicyRequest.fromPartial({
      accessPolicy: {
        audit: { createdBy: (req?.handoff?.audit?.createdBy ?? "") },
        owner: { displayName: (req?.handoff?.assignee?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke3: Unary<authorizationAccessPolicyServiceApi.CreateAccessPolicyRequest, authorizationAccessPolicyServiceApi.CreateAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyClient.createAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<authorizationAccessPolicyServiceApi.CreateAccessPolicyRequest, authorizationAccessPolicyServiceApi.CreateAccessPolicyResponse>(invoke3, request3));
    const request4 = chatChatRoomApprovalServiceApi.RejectChatRoomRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (reply3?.accessPolicy?.owner?.email ?? "") } },
    });
    const invoke4: Unary<chatChatRoomApprovalServiceApi.RejectChatRoomRequest, chatChatRoomApprovalServiceApi.RejectChatRoomResponse> =
      (input, done) => this.chatChatRoomApprovalClient.rejectChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("SignalHandoffWorkflow.RejectChatRoom", () => call<chatChatRoomApprovalServiceApi.RejectChatRoomRequest, chatChatRoomApprovalServiceApi.RejectChatRoomResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffWorkflowServiceApi.SignalHandoffWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      chatHandoffWorkflowServiceApi.SignalHandoffWorkflowResponse.fromPartial({
        handoff: {
          audit: { updatedBy: (reply2?.policy?.audit?.updatedBy ?? "") },
          requester: { phone: (reply2?.policy?.contact?.phone ?? "") },
        },
      }),
      chatHandoffWorkflowServiceApi.SignalHandoffWorkflowResponse.fromPartial({
        handoff: {
          assignee: { displayName: (reply3?.accessPolicy?.owner?.displayName ?? "") },
          comments: [{ createdAt: reply3?.accessPolicy?.audit?.createdAt }],
        },
      }),
      chatHandoffWorkflowServiceApi.SignalHandoffWorkflowResponse.fromPartial({
        handoff: { audit: { createdAt: reply4?.chatRoom?.audit?.createdAt } },
        outcome: { status: (reply4?.result?.status ?? "") },
      }),
      chatHandoffWorkflowServiceApi.SignalHandoffWorkflowResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          subject: (req?.handoff?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a handoff.
   */
  async startHandoffWorkflow(req: chatHandoffWorkflowServiceApi.StartHandoffWorkflowRequest): Promise<chatHandoffWorkflowServiceApi.StartHandoffWorkflowResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "StartHandoffWorkflow", req);
    this.logger.info("start_handoff_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobReportingServiceApi.ShareTranslationJobReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: { preferredChannel: (req?.handoff?.requester?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<localizationTranslationJobReportingServiceApi.ShareTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ShareTranslationJobReportResponse> =
      (input, done) => this.localizationTranslationJobReportingClient.shareTranslationJobReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = chatHandoffLifecycleServiceApi.ExpireHandoffRequest.fromPartial({
      context: req?.context,
      details: { newOwner: { email: (req?.handoff?.requester?.email ?? "") } },
      handoffId: (req?.handoff?.handoffId ?? ""),
    });
    const reply2 = await this.workQueue.enqueue<chatHandoffLifecycleServiceApi.ExpireHandoffRequest, chatHandoffLifecycleServiceApi.ExpireHandoffResponse>(
      "acme.chat.v1.HandoffWorkflowService/StartHandoffWorkflow:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffWorkflowServiceApi.StartHandoffWorkflowResponse.fromPartial({
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      chatHandoffWorkflowServiceApi.StartHandoffWorkflowResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      chatHandoffWorkflowServiceApi.StartHandoffWorkflowResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          requester: req?.handoff?.requester,
        },
      }),
    );
  }
}
