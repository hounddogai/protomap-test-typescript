/**
 * Answers read-only questions about renditions, for screens and reports. Remote work stays behind typed client ports.
 */

import * as admissionsAdmissionQueryServiceApi from "../../../../.cache/proto/acme/admissions/v1/admission_query_service.js";
import * as formsFormSubmissionQueryServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_query_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetQueryServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_query_service.js";
import * as mediaRenditionQueryServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as prescriptionsPrescriptionCalculationServiceApi from "../../../../.cache/proto/acme/prescriptions/v1/prescription_calculation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { MediaRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate rendition operations and persist audit data.
 */
@injectable()
export class RenditionQueryWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.admissions.v1.AdmissionQueryService") private readonly admissionsAdmissionQueryClient: admissionsAdmissionQueryServiceApi.AdmissionQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionQueryService") private readonly formsFormSubmissionQueryClient: formsFormSubmissionQueryServiceApi.FormSubmissionQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyQueryService") private readonly localizationTranslationKeyQueryClient: localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetQueryService") private readonly mediaMediaAssetQueryClient: mediaMediaAssetQueryServiceApi.MediaAssetQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.prescriptions.v1.PrescriptionCalculationService") private readonly prescriptionsPrescriptionCalculationClient: prescriptionsPrescriptionCalculationServiceApi.PrescriptionCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists renditions a page at a time.
   */
  async browseRenditions(req: mediaRenditionQueryServiceApi.BrowseRenditionsRequest): Promise<mediaRenditionQueryServiceApi.BrowseRenditionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseRenditions", req);
    this.logger.info("browse_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionQueryServiceApi.ExportFormSubmissionsRequest.fromPartial({
      context: req?.context,
      filter: { query: (req?.filter?.query ?? "") },
    });
    const stream1 = this.formsFormSubmissionQueryClient.exportFormSubmissions(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? formsFormSubmissionQueryServiceApi.ExportFormSubmissionsResponse.fromPartial({});
    const request2 = mediaMediaAssetQueryServiceApi.BrowseMediaAssetsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke2: Unary<mediaMediaAssetQueryServiceApi.BrowseMediaAssetsRequest, mediaMediaAssetQueryServiceApi.BrowseMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetQueryClient.browseMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<mediaMediaAssetQueryServiceApi.BrowseMediaAssetsRequest, mediaMediaAssetQueryServiceApi.BrowseMediaAssetsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaRenditionQueryServiceApi.BrowseRenditionsResponse.fromPartial({
      result: {
        correlationId: (reply2?.result?.correlationId ?? ""),
        message: (reply2?.result?.message ?? ""),
      },
    });
  }

  /**
   * Counts renditions by status.
   */
  async countRenditions(req: mediaRenditionQueryServiceApi.CountRenditionsRequest): Promise<mediaRenditionQueryServiceApi.CountRenditionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountRenditions", req);
    this.logger.info("count_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = admissionsAdmissionQueryServiceApi.ResolveAdmissionsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<admissionsAdmissionQueryServiceApi.ResolveAdmissionsRequest, admissionsAdmissionQueryServiceApi.ResolveAdmissionsResponse> =
      (input, done) => this.admissionsAdmissionQueryClient.resolveAdmissions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("CountRenditions.ResolveAdmissions", () => call<admissionsAdmissionQueryServiceApi.ResolveAdmissionsRequest, admissionsAdmissionQueryServiceApi.ResolveAdmissionsResponse>(invoke1, request1));
    const request2 = mediaMediaAssetQueryServiceApi.FindMediaAssetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
      page: {
        pageSize: (req?.page?.pageSize ?? 0),
        pageToken: (req?.page?.pageToken ?? ""),
      },
    });
    const invoke2: Unary<mediaMediaAssetQueryServiceApi.FindMediaAssetsRequest, mediaMediaAssetQueryServiceApi.FindMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetQueryClient.findMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      mediaRenditionQueryServiceApi.CountRenditionsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      mediaRenditionQueryServiceApi.CountRenditionsResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
    );
  }

  /**
   * Streams every matching rendition.
   */
  async exportRenditions(req: mediaRenditionQueryServiceApi.ExportRenditionsRequest): Promise<mediaRenditionQueryServiceApi.ExportRenditionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportRenditions", req);
    this.logger.info("export_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = prescriptionsPrescriptionCalculationServiceApi.QuotePrescriptionRequest.fromPartial({
      context: req?.context,
      prescription: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<prescriptionsPrescriptionCalculationServiceApi.QuotePrescriptionRequest, prescriptionsPrescriptionCalculationServiceApi.QuotePrescriptionResponse>(
      "acme.media.v1.RenditionQueryService/ExportRenditions:0", request1,
    );
    const request2 = mediaMediaAssetQueryServiceApi.ExportMediaAssetsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.prescription?.billingAddress?.region ?? "") },
    });
    const stream2 = this.mediaMediaAssetQueryClient.exportMediaAssets(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? mediaMediaAssetQueryServiceApi.ExportMediaAssetsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mediaRenditionQueryServiceApi.ExportRenditionsResponse.fromPartial({
      rendition: {
        owner: { displayName: (reply1?.prescription?.counterparty?.displayName ?? "") },
      },
    });
  }

  /**
   * Lists renditions a page at a time.
   */
  async findRenditions(req: mediaRenditionQueryServiceApi.FindRenditionsRequest): Promise<mediaRenditionQueryServiceApi.FindRenditionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindRenditions", req);
    this.logger.info("find_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      mediaAsset: {
        audit: { updatedAt: req?.filter?.createdAfter },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.recalculateMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaRenditionQueryServiceApi.FindRenditionsResponse.fromPartial({
      renditions: [{
        audit: { updatedBy: (reply1?.mediaAsset?.audit?.updatedBy ?? "") },
        dimensions: { width: (reply1?.mediaAsset?.dimensions?.width ?? 0) },
      }],
    });
  }

  /**
   * Returns a rendition.
   */
  async lookupRendition(req: mediaRenditionQueryServiceApi.LookupRenditionRequest): Promise<mediaRenditionQueryServiceApi.LookupRenditionResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupRendition", req);
    this.logger.info("lookup_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    return mediaRenditionQueryServiceApi.LookupRenditionResponse.fromPartial({ rendition: { renditionId: (req?.renditionId ?? "") } });
  }

  /**
   * Returns several renditions at once.
   */
  async resolveRenditions(req: mediaRenditionQueryServiceApi.ResolveRenditionsRequest): Promise<mediaRenditionQueryServiceApi.ResolveRenditionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveRenditions", req);
    this.logger.info("resolve_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = prescriptionsPrescriptionCalculationServiceApi.SimulatePrescriptionRequest.fromPartial({
      context: req?.context,
      prescription: {
        audit: { createdAt: req?.context?.deadline },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        }],
      },
    });
    const invoke1: Unary<prescriptionsPrescriptionCalculationServiceApi.SimulatePrescriptionRequest, prescriptionsPrescriptionCalculationServiceApi.SimulatePrescriptionResponse> =
      (input, done) => this.prescriptionsPrescriptionCalculationClient.simulatePrescription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<prescriptionsPrescriptionCalculationServiceApi.SimulatePrescriptionResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.prescription?.audit?.updatedAt,
        region: (reply1?.prescription?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyQueryClient.browseTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    return mergeResponses(
      mediaRenditionQueryServiceApi.ResolveRenditionsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      mediaRenditionQueryServiceApi.ResolveRenditionsResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
    );
  }

  /**
   * Lists renditions a page at a time.
   */
  async suggestRenditions(req: mediaRenditionQueryServiceApi.SuggestRenditionsRequest): Promise<mediaRenditionQueryServiceApi.SuggestRenditionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestRenditions", req);
    this.logger.info("suggest_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = prescriptionsPrescriptionCalculationServiceApi.QuotePrescriptionRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      prescription: {
        audit: { createdAt: req?.filter?.createdAfter },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<prescriptionsPrescriptionCalculationServiceApi.QuotePrescriptionRequest, prescriptionsPrescriptionCalculationServiceApi.QuotePrescriptionResponse> =
      (input, done) => this.prescriptionsPrescriptionCalculationClient.quotePrescription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaRenditionQueryServiceApi.SuggestRenditionsResponse.fromPartial({
      renditions: [{
        audit: { updatedBy: (reply1?.prescription?.audit?.updatedBy ?? "") },
        owner: { email: (reply1?.prescription?.counterparty?.email ?? "") },
      }],
    });
  }

  /**
   * Summarizes a rendition.
   */
  async summarizeRenditions(req: mediaRenditionQueryServiceApi.SummarizeRenditionsRequest): Promise<mediaRenditionQueryServiceApi.SummarizeRenditionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeRenditions", req);
    this.logger.info("summarize_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      notification: { assignee: { email: (req?.context?.actor?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const method1 = "compareNotificationVersions" as const;
    const invoke1: Unary<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse> =
      (input, done) => this.notificationsNotificationHistoryClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse>(invoke1, request1);
    const request2 = mediaMediaAssetQueryServiceApi.CountMediaAssetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.notification?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (reply1?.notification?.assignee?.userId ?? ""),
      },
    });
    const proxy2 = forwarding(this.mediaMediaAssetQueryClient);
    const invoke2: Unary<mediaMediaAssetQueryServiceApi.CountMediaAssetsRequest, mediaMediaAssetQueryServiceApi.CountMediaAssetsResponse> =
      (input, done) => proxy2.countMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetQueryServiceApi.CountMediaAssetsRequest, mediaMediaAssetQueryServiceApi.CountMediaAssetsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      mediaRenditionQueryServiceApi.SummarizeRenditionsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      mediaRenditionQueryServiceApi.SummarizeRenditionsResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      mediaRenditionQueryServiceApi.SummarizeRenditionsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for RenditionQueryService; workflows own validation and database transactions.
 */
