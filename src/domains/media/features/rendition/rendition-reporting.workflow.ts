/**
 * Builds and schedules reports about renditions. Remote work stays behind typed client ports.
 */

import * as communityModerationApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as mediaRenditionReportingServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import * as mediaRenditionSyncServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as surveysSurveyResponseWorkflowServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_workflow_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { MediaRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate rendition operations and persist audit data.
 */
@injectable()
export class RenditionReportingWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.media.v1.RenditionCalculationService") private readonly mediaRenditionCalculationClient: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient,
    @inject("grpc:acme.media.v1.RenditionSyncService") private readonly mediaRenditionSyncClient: mediaRenditionSyncServiceApi.RenditionSyncServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseWorkflowService") private readonly surveysSurveyResponseWorkflowClient: surveysSurveyResponseWorkflowServiceApi.SurveyResponseWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts renditions by status.
   */
  async countRenditionTotals(req: mediaRenditionReportingServiceApi.CountRenditionTotalsRequest): Promise<mediaRenditionReportingServiceApi.CountRenditionTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountRenditionTotals", req);
    this.logger.info("count_rendition_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionSyncServiceApi.SyncRenditionsRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const invoke1: Unary<mediaRenditionSyncServiceApi.SyncRenditionsRequest, mediaRenditionSyncServiceApi.SyncRenditionsResponse> =
      (input, done) => this.mediaRenditionSyncClient.syncRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionSyncServiceApi.SyncRenditionsRequest, mediaRenditionSyncServiceApi.SyncRenditionsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaRenditionReportingServiceApi.CountRenditionTotalsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } });
  }

  /**
   * Deletes a rendition.
   */
  async deleteRenditionReport(req: mediaRenditionReportingServiceApi.DeleteRenditionReportRequest): Promise<mediaRenditionReportingServiceApi.DeleteRenditionReportResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteRenditionReport", req);
    this.logger.info("delete_rendition_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: { recipient: { email: (req?.context?.actor?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest, notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.sendDeliveryAttemptTestNotice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest, notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest.fromPartial({
      context: input2?.context,
      filter: {
        createdAfter: reply1?.deliveryAttempt?.occurredAt,
        labels: Object.fromEntries(Object.entries((reply1?.deliveryAttempt?.attributes ?? {}))),
        ownerId: (reply1?.deliveryAttempt?.subject?.notificationTemplateId ?? ""),
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.browseNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return mergeResponses(
      mediaRenditionReportingServiceApi.DeleteRenditionReportResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      mediaRenditionReportingServiceApi.DeleteRenditionReportResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
    );
  }

  /**
   * Returns a rendition.
   */
  async fetchRenditionReport(req: mediaRenditionReportingServiceApi.FetchRenditionReportRequest): Promise<mediaRenditionReportingServiceApi.FetchRenditionReportResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchRenditionReport", req);
    this.logger.info("fetch_rendition_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const cloned1: notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.recalculateNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse>(invoke1, cloned1);
    return mergeResponses(
      mediaRenditionReportingServiceApi.FetchRenditionReportResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      mediaRenditionReportingServiceApi.FetchRenditionReportResponse.fromPartial({ rendition: { renditionId: (req?.renditionId ?? "") } }),
    );
  }

  /**
   * Generates a rendition.
   */
  async generateRenditionReport(req: mediaRenditionReportingServiceApi.GenerateRenditionReportRequest): Promise<mediaRenditionReportingServiceApi.GenerateRenditionReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateRenditionReport", req);
    this.logger.info("generate_rendition_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
      reason: (req?.reason ?? ""),
      surveyResponse: {
        attributes: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
      },
    });
    const decoded1 = surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowRequest.fromJSON(
      JSON.parse(JSON.stringify(surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowRequest.toJSON(request1))),
    );
    const invoke1: Unary<surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowResponse> =
      (input, done) => this.surveysSurveyResponseWorkflowClient.startSurveyResponseWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.StartSurveyResponseWorkflowResponse>(invoke1, decoded1);
    const request2 = customersHouseholdQueryServiceApi.FindHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.outcome?.effectiveAt,
        ownerId: (reply1?.surveyResponse?.correlationId ?? ""),
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.FindHouseholdsRequest",
      value: Buffer.from(customersHouseholdQueryServiceApi.FindHouseholdsRequest.encode(request2).finish()),
    });
    const unpacked2 = customersHouseholdQueryServiceApi.FindHouseholdsRequest.decode(envelope2.value);
    const invoke2: Unary<customersHouseholdQueryServiceApi.FindHouseholdsRequest, customersHouseholdQueryServiceApi.FindHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.findHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersHouseholdQueryServiceApi.FindHouseholdsRequest, customersHouseholdQueryServiceApi.FindHouseholdsResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      mediaRenditionReportingServiceApi.GenerateRenditionReportResponse.fromPartial({
        result: { correlationId: (reply1?.surveyResponse?.correlationId ?? "") },
      }),
      mediaRenditionReportingServiceApi.GenerateRenditionReportResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      mediaRenditionReportingServiceApi.GenerateRenditionReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists renditions a page at a time.
   */
  async listRenditionReports(req: mediaRenditionReportingServiceApi.ListRenditionReportsRequest): Promise<mediaRenditionReportingServiceApi.ListRenditionReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListRenditionReports", req);
    this.logger.info("list_rendition_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaRenditionReportingServiceApi.ListRenditionReportsResponse.fromPartial({});
  }

  /**
   * Schedules a rendition.
   */
  async scheduleRenditionReport(req: mediaRenditionReportingServiceApi.ScheduleRenditionReportRequest): Promise<mediaRenditionReportingServiceApi.ScheduleRenditionReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleRenditionReport", req);
    this.logger.info("schedule_rendition_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const client1 = this.clients.get<ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient>("acme.ledger.v1.LedgerAccountValidationService");
    const invoke1: Unary<ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest, ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityResponse> =
      (input, done) => client1.checkLedgerAccountEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest, ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityResponse>(invoke1, request1);
    const request2 = communityModerationApprovalServiceApi.ApproveModerationRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: { displayName: (reply1?.ledgerAccount?.holder?.displayName ?? "") },
        audit: { etag: (reply1?.ledgerAccount?.audit?.etag ?? "") },
      },
    });
    const invoke2: Unary<communityModerationApprovalServiceApi.ApproveModerationRequest, communityModerationApprovalServiceApi.ApproveModerationResponse> =
      (input, done) => this.communityModerationApprovalClient.approveModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<communityModerationApprovalServiceApi.ApproveModerationRequest, communityModerationApprovalServiceApi.ApproveModerationResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = customersPreferenceCalculationServiceApi.SimulatePreferenceRequest.fromPartial({
      context: req?.context,
      preference: {
        owner: { displayName: (reply2?.moderation?.assignee?.displayName ?? "") },
      },
    });
    const invoke3: Unary<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse> =
      (input, done) => this.customersPreferenceCalculationClient.simulatePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionReportingServiceApi.ScheduleRenditionReportResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      mediaRenditionReportingServiceApi.ScheduleRenditionReportResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      mediaRenditionReportingServiceApi.ScheduleRenditionReportResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      mediaRenditionReportingServiceApi.ScheduleRenditionReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares a rendition.
   */
  async shareRenditionReport(req: mediaRenditionReportingServiceApi.ShareRenditionReportRequest): Promise<mediaRenditionReportingServiceApi.ShareRenditionReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareRenditionReport", req);
    this.logger.info("share_rendition_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionCalculationServiceApi.CalculateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: { owner: { email: (req?.details?.recipient?.email ?? "") } },
    });
    const invoke1: Unary<mediaRenditionCalculationServiceApi.CalculateRenditionRequest, mediaRenditionCalculationServiceApi.CalculateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.calculateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ShareRenditionReport.CalculateRendition", () => call<mediaRenditionCalculationServiceApi.CalculateRenditionRequest, mediaRenditionCalculationServiceApi.CalculateRenditionResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionReportingServiceApi.ShareRenditionReportResponse.fromPartial({
        rendition: {
          audit: { updatedAt: reply1?.rendition?.audit?.updatedAt },
          dimensions: { height: (reply1?.rendition?.dimensions?.height ?? 0) },
        },
      }),
      mediaRenditionReportingServiceApi.ShareRenditionReportResponse.fromPartial({
        rendition: {
          owner: { email: (req?.details?.recipient?.email ?? "") },
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }
}
