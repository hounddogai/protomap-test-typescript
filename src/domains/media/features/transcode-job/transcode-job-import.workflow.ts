/**
 * Takes transcode jobs in bulk from partners and legacy systems. Remote work stays behind typed client ports.
 */

import * as auditAuditEventServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as catalogProductQueryServiceApi from "../../../../../.cache/proto/acme/catalog/v1/product_query_service.js";
import * as customersCustomerServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_service.js";
import * as experimentsVariantApprovalServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import * as identityUserQueryServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as mediaMediaAssetServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as mediaRenditionQueryServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as mediaRenditionValidationServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_validation_service.js";
import * as mediaTranscodeJobImportServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_import_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
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
  promised,
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toTranscodeJobRecord } from "../../data/records.js";
import { MediaRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate transcode job operations and persist audit data.
 */
@injectable()
export class TranscodeJobImportWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.catalog.v1.ProductQueryService") private readonly catalogProductQueryClient: catalogProductQueryServiceApi.ProductQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerService") private readonly customersCustomerClient: customersCustomerServiceApi.CustomerServiceClient,
    @inject("grpc:acme.experiments.v1.VariantApprovalService") private readonly experimentsVariantApprovalClient: experimentsVariantApprovalServiceApi.VariantApprovalServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetSyncService") private readonly mediaMediaAssetSyncClient: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient,
    @inject("grpc:acme.media.v1.RenditionCalculationService") private readonly mediaRenditionCalculationClient: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient,
    @inject("grpc:acme.media.v1.RenditionQueryService") private readonly mediaRenditionQueryClient: mediaRenditionQueryServiceApi.RenditionQueryServiceClient,
    @inject("grpc:acme.media.v1.RenditionValidationService") private readonly mediaRenditionValidationClient: mediaRenditionValidationServiceApi.RenditionValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointApprovalService") private readonly webhooksWebhookEndpointApprovalClient: webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Cancels a transcode job.
   */
  async cancelTranscodeJobImport(req: mediaTranscodeJobImportServiceApi.CancelTranscodeJobImportRequest): Promise<mediaTranscodeJobImportServiceApi.CancelTranscodeJobImportResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "CancelTranscodeJobImport", req);
    this.logger.info("cancel_transcode_job_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionQueryServiceApi.ExportRenditionsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const stream1 = this.mediaRenditionQueryClient.exportRenditions(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? mediaRenditionQueryServiceApi.ExportRenditionsResponse.fromPartial({});
    const request2 = notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.listDeliveryAttemptVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobImportServiceApi.CancelTranscodeJobImportResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      mediaTranscodeJobImportServiceApi.CancelTranscodeJobImportResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") },
      }),
    );
  }

  /**
   * Returns a transcode job.
   */
  async getTranscodeJobImportStatus(req: mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusRequest): Promise<mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranscodeJobImportStatus", req);
    this.logger.info("get_transcode_job_import_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetServiceApi.SearchMediaAssetsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.transcodeJobId ?? ""),
      },
    });
    const invoke1: Unary<mediaMediaAssetServiceApi.SearchMediaAssetsRequest, mediaMediaAssetServiceApi.SearchMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetClient.searchMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<mediaMediaAssetServiceApi.SearchMediaAssetsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = notificationsSubscriptionNotificationServiceApi.StreamSubscriptionNoticesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream2 = this.notificationsSubscriptionNotificationClient.streamSubscriptionNotices(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? notificationsSubscriptionNotificationServiceApi.StreamSubscriptionNoticesResponse.fromPartial({});
    return mergeResponses(
      mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      mediaTranscodeJobImportServiceApi.GetTranscodeJobImportStatusResponse.fromPartial({ transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") } }),
    );
  }

  /**
   * Takes a stream of transcode jobs and answers once at the end.
   */
  async importTranscodeJobs(req: mediaTranscodeJobImportServiceApi.ImportTranscodeJobsRequest): Promise<mediaTranscodeJobImportServiceApi.ImportTranscodeJobsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ImportTranscodeJobs", req);
    this.logger.info("import_transcode_jobs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionQueryServiceApi.ResolveRenditionsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<mediaRenditionQueryServiceApi.ResolveRenditionsRequest, mediaRenditionQueryServiceApi.ResolveRenditionsResponse> =
      (input, done) => this.mediaRenditionQueryClient.resolveRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected2_1 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.requester?.email ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_2: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected2_2 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.assignee?.displayName ?? "");
        break;
      default:
        selected2_2 = "";
    }
    let selected2_3: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected2_3 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.createdBy ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = mediaRenditionValidationServiceApi.PreviewRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        audit: { createdBy: (selected2_3 ?? "") },
        owner: {
          displayName: (selected2_2 ?? ""),
          email: (selected2_1 ?? ""),
        },
      },
    });
    const invoke2: Unary<mediaRenditionValidationServiceApi.PreviewRenditionRequest, mediaRenditionValidationServiceApi.PreviewRenditionResponse> =
      (input, done) => this.mediaRenditionValidationClient.previewRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaRenditionValidationServiceApi.PreviewRenditionRequest, mediaRenditionValidationServiceApi.PreviewRenditionResponse>(invoke2, request2);
    const request3 = notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((reply2?.rendition?.locator?.$case === "address" ? reply2?.rendition?.locator.address : undefined)?.region ?? ""),
      },
      format: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.format ?? ""),
    });
    const stream3 = this.notificationsDeliveryAttemptExportClient.streamDeliveryAttemptExport(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportResponse.fromPartial({});
    const request4 = mediaRenditionQueryServiceApi.CountRenditionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.sla?.dueAt,
        region: ((reply2?.rendition?.locator?.$case === "address" ? reply2?.rendition?.locator.address : undefined)?.region ?? ""),
      },
    });
    const method4 = "countRenditions" as const;
    const invoke4: Unary<mediaRenditionQueryServiceApi.CountRenditionsRequest, mediaRenditionQueryServiceApi.CountRenditionsResponse> =
      (input, done) => this.mediaRenditionQueryClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<mediaRenditionQueryServiceApi.CountRenditionsRequest, mediaRenditionQueryServiceApi.CountRenditionsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      mediaTranscodeJobImportServiceApi.ImportTranscodeJobsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      mediaTranscodeJobImportServiceApi.ImportTranscodeJobsResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      mediaTranscodeJobImportServiceApi.ImportTranscodeJobsResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
    );
  }

  /**
   * Lists transcode jobs a page at a time.
   */
  async listTranscodeJobImports(req: mediaTranscodeJobImportServiceApi.ListTranscodeJobImportsRequest): Promise<mediaTranscodeJobImportServiceApi.ListTranscodeJobImportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListTranscodeJobImports", req);
    this.logger.info("list_transcode_job_imports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
      page: {
        pageSize: (req?.page?.pageSize ?? 0),
        pageToken: (req?.page?.pageToken ?? ""),
      },
    });
    const proxy1 = forwarding(this.webhooksWebhookEndpointApprovalClient);
    const invoke1: Unary<webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsRequest, webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsResponse> =
      (input, done) => proxy1.listPendingWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsRequest, webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsResponse>(invoke1, request1);
    const request2 = catalogProductQueryServiceApi.FindProductsRequest.fromPartial({
      context: req?.context,
      filter: { query: (req?.filter?.query ?? "") },
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const invoke2: Unary<catalogProductQueryServiceApi.FindProductsRequest, catalogProductQueryServiceApi.FindProductsResponse> =
      (input, done) => this.catalogProductQueryClient.findProducts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<catalogProductQueryServiceApi.FindProductsRequest, catalogProductQueryServiceApi.FindProductsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      mediaTranscodeJobImportServiceApi.ListTranscodeJobImportsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaTranscodeJobImportServiceApi.ListTranscodeJobImportsResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
    );
  }

  /**
   * Maps a transcode job.
   */
  async mapTranscodeJobImportColumns(req: mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsRequest): Promise<mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "MapTranscodeJobImportColumns", req);
    this.logger.info("map_transcode_job_import_columns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerServiceApi.UpdateCustomerRequest.fromPartial({
      context: req?.context,
      customer: { relationshipManager: { email: (req?.details?.contact?.email ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<customersCustomerServiceApi.UpdateCustomerRequest, customersCustomerServiceApi.UpdateCustomerResponse> =
      (input, done) => this.customersCustomerClient.updateCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerServiceApi.UpdateCustomerRequest, customersCustomerServiceApi.UpdateCustomerResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest.fromPartial({
      context: input2?.context,
      mediaAsset: { owner: { email: (input2?.transcodeJob?.assignee?.email ?? "") } },
    });
    const invoke2: Unary<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.resolveMediaAssetConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse>(invoke2, request2);
    const request3 = identityUserQueryServiceApi.LookupUserRequest.fromPartial({
      context: req?.context,
      userId: (req?.transcodeJob?.assignee?.userId ?? ""),
    });
    const cloned3: identityUserQueryServiceApi.LookupUserRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<identityUserQueryServiceApi.LookupUserRequest, identityUserQueryServiceApi.LookupUserResponse> =
      (input, done) => this.identityUserQueryClient.lookupUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<identityUserQueryServiceApi.LookupUserRequest, identityUserQueryServiceApi.LookupUserResponse>(invoke3, cloned3);
    const request4 = mediaMediaAssetSyncServiceApi.PushMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        audit: { createdBy: (reply1?.customer?.audit?.createdBy ?? "") },
        dimensions: { weight: (reply2?.mediaAsset?.dimensions?.weight ?? 0) },
        owner: { userId: (reply1?.customer?.relationshipManager?.userId ?? "") },
      },
    });
    const decoded4 = mediaMediaAssetSyncServiceApi.PushMediaAssetRequest.fromJSON(
      JSON.parse(JSON.stringify(mediaMediaAssetSyncServiceApi.PushMediaAssetRequest.toJSON(request4))),
    );
    const invoke4: Unary<mediaMediaAssetSyncServiceApi.PushMediaAssetRequest, mediaMediaAssetSyncServiceApi.PushMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetSyncClient.pushMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<mediaMediaAssetSyncServiceApi.PushMediaAssetRequest, mediaMediaAssetSyncServiceApi.PushMediaAssetResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsResponse.fromPartial({ outcome: { status: (reply4?.result?.status ?? "") } }),
      mediaTranscodeJobImportServiceApi.MapTranscodeJobImportColumnsResponse.fromPartial({
        transcodeJob: {
          customFields: (req?.transcodeJob?.customFields ?? {}),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a transcode job.
   */
  async retryTranscodeJobImport(req: mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportRequest): Promise<mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "RetryTranscodeJobImport", req);
    this.logger.info("retry_transcode_job_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantApprovalServiceApi.ListPendingVariantsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.transcodeJob?.audit?.updatedAt },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.ListPendingVariantsRequest",
      value: Buffer.from(experimentsVariantApprovalServiceApi.ListPendingVariantsRequest.encode(request1).finish()),
    });
    const unpacked1 = experimentsVariantApprovalServiceApi.ListPendingVariantsRequest.decode(envelope1.value);
    const invoke1: Unary<experimentsVariantApprovalServiceApi.ListPendingVariantsRequest, experimentsVariantApprovalServiceApi.ListPendingVariantsResponse> =
      (input, done) => this.experimentsVariantApprovalClient.listPendingVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantApprovalServiceApi.ListPendingVariantsRequest, experimentsVariantApprovalServiceApi.ListPendingVariantsResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      mediaTranscodeJobImportServiceApi.RetryTranscodeJobImportResponse.fromPartial({
        transcodeJob: {
          priority: (req?.transcodeJob?.priority ?? 0),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a transcode job.
   */
  async validateTranscodeJobImport(req: mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportRequest): Promise<mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "ValidateTranscodeJobImport", req);
    this.logger.info("validate_transcode_job_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<auditAuditEventServiceApi.CloneAuditEventResponse>> = [];
    for (const item of (req?.transcodeJob?.comments ?? [])) {
      tasks1.push(async () => {
        const request1 = auditAuditEventServiceApi.CloneAuditEventRequest.fromPartial({
          auditEvent: {
            measurements: [{ observedAt: item?.createdAt }],
            occurredAt: req?.transcodeJob?.audit?.createdAt,
            source: (item?.commentId ?? ""),
            subject: { displayName: (req?.transcodeJob?.assignee?.displayName ?? "") },
          },
          context: req?.context,
        });
        const invoke1: Unary<auditAuditEventServiceApi.CloneAuditEventRequest, auditAuditEventServiceApi.CloneAuditEventResponse> =
          (input, done) => this.auditAuditEventClient.cloneAuditEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<auditAuditEventServiceApi.CloneAuditEventRequest, auditAuditEventServiceApi.CloneAuditEventResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? auditAuditEventServiceApi.CloneAuditEventResponse.fromPartial({});
    const request2 = notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: { displayName: (req?.transcodeJob?.assignee?.displayName ?? "") },
      },
      details: { contact: { name: req?.details?.contact?.name } },
    });
    const client2 = this.clients.get<notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient>("acme.notifications.v1.DeliveryAttemptValidationService");
    const invoke2: Unary<notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest, notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionResponse> =
      (input, done) => client2.explainDeliveryAttemptDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest, notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionResponse>(invoke2, request2);
    const request3 = mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.fromPartial({
      context: req?.context,
      rendition: { audit: { etag: (req?.transcodeJob?.audit?.etag ?? "") } },
    });
    const invoke3: Unary<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse> =
      (input, done) => this.mediaRenditionCalculationClient.recalculateRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportResponse.fromPartial({
        outcome: {
          nextSteps: (reply2?.outcome?.nextSteps ?? []),
          referenceId: (reply2?.outcome?.referenceId ?? ""),
        },
      }),
      mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        transcodeJob: {
          assignee: { displayName: (reply3?.rendition?.owner?.displayName ?? "") },
        },
      }),
      mediaTranscodeJobImportServiceApi.ValidateTranscodeJobImportResponse.fromPartial({
        transcodeJob: {
          status: req?.transcodeJob?.status,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }
}
