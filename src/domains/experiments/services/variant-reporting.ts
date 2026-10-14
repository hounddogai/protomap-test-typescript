/**
 * Builds and schedules reports about variants. Remote work stays behind typed client ports.
 */

import * as communityBadgeWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as documentsDocumentQueryServiceApi from "../../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as experimentsExperimentReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as experimentsExperimentServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureImportServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as experimentsVariantReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as giftcardsGiftCardServiceApi from "../../../../.cache/proto/acme/giftcards/v1/gift_card_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as personalizationProfileWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
import * as sponsorshipsSponsorCalculationServiceApi from "../../../../.cache/proto/acme/sponsorships/v1/sponsor_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate variant operations and persist audit data.
 */
@injectable()
export class VariantReportingWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeWorkflowService") private readonly communityBadgeWorkflowClient: communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient,
    @inject("grpc:acme.documents.v1.DocumentQueryService") private readonly documentsDocumentQueryClient: documentsDocumentQueryServiceApi.DocumentQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentReportingService") private readonly experimentsExperimentReportingClient: experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.giftcards.v1.GiftCardService") private readonly giftcardsGiftCardClient: giftcardsGiftCardServiceApi.GiftCardServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileWorkflowService") private readonly personalizationProfileWorkflowClient: personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceClient,
    @inject("grpc:acme.sponsorships.v1.SponsorCalculationService") private readonly sponsorshipsSponsorCalculationClient: sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts variants by status.
   */
  async countVariantTotals(req: experimentsVariantReportingServiceApi.CountVariantTotalsRequest): Promise<experimentsVariantReportingServiceApi.CountVariantTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountVariantTotals", req);
    this.logger.info("count_variant_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureImportServiceApi.MapExposureImportColumnsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      exposure: { subject: { startsAt: req?.filter?.createdAfter } },
    });
    const invoke1: Unary<experimentsExposureImportServiceApi.MapExposureImportColumnsRequest, experimentsExposureImportServiceApi.MapExposureImportColumnsResponse> =
      (input, done) => this.experimentsExposureImportClient.mapExposureImportColumns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsExposureImportServiceApi.MapExposureImportColumnsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsVariantReportingServiceApi.CountVariantTotalsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } });
  }

  /**
   * Deletes a variant.
   */
  async deleteVariantReport(req: experimentsVariantReportingServiceApi.DeleteVariantReportRequest): Promise<experimentsVariantReportingServiceApi.DeleteVariantReportResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteVariantReport", req);
    this.logger.info("delete_variant_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.PreviewExperimentRequest.fromPartial({
      context: req?.context,
      experiment: { audit: { etag: (req?.etag ?? "") } },
    });
    const invoke1: Unary<experimentsExperimentValidationServiceApi.PreviewExperimentRequest, experimentsExperimentValidationServiceApi.PreviewExperimentResponse> =
      (input, done) => this.experimentsExperimentValidationClient.previewExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.experiment?.organizer?.email ?? "") } },
      exposure: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (reply1?.experiment?.organizer?.displayName ?? "") },
      },
    });
    const invoke2: Unary<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse> =
      (input, done) => this.experimentsExposureValidationClient.explainExposureDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = experimentsExposureSyncServiceApi.SyncExposuresRequest.fromPartial({
      context: req?.context,
      exposure: {
        subject: {
          experimentId: (reply2?.exposure?.subject?.experimentId ?? ""),
          startsAt: reply2?.exposure?.subject?.startsAt,
        },
      },
    });
    const method3 = "syncExposures" as const;
    const invoke3: Unary<experimentsExposureSyncServiceApi.SyncExposuresRequest, experimentsExposureSyncServiceApi.SyncExposuresResponse> =
      (input, done) => this.experimentsExposureSyncClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureSyncServiceApi.SyncExposuresRequest, experimentsExposureSyncServiceApi.SyncExposuresResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantReportingServiceApi.DeleteVariantReportResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      experimentsVariantReportingServiceApi.DeleteVariantReportResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      experimentsVariantReportingServiceApi.DeleteVariantReportResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a variant.
   */
  async fetchVariantReport(req: experimentsVariantReportingServiceApi.FetchVariantReportRequest): Promise<experimentsVariantReportingServiceApi.FetchVariantReportResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchVariantReport", req);
    this.logger.info("fetch_variant_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: { email: (req?.context?.actor?.email ?? "") },
        variables: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const proxy1 = forwarding(this.notificationsDeliveryAttemptExportClient);
    const invoke1: Unary<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse> =
      (input, done) => proxy1.shareDeliveryAttemptExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse>(invoke1, request1);
    const request2 = experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest.fromPartial({
      context: req?.context,
      variant: {
        owner: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest, experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse> =
      (input, done) => this.experimentsVariantCalculationClient.explainVariantCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest, experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse>(invoke2, request2);
    return mergeResponses(
      experimentsVariantReportingServiceApi.FetchVariantReportResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      experimentsVariantReportingServiceApi.FetchVariantReportResponse.fromPartial({
        variant: {
          audit: { etag: (reply2?.variant?.audit?.etag ?? "") },
          owner: reply2?.variant?.owner,
        },
      }),
      experimentsVariantReportingServiceApi.FetchVariantReportResponse.fromPartial({ variant: { variantId: (req?.variantId ?? "") } }),
    );
  }

  /**
   * Generates a variant.
   */
  async generateVariantReport(req: experimentsVariantReportingServiceApi.GenerateVariantReportRequest): Promise<experimentsVariantReportingServiceApi.GenerateVariantReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateVariantReport", req);
    this.logger.info("generate_variant_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = giftcardsGiftCardServiceApi.SearchGiftCardsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
        ownerId: (req?.variantId ?? ""),
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<giftcardsGiftCardServiceApi.SearchGiftCardsRequest, giftcardsGiftCardServiceApi.SearchGiftCardsResponse> =
      (input, done) => this.giftcardsGiftCardClient.searchGiftCards(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<giftcardsGiftCardServiceApi.SearchGiftCardsRequest, giftcardsGiftCardServiceApi.SearchGiftCardsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = sponsorshipsSponsorCalculationServiceApi.CompareSponsorOptionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input2?.annotations ?? {}))),
      context: input2?.context,
      reason: (input2?.reason ?? ""),
      sponsor: {
        relationshipManager: {
          email: (input2?.context?.actor?.email ?? ""),
          userId: (input2?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<sponsorshipsSponsorCalculationServiceApi.CompareSponsorOptionsRequest, sponsorshipsSponsorCalculationServiceApi.CompareSponsorOptionsResponse> =
      (input, done) => this.sponsorshipsSponsorCalculationClient.compareSponsorOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<sponsorshipsSponsorCalculationServiceApi.CompareSponsorOptionsRequest, sponsorshipsSponsorCalculationServiceApi.CompareSponsorOptionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      experimentsVariantReportingServiceApi.GenerateVariantReportResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      experimentsVariantReportingServiceApi.GenerateVariantReportResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      experimentsVariantReportingServiceApi.GenerateVariantReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists variants a page at a time.
   */
  async listVariantReports(req: experimentsVariantReportingServiceApi.ListVariantReportsRequest): Promise<experimentsVariantReportingServiceApi.ListVariantReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListVariantReports", req);
    this.logger.info("list_variant_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeWorkflowServiceApi.StartBadgeWorkflowRequest.fromPartial({
      badge: {
        audit: { updatedAt: req?.filter?.createdAfter },
        action: { $case: "block", block: { notifyEmail: (req?.context?.actor?.email ?? "") } },
        owner: { userId: (req?.context?.actor?.userId ?? "") },
        parameters: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
      context: req?.context,
    });
    const cloned1: communityBadgeWorkflowServiceApi.StartBadgeWorkflowRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<communityBadgeWorkflowServiceApi.StartBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.StartBadgeWorkflowResponse> =
      (input, done) => this.communityBadgeWorkflowClient.startBadgeWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeWorkflowServiceApi.StartBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.StartBadgeWorkflowResponse>(invoke1, cloned1);
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
    return experimentsVariantReportingServiceApi.ListVariantReportsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } });
  }

  /**
   * Schedules a variant.
   */
  async scheduleVariantReport(req: experimentsVariantReportingServiceApi.ScheduleVariantReportRequest): Promise<experimentsVariantReportingServiceApi.ScheduleVariantReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleVariantReport", req);
    this.logger.info("schedule_variant_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileWorkflowServiceApi.PauseProfileWorkflowRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const decoded1 = personalizationProfileWorkflowServiceApi.PauseProfileWorkflowRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationProfileWorkflowServiceApi.PauseProfileWorkflowRequest.toJSON(request1))),
    );
    const invoke1: Unary<personalizationProfileWorkflowServiceApi.PauseProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.PauseProfileWorkflowResponse> =
      (input, done) => this.personalizationProfileWorkflowClient.pauseProfileWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileWorkflowServiceApi.PauseProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.PauseProfileWorkflowResponse>(invoke1, decoded1);
    const request2 = experimentsExposureImportServiceApi.MapExposureImportColumnsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (reply1?.profile?.contact?.email ?? ""),
          name: reply1?.profile?.name,
          preferredChannel: (reply1?.profile?.contact?.preferredChannel ?? ""),
        },
      },
      exposure: {
        subject: {
          displayName: (reply1?.profile?.relationshipManager?.displayName ?? ""),
        },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.MapExposureImportColumnsRequest",
      value: Buffer.from(experimentsExposureImportServiceApi.MapExposureImportColumnsRequest.encode(request2).finish()),
    });
    const unpacked2 = experimentsExposureImportServiceApi.MapExposureImportColumnsRequest.decode(envelope2.value);
    const invoke2: Unary<experimentsExposureImportServiceApi.MapExposureImportColumnsRequest, experimentsExposureImportServiceApi.MapExposureImportColumnsResponse> =
      (input, done) => this.experimentsExposureImportClient.mapExposureImportColumns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExposureImportServiceApi.MapExposureImportColumnsRequest, experimentsExposureImportServiceApi.MapExposureImportColumnsResponse>(invoke2, unpacked2);
    const request3 = notificationsNotificationSyncServiceApi.StreamNotificationChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        subject: (req?.context?.actor?.userId ?? ""),
      } },
      context: req?.context,
    });
    const stream3 = this.notificationsNotificationSyncClient.streamNotificationChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? notificationsNotificationSyncServiceApi.StreamNotificationChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      experimentsVariantReportingServiceApi.ScheduleVariantReportResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      experimentsVariantReportingServiceApi.ScheduleVariantReportResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      experimentsVariantReportingServiceApi.ScheduleVariantReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares a variant.
   */
  async shareVariantReport(req: experimentsVariantReportingServiceApi.ShareVariantReportRequest): Promise<experimentsVariantReportingServiceApi.ShareVariantReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareVariantReport", req);
    this.logger.info("share_variant_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantCalculationServiceApi.EstimateVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: { email: (req?.details?.recipient?.email ?? "") },
      },
      variantId: (req?.variantId ?? ""),
    });
    const client1 = this.clients.get<experimentsVariantCalculationServiceApi.VariantCalculationServiceClient>("acme.experiments.v1.VariantCalculationService");
    const invoke1: Unary<experimentsVariantCalculationServiceApi.EstimateVariantRequest, experimentsVariantCalculationServiceApi.EstimateVariantResponse> =
      (input, done) => client1.estimateVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantCalculationServiceApi.EstimateVariantRequest, experimentsVariantCalculationServiceApi.EstimateVariantResponse>(invoke1, request1);
    const request2 = experimentsExperimentServiceApi.UpdateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { etag: (reply1?.variant?.audit?.etag ?? "") },
        participants: [{
          contact: {
            name: req?.details?.recipient?.name,
            phone: (req?.details?.recipient?.phone ?? ""),
          },
        }],
      },
    });
    const invoke2: Unary<experimentsExperimentServiceApi.UpdateExperimentRequest, experimentsExperimentServiceApi.UpdateExperimentResponse> =
      (input, done) => this.experimentsExperimentClient.updateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<experimentsExperimentServiceApi.UpdateExperimentRequest, experimentsExperimentServiceApi.UpdateExperimentResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      experimentsVariantReportingServiceApi.ShareVariantReportResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      experimentsVariantReportingServiceApi.ShareVariantReportResponse.fromPartial({
        result: { message: (reply2?.result?.message ?? "") },
        variant: { audit: { updatedAt: reply2?.experiment?.audit?.updatedAt } },
      }),
      experimentsVariantReportingServiceApi.ShareVariantReportResponse.fromPartial({
        variant: {
          owner: { email: (req?.details?.recipient?.email ?? "") },
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of variants as they happen.
   */
  async streamVariantMetrics(req: experimentsVariantReportingServiceApi.StreamVariantMetricsRequest): Promise<experimentsVariantReportingServiceApi.StreamVariantMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamVariantMetrics", req);
    this.logger.info("stream_variant_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentQueryServiceApi.BrowseDocumentsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.filter?.region ?? "") },
    });
    const invoke1: Unary<documentsDocumentQueryServiceApi.BrowseDocumentsRequest, documentsDocumentQueryServiceApi.BrowseDocumentsResponse> =
      (input, done) => this.documentsDocumentQueryClient.browseDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<documentsDocumentQueryServiceApi.BrowseDocumentsRequest, documentsDocumentQueryServiceApi.BrowseDocumentsResponse>(invoke1, request1));
    const request2 = experimentsExperimentReportingServiceApi.StreamExperimentMetricsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        name: req?.subscriber?.name,
        preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
      },
    });
    const stream2 = this.experimentsExperimentReportingClient.streamExperimentMetrics(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? experimentsExperimentReportingServiceApi.StreamExperimentMetricsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.subscriber?.phone ?? "") });
    return mergeResponses(
      experimentsVariantReportingServiceApi.StreamVariantMetricsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      experimentsVariantReportingServiceApi.StreamVariantMetricsResponse.fromPartial({ variant: { owner: { email: (req?.subscriber?.email ?? "") } } }),
    );
  }
}

