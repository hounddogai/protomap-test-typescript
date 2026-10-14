/**
 * Builds and schedules reports about handoffs. Remote work stays behind typed client ports.
 */

import * as admissionsAdmissionCalculationServiceApi from "../../../../.cache/proto/acme/admissions/v1/admission_calculation_service.js";
import * as chatChatBotValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as chatChatRoomServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as chatHandoffCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as chatHandoffReportingServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as chatHandoffSyncServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as experimentsExposureImportServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as licensingSoftwareLicenseQueryServiceApi from "../../../../.cache/proto/acme/licensing/v1/software_license_query_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { ChatRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate handoff operations and persist audit data.
 */
@injectable()
export class HandoffReportingWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.admissions.v1.AdmissionCalculationService") private readonly admissionsAdmissionCalculationClient: admissionsAdmissionCalculationServiceApi.AdmissionCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotValidationService") private readonly chatChatBotValidationClient: chatChatBotValidationServiceApi.ChatBotValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.chat.v1.HandoffCalculationService") private readonly chatHandoffCalculationClient: chatHandoffCalculationServiceApi.HandoffCalculationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.licensing.v1.SoftwareLicenseQueryService") private readonly licensingSoftwareLicenseQueryClient: licensingSoftwareLicenseQueryServiceApi.SoftwareLicenseQueryServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts handoffs by status.
   */
  async countHandoffTotals(req: chatHandoffReportingServiceApi.CountHandoffTotalsRequest): Promise<chatHandoffReportingServiceApi.CountHandoffTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountHandoffTotals", req);
    this.logger.info("count_handoff_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatHandoffReportingServiceApi.CountHandoffTotalsResponse.fromPartial({});
  }

  /**
   * Returns a handoff.
   */
  async fetchHandoffReport(req: chatHandoffReportingServiceApi.FetchHandoffReportRequest): Promise<chatHandoffReportingServiceApi.FetchHandoffReportResponse> {
    validateContext(req.context);
    if (!req.handoffId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "handoff_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchHandoffReport", req);
    this.logger.info("fetch_handoff_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const decoded1 = admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest.fromJSON(
      JSON.parse(JSON.stringify(admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest.toJSON(request1))),
    );
    const invoke1: Unary<admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest, admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationResponse> =
      (input, done) => this.admissionsAdmissionCalculationClient.explainAdmissionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest, admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationResponse>(invoke1, decoded1);
    const request2 = chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest.fromPartial({
      chatRoom: {
        owner: { displayName: (reply1?.admission?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.ExplainChatRoomCalculationRequest",
      value: Buffer.from(chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest.encode(request2).finish()),
    });
    const unpacked2 = chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest.decode(envelope2.value);
    const invoke2: Unary<chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest, chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationResponse> =
      (input, done) => this.chatChatRoomCalculationClient.explainChatRoomCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest, chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationResponse>(invoke2, unpacked2);
    return mergeResponses(
      chatHandoffReportingServiceApi.FetchHandoffReportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      chatHandoffReportingServiceApi.FetchHandoffReportResponse.fromPartial({
        handoff: { assignee: { userId: (reply2?.chatRoom?.owner?.userId ?? "") } },
      }),
      chatHandoffReportingServiceApi.FetchHandoffReportResponse.fromPartial({ handoff: { handoffId: (req?.handoffId ?? "") } }),
    );
  }

  /**
   * Generates a handoff.
   */
  async generateHandoffReport(req: chatHandoffReportingServiceApi.GenerateHandoffReportRequest): Promise<chatHandoffReportingServiceApi.GenerateHandoffReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateHandoffReport", req);
    this.logger.info("generate_handoff_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffSyncServiceApi.PushHandoffRequest.fromPartial({
      context: req?.context,
      handoff: { requester: { email: (req?.context?.actor?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const client1 = this.clients.get<chatHandoffSyncServiceApi.HandoffSyncServiceClient>("acme.chat.v1.HandoffSyncService");
    const invoke1: Unary<chatHandoffSyncServiceApi.PushHandoffRequest, chatHandoffSyncServiceApi.PushHandoffResponse> =
      (input, done) => client1.pushHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffSyncServiceApi.PushHandoffRequest, chatHandoffSyncServiceApi.PushHandoffResponse>(invoke1, request1);
    const request2 = localizationLocaleApprovalServiceApi.DelegateLocaleApprovalRequest.fromPartial({
      context: req?.context,
      locale: {
        audit: { createdAt: reply1?.handoff?.audit?.createdAt },
        owner: { displayName: (reply1?.handoff?.assignee?.displayName ?? "") },
      },
    });
    const invoke2: Unary<localizationLocaleApprovalServiceApi.DelegateLocaleApprovalRequest, localizationLocaleApprovalServiceApi.DelegateLocaleApprovalResponse> =
      (input, done) => this.localizationLocaleApprovalClient.delegateLocaleApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<localizationLocaleApprovalServiceApi.DelegateLocaleApprovalRequest, localizationLocaleApprovalServiceApi.DelegateLocaleApprovalResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = chatChatBotValidationServiceApi.ExplainChatBotDecisionRequest.fromPartial({
      chatBot: {
        audit: {
          createdAt: reply2?.locale?.audit?.createdAt,
          updatedAt: reply2?.locale?.audit?.updatedAt,
        },
        owner: { email: (reply2?.locale?.owner?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke3: Unary<chatChatBotValidationServiceApi.ExplainChatBotDecisionRequest, chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse> =
      (input, done) => this.chatChatBotValidationClient.explainChatBotDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<chatChatBotValidationServiceApi.ExplainChatBotDecisionRequest, chatChatBotValidationServiceApi.ExplainChatBotDecisionResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      chatHandoffReportingServiceApi.GenerateHandoffReportResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      chatHandoffReportingServiceApi.GenerateHandoffReportResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      chatHandoffReportingServiceApi.GenerateHandoffReportResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      chatHandoffReportingServiceApi.GenerateHandoffReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists handoffs a page at a time.
   */
  async listHandoffReports(req: chatHandoffReportingServiceApi.ListHandoffReportsRequest): Promise<chatHandoffReportingServiceApi.ListHandoffReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListHandoffReports", req);
    this.logger.info("list_handoff_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotValidationServiceApi.ValidateChatBotRequest.fromPartial({
      chatBot: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const invoke1: Unary<chatChatBotValidationServiceApi.ValidateChatBotRequest, chatChatBotValidationServiceApi.ValidateChatBotResponse> =
      (input, done) => this.chatChatBotValidationClient.validateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ListHandoffReports.ValidateChatBot", () => call<chatChatBotValidationServiceApi.ValidateChatBotRequest, chatChatBotValidationServiceApi.ValidateChatBotResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatHandoffReportingServiceApi.ListHandoffReportsResponse.fromPartial({
      handoffs: [{
        assignee: { displayName: (reply1?.chatBot?.owner?.displayName ?? "") },
        audit: { updatedAt: reply1?.chatBot?.audit?.updatedAt },
      }],
    });
  }

  /**
   * Schedules a handoff.
   */
  async scheduleHandoffReport(req: chatHandoffReportingServiceApi.ScheduleHandoffReportRequest): Promise<chatHandoffReportingServiceApi.ScheduleHandoffReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleHandoffReport", req);
    this.logger.info("schedule_handoff_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserQueryServiceApi.CountUsersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.handoffId ?? ""),
      },
    });
    const invoke1: Unary<identityUserQueryServiceApi.CountUsersRequest, identityUserQueryServiceApi.CountUsersResponse> =
      (input, done) => this.identityUserQueryClient.countUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = experimentsExposureImportServiceApi.RetryExposureImportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
      exposure: { correlationId: (reply1?.result?.correlationId ?? "") },
    });
    const reply2 = await this.workQueue.enqueue<experimentsExposureImportServiceApi.RetryExposureImportRequest, experimentsExposureImportServiceApi.RetryExposureImportResponse>(
      "acme.chat.v1.HandoffReportingService/ScheduleHandoffReport:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffReportingServiceApi.ScheduleHandoffReportResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      chatHandoffReportingServiceApi.ScheduleHandoffReportResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      chatHandoffReportingServiceApi.ScheduleHandoffReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares a handoff.
   */
  async shareHandoffReport(req: chatHandoffReportingServiceApi.ShareHandoffReportRequest): Promise<chatHandoffReportingServiceApi.ShareHandoffReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareHandoffReport", req);
    this.logger.info("share_handoff_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureSyncServiceApi.PushExposureRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<experimentsExposureSyncServiceApi.PushExposureRequest, experimentsExposureSyncServiceApi.PushExposureResponse> =
      (input, done) => this.experimentsExposureSyncClient.pushExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<experimentsExposureSyncServiceApi.PushExposureRequest, experimentsExposureSyncServiceApi.PushExposureResponse>(invoke1, request1));
    const request2 = licensingSoftwareLicenseQueryServiceApi.ExportSoftwareLicensesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.exposure?.subject?.startsAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.exposure?.exposureId ?? ""),
      },
    });
    const stream2 = this.licensingSoftwareLicenseQueryClient.exportSoftwareLicenses(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? licensingSoftwareLicenseQueryServiceApi.ExportSoftwareLicensesResponse.fromPartial({});
    const request3 = searchSearchIndexQueryServiceApi.FindSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.outcome?.effectiveAt,
        ownerId: (reply1?.outcome?.referenceId ?? ""),
      },
    });
    const invoke3: Unary<searchSearchIndexQueryServiceApi.FindSearchIndexesRequest, searchSearchIndexQueryServiceApi.FindSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.findSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<searchSearchIndexQueryServiceApi.FindSearchIndexesResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = chatChatRoomServiceApi.ListChatRoomsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.exposure?.occurredAt,
        labels: Object.fromEntries(Object.entries((reply1?.exposure?.attributes ?? {}))),
        ownerId: (reply1?.exposure?.subject?.experimentId ?? ""),
      },
    });
    const invoke4: Unary<chatChatRoomServiceApi.ListChatRoomsRequest, chatChatRoomServiceApi.ListChatRoomsResponse> =
      (input, done) => this.chatChatRoomClient.listChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      chatHandoffReportingServiceApi.ShareHandoffReportResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        result: { correlationId: (reply1?.exposure?.correlationId ?? "") },
      }),
      chatHandoffReportingServiceApi.ShareHandoffReportResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      chatHandoffReportingServiceApi.ShareHandoffReportResponse.fromPartial({ result: { correlationId: (reply4?.result?.correlationId ?? "") } }),
      chatHandoffReportingServiceApi.ShareHandoffReportResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          requester: { name: req?.details?.recipient?.name },
        },
      }),
    );
  }

  /**
   * Streams the changes of handoffs as they happen.
   */
  async streamHandoffMetrics(req: chatHandoffReportingServiceApi.StreamHandoffMetricsRequest): Promise<chatHandoffReportingServiceApi.StreamHandoffMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamHandoffMetrics", req);
    this.logger.info("stream_handoff_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffCalculationServiceApi.SimulateHandoffRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      handoff: { requester: { email: (req?.subscriber?.email ?? "") } },
    });
    const invoke1: Unary<chatHandoffCalculationServiceApi.SimulateHandoffRequest, chatHandoffCalculationServiceApi.SimulateHandoffResponse> =
      (input, done) => this.chatHandoffCalculationClient.simulateHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = notificationsNotificationServiceApi.CloneNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { email: (reply1?.handoff?.assignee?.email ?? "") },
        audit: { updatedAt: reply1?.handoff?.audit?.updatedAt },
      },
    });
    const method2 = "cloneNotification" as const;
    const invoke2: Unary<notificationsNotificationServiceApi.CloneNotificationRequest, notificationsNotificationServiceApi.CloneNotificationResponse> =
      (input, done) => this.notificationsNotificationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationServiceApi.CloneNotificationRequest, notificationsNotificationServiceApi.CloneNotificationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      chatHandoffReportingServiceApi.StreamHandoffMetricsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      chatHandoffReportingServiceApi.StreamHandoffMetricsResponse.fromPartial({
        handoff: {
          audit: {
            updatedAt: reply2?.notification?.audit?.updatedAt,
            updatedBy: (reply2?.notification?.audit?.updatedBy ?? ""),
          },
        },
      }),
      chatHandoffReportingServiceApi.StreamHandoffMetricsResponse.fromPartial({
        handoff: {
          requester: {
            name: req?.subscriber?.name,
            phone: (req?.subscriber?.phone ?? ""),
          },
        },
      }),
    );
  }
}
