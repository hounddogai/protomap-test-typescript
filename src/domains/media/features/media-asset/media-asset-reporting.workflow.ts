/**
 * Builds and schedules reports about media assets. Remote work stays behind typed client ports.
 */

import * as concessionsConcessionStandCalculationServiceApi from "../../../../../.cache/proto/acme/concessions/v1/concession_stand_calculation_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as formsFormFieldWorkflowServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_workflow_service.js";
import * as mediaMediaAssetReportingServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_reporting_service.js";
import * as mediaMediaAssetServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as mediaRenditionQueryServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as notificationsSubscriptionExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
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
import { WorkQueue } from "../../../../platform/work-queue.js";
import { MediaRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate media asset operations and persist audit data.
 */
@injectable()
export class MediaAssetReportingWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.concessions.v1.ConcessionStandCalculationService") private readonly concessionsConcessionStandCalculationClient: concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldWorkflowService") private readonly formsFormFieldWorkflowClient: formsFormFieldWorkflowServiceApi.FormFieldWorkflowServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetSyncService") private readonly mediaMediaAssetSyncClient: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient,
    @inject("grpc:acme.media.v1.RenditionQueryService") private readonly mediaRenditionQueryClient: mediaRenditionQueryServiceApi.RenditionQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionExportService") private readonly notificationsSubscriptionExportClient: notificationsSubscriptionExportServiceApi.SubscriptionExportServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationWorkflowService") private readonly personalizationRecommendationWorkflowClient: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Deletes a media asset.
   */
  async deleteMediaAssetReport(req: mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportRequest): Promise<mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteMediaAssetReport", req);
    this.logger.info("delete_media_asset_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest.fromPartial({
      context: req?.context,
      preference: {
        audit: { etag: (req?.etag ?? "") },
        action: { $case: "block", block: {
          notifyEmail: (req?.context?.actor?.email ?? ""),
          reason: (req?.reason ?? ""),
        } },
        owner: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const decoded1 = customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest.fromJSON(
      JSON.parse(JSON.stringify(customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest.toJSON(request1))),
    );
    const invoke1: Unary<customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest, customersPreferenceCalculationServiceApi.ComparePreferenceOptionsResponse> =
      (input, done) => this.customersPreferenceCalculationClient.comparePreferenceOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest, customersPreferenceCalculationServiceApi.ComparePreferenceOptionsResponse>(invoke1, decoded1);
    const request2 = mediaRenditionQueryServiceApi.ResolveRenditionsRequest.fromPartial({ context: req?.context });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.media.v1.ResolveRenditionsRequest",
      value: Buffer.from(mediaRenditionQueryServiceApi.ResolveRenditionsRequest.encode(request2).finish()),
    });
    const unpacked2 = mediaRenditionQueryServiceApi.ResolveRenditionsRequest.decode(envelope2.value);
    const invoke2: Unary<mediaRenditionQueryServiceApi.ResolveRenditionsRequest, mediaRenditionQueryServiceApi.ResolveRenditionsResponse> =
      (input, done) => this.mediaRenditionQueryClient.resolveRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaRenditionQueryServiceApi.ResolveRenditionsRequest, mediaRenditionQueryServiceApi.ResolveRenditionsResponse>(invoke2, unpacked2);
    let selected3_1: string | undefined;
    switch (reply1?.preference?.action?.$case) {
      case "block":
        selected3_1 = ((reply1?.preference?.action?.$case === "block" ? reply1?.preference?.action.block : undefined)?.notifyEmail ?? "");
        break;
      default:
        selected3_1 = "";
    }
    let selected3_2: string | undefined;
    switch (reply1?.preference?.action?.$case) {
      case "block":
        selected3_2 = ((reply1?.preference?.action?.$case === "block" ? reply1?.preference?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected3_2 = "";
    }
    const request3 = notificationsSubscriptionExportServiceApi.ShareSubscriptionExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((reply1?.preference?.parameters ?? {}))),
      context: req?.context,
      details: { recipient: { email: (selected3_1 ?? "") } },
      reason: (selected3_2 ?? ""),
    });
    const invoke3: Unary<notificationsSubscriptionExportServiceApi.ShareSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.ShareSubscriptionExportResponse> =
      (input, done) => this.notificationsSubscriptionExportClient.shareSubscriptionExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsSubscriptionExportServiceApi.ShareSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.ShareSubscriptionExportResponse>(invoke3, request3);
    const request4 = formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowRequest.fromPartial({
      context: req?.context,
      formField: {
        audit: { etag: (reply3?.subscription?.audit?.etag ?? "") },
        action: { $case: "block", block: {
          reason: ((reply1?.preference?.action?.$case === "block" ? reply1?.preference?.action.block : undefined)?.reason ?? ""),
        } },
      },
    });
    const invoke4: Unary<formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowResponse> =
      (input, done) => this.formsFormFieldWorkflowClient.cancelFormFieldWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.mediaAssetId ?? "") });
    return mergeResponses(
      mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          message: (reply3?.result?.message ?? ""),
        },
      }),
      mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportResponse.fromPartial({
        result: {
          details: (reply4?.result?.details ?? {}),
          message: (reply4?.outcome?.message ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a media asset.
   */
  async fetchMediaAssetReport(req: mediaMediaAssetReportingServiceApi.FetchMediaAssetReportRequest): Promise<mediaMediaAssetReportingServiceApi.FetchMediaAssetReportResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchMediaAssetReport", req);
    this.logger.info("fetch_media_asset_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    return mediaMediaAssetReportingServiceApi.FetchMediaAssetReportResponse.fromPartial({ mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") } });
  }

  /**
   * Generates a media asset.
   */
  async generateMediaAssetReport(req: mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest): Promise<mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateMediaAssetReport", req);
    this.logger.info("generate_media_asset_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetServiceApi.ListMediaAssetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
        ownerId: (req?.mediaAssetId ?? ""),
      },
    });
    const invoke1: Unary<mediaMediaAssetServiceApi.ListMediaAssetsRequest, mediaMediaAssetServiceApi.ListMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetClient.listMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<mediaMediaAssetServiceApi.ListMediaAssetsRequest, mediaMediaAssetServiceApi.ListMediaAssetsResponse>(invoke1, request1));
    const request2 = mediaMediaAssetServiceApi.UpdateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        mediaAssetId: (req?.mediaAssetId ?? ""),
        owner: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const invoke2: Unary<mediaMediaAssetServiceApi.UpdateMediaAssetRequest, mediaMediaAssetServiceApi.UpdateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetClient.updateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("GenerateMediaAssetReport.UpdateMediaAsset", () => call<mediaMediaAssetServiceApi.UpdateMediaAssetRequest, mediaMediaAssetServiceApi.UpdateMediaAssetResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists media assets a page at a time.
   */
  async listMediaAssetReports(req: mediaMediaAssetReportingServiceApi.ListMediaAssetReportsRequest): Promise<mediaMediaAssetReportingServiceApi.ListMediaAssetReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListMediaAssetReports", req);
    this.logger.info("list_media_asset_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersHouseholdQueryServiceApi.FindHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke1: Unary<customersHouseholdQueryServiceApi.FindHouseholdsRequest, customersHouseholdQueryServiceApi.FindHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.findHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.filter?.region ?? "") },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const reply2 = await this.workQueue.enqueue<personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest, personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsResponse>(
      "acme.media.v1.MediaAssetReportingService/ListMediaAssetReports:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      mediaMediaAssetReportingServiceApi.ListMediaAssetReportsResponse.fromPartial({
        pageInfo: { nextPageToken: (reply1?.pageInfo?.nextPageToken ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      mediaMediaAssetReportingServiceApi.ListMediaAssetReportsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
    );
  }

  /**
   * Schedules a media asset.
   */
  async scheduleMediaAssetReport(req: mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest): Promise<mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleMediaAssetReport", req);
    this.logger.info("schedule_media_asset_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      preference: { owner: { email: (req?.context?.actor?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest, customersPreferenceCalculationServiceApi.ComparePreferenceOptionsResponse> =
      (input, done) => this.customersPreferenceCalculationClient.comparePreferenceOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest, customersPreferenceCalculationServiceApi.ComparePreferenceOptionsResponse>(invoke1, request1));
    const request2 = mediaMediaAssetSyncServiceApi.GetMediaAssetSyncStateRequest.fromPartial({
      context: req?.context,
      mediaAssetId: (req?.mediaAssetId ?? ""),
    });
    const invoke2: Unary<mediaMediaAssetSyncServiceApi.GetMediaAssetSyncStateRequest, mediaMediaAssetSyncServiceApi.GetMediaAssetSyncStateResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.getMediaAssetSyncState(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<mediaMediaAssetSyncServiceApi.GetMediaAssetSyncStateResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares a media asset.
   */
  async shareMediaAssetReport(req: mediaMediaAssetReportingServiceApi.ShareMediaAssetReportRequest): Promise<mediaMediaAssetReportingServiceApi.ShareMediaAssetReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareMediaAssetReport", req);
    this.logger.info("share_media_asset_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      consentRecord: { source: (req?.details?.templateId ?? "") },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest, customersConsentRecordValidationServiceApi.ScoreConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.scoreConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = concessionsConcessionStandCalculationServiceApi.ExplainConcessionStandCalculationRequest.fromPartial({
      concessionStand: { owner: { email: (req?.details?.recipient?.email ?? "") } },
      context: req?.context,
      details: {
        contact: {
          phone: (req?.details?.recipient?.phone ?? ""),
          preferredChannel: (req?.details?.recipient?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<concessionsConcessionStandCalculationServiceApi.ExplainConcessionStandCalculationRequest, concessionsConcessionStandCalculationServiceApi.ExplainConcessionStandCalculationResponse> =
      (input, done) => this.concessionsConcessionStandCalculationClient.explainConcessionStandCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          phone: (req?.details?.recipient?.phone ?? ""),
          preferredChannel: (req?.details?.recipient?.preferredChannel ?? ""),
        },
      },
    });
    const method3 = "notifyNotificationTemplateWatchers" as const;
    const invoke3: Unary<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest, notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse> =
      (input, done) => this.notificationsNotificationTemplateNotificationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest, notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse>(invoke3, request3);
    const request4 = customersPreferenceCalculationServiceApi.QuotePreferenceRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (reply3?.notificationTemplate?.billingAddress?.lines ?? []).map((value) => value),
          region: ((reply2?.concessionStand?.locator?.$case === "address" ? reply2?.concessionStand?.locator.address : undefined)?.region ?? ""),
        },
      },
      preference: {
        audit: {
          createdBy: (reply2?.concessionStand?.audit?.createdBy ?? ""),
          etag: (reply2?.concessionStand?.audit?.etag ?? ""),
        },
      },
    });
    const proxy4 = forwarding(this.customersPreferenceCalculationClient);
    const invoke4: Unary<customersPreferenceCalculationServiceApi.QuotePreferenceRequest, customersPreferenceCalculationServiceApi.QuotePreferenceResponse> =
      (input, done) => proxy4.quotePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersPreferenceCalculationServiceApi.QuotePreferenceRequest, customersPreferenceCalculationServiceApi.QuotePreferenceResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      mediaMediaAssetReportingServiceApi.ShareMediaAssetReportResponse.fromPartial({
        mediaAsset: {
          owner: { displayName: (reply1?.consentRecord?.subject?.displayName ?? "") },
        },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      mediaMediaAssetReportingServiceApi.ShareMediaAssetReportResponse.fromPartial({
        mediaAsset: {
          dimensions: { unit: (reply2?.concessionStand?.dimensions?.unit ?? "") },
        },
      }),
      mediaMediaAssetReportingServiceApi.ShareMediaAssetReportResponse.fromPartial({
        mediaAsset: { audit: { updatedAt: reply3?.notificationTemplate?.audit?.updatedAt } },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      mediaMediaAssetReportingServiceApi.ShareMediaAssetReportResponse.fromPartial({
        mediaAsset: {
          audit: { updatedAt: reply4?.preference?.audit?.updatedAt },
          name: (reply4?.preference?.name ?? ""),
        },
      }),
      mediaMediaAssetReportingServiceApi.ShareMediaAssetReportResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          owner: { email: (req?.details?.recipient?.email ?? "") },
        },
      }),
    );
  }
}