/**
 * The gRPC boundary for VariantReportingService; workflows own validation and database transactions.
 */
@injectable()
export class VariantReportingHandler {
  constructor(@inject(VariantReportingWorkflow) private readonly workflow: VariantReportingWorkflow) {}

  /**
   * Counts variants by status.
   */
  countVariantTotals = unary<experimentsVariantReportingServiceApi.CountVariantTotalsRequest, experimentsVariantReportingServiceApi.CountVariantTotalsResponse>(
    (request) => this.workflow.countVariantTotals(request),
  );

  /**
   * Deletes a variant.
   */
  deleteVariantReport = unary<experimentsVariantReportingServiceApi.DeleteVariantReportRequest, experimentsVariantReportingServiceApi.DeleteVariantReportResponse>(
    (request) => this.workflow.deleteVariantReport(request),
  );

  /**
   * Returns a variant.
   */
  fetchVariantReport = (call: ServerUnaryCall<experimentsVariantReportingServiceApi.FetchVariantReportRequest, experimentsVariantReportingServiceApi.FetchVariantReportResponse>, done: sendUnaryData<experimentsVariantReportingServiceApi.FetchVariantReportResponse>): void => {
    void this.workflow.fetchVariantReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Generates a variant.
   */
  generateVariantReport = unary<experimentsVariantReportingServiceApi.GenerateVariantReportRequest, experimentsVariantReportingServiceApi.GenerateVariantReportResponse>(
    (request) => this.workflow.generateVariantReport(request),
  );

  /**
   * Lists variants a page at a time.
   */
  listVariantReports = unary<experimentsVariantReportingServiceApi.ListVariantReportsRequest, experimentsVariantReportingServiceApi.ListVariantReportsResponse>(
    (request) => this.workflow.listVariantReports(request),
  );

  /**
   * Schedules a variant.
   */
  scheduleVariantReport = (call: ServerUnaryCall<experimentsVariantReportingServiceApi.ScheduleVariantReportRequest, experimentsVariantReportingServiceApi.ScheduleVariantReportResponse>, done: sendUnaryData<experimentsVariantReportingServiceApi.ScheduleVariantReportResponse>): void => {
    void this.workflow.scheduleVariantReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Shares a variant.
   */
  shareVariantReport = unary<experimentsVariantReportingServiceApi.ShareVariantReportRequest, experimentsVariantReportingServiceApi.ShareVariantReportResponse>(
    (request) => this.workflow.shareVariantReport(request),
  );

  /**
   * Streams the changes of variants as they happen.
   */
  streamVariantMetrics = serverStream<experimentsVariantReportingServiceApi.StreamVariantMetricsRequest, experimentsVariantReportingServiceApi.StreamVariantMetricsResponse>(
    (request) => this.workflow.streamVariantMetrics(request),
  );
}

export function implementation(handler: VariantReportingHandler): experimentsVariantReportingServiceApi.VariantReportingServiceServer {
  return {
    countVariantTotals: handler.countVariantTotals,
    deleteVariantReport: handler.deleteVariantReport,
    fetchVariantReport: handler.fetchVariantReport,
    generateVariantReport: handler.generateVariantReport,
    listVariantReports: handler.listVariantReports,
    scheduleVariantReport: handler.scheduleVariantReport,
    shareVariantReport: handler.shareVariantReport,
    streamVariantMetrics: handler.streamVariantMetrics,
  };
}