@injectable()
export class RenditionQueryHandler {
  constructor(@inject(RenditionQueryWorkflow) private readonly workflow: RenditionQueryWorkflow) {}

  /**
   * Lists renditions a page at a time.
   */
  browseRenditions = unary<mediaRenditionQueryServiceApi.BrowseRenditionsRequest, mediaRenditionQueryServiceApi.BrowseRenditionsResponse>(
    (request) => this.workflow.browseRenditions(request),
  );

  /**
   * Counts renditions by status.
   */
  countRenditions = unary<mediaRenditionQueryServiceApi.CountRenditionsRequest, mediaRenditionQueryServiceApi.CountRenditionsResponse>(
    (request) => this.workflow.countRenditions(request),
  );

  /**
   * Streams every matching rendition.
   */
  exportRenditions = serverStream<mediaRenditionQueryServiceApi.ExportRenditionsRequest, mediaRenditionQueryServiceApi.ExportRenditionsResponse>(
    (request) => this.workflow.exportRenditions(request),
  );

  /**
   * Lists renditions a page at a time.
   */
  findRenditions = unary<mediaRenditionQueryServiceApi.FindRenditionsRequest, mediaRenditionQueryServiceApi.FindRenditionsResponse>(
    (request) => this.workflow.findRenditions(request),
  );

  /**
   * Returns a rendition.
   */
  lookupRendition = unary<mediaRenditionQueryServiceApi.LookupRenditionRequest, mediaRenditionQueryServiceApi.LookupRenditionResponse>(
    (request) => this.workflow.lookupRendition(request),
  );

  /**
   * Returns several renditions at once.
   */
  resolveRenditions = (call: ServerUnaryCall<mediaRenditionQueryServiceApi.ResolveRenditionsRequest, mediaRenditionQueryServiceApi.ResolveRenditionsResponse>, done: sendUnaryData<mediaRenditionQueryServiceApi.ResolveRenditionsResponse>): void => {
    void this.workflow.resolveRenditions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists renditions a page at a time.
   */
  suggestRenditions = unary<mediaRenditionQueryServiceApi.SuggestRenditionsRequest, mediaRenditionQueryServiceApi.SuggestRenditionsResponse>(
    (request) => this.workflow.suggestRenditions(request),
  );

  /**
   * Summarizes a rendition.
   */
  summarizeRenditions = unary<mediaRenditionQueryServiceApi.SummarizeRenditionsRequest, mediaRenditionQueryServiceApi.SummarizeRenditionsResponse>(
    (request) => this.workflow.summarizeRenditions(request),
  );
}

export function implementation(handler: RenditionQueryHandler): mediaRenditionQueryServiceApi.RenditionQueryServiceServer {
  return {
    browseRenditions: handler.browseRenditions,
    countRenditions: handler.countRenditions,
    exportRenditions: handler.exportRenditions,
    findRenditions: handler.findRenditions,
    lookupRendition: handler.lookupRendition,
    resolveRenditions: handler.resolveRenditions,
    suggestRenditions: handler.suggestRenditions,
    summarizeRenditions: handler.summarizeRenditions,
  };
}
