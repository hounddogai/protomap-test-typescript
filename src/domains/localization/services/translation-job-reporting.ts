/**
 * Builds and schedules reports about translation jobs. Remote work stays behind typed client ports.
 */

import * as assetsFixedAssetCalculationServiceApi from "../../../../.cache/proto/acme/assets/v1/fixed_asset_calculation_service.js";
import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as communityModerationLifecycleServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_lifecycle_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as experimentsExposureImportServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as localizationLocaleQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as pricingPriceListServiceApi from "../../../../.cache/proto/acme/pricing/v1/price_list_service.js";
import * as procurementPurchaseRequisitionServiceApi from "../../../../.cache/proto/acme/procurement/v1/purchase_requisition_service.js";
import * as venuesVenueServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { LocalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation job operations and persist audit data.
 */
@injectable()
export class TranslationJobReportingWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.assets.v1.FixedAssetCalculationService") private readonly assetsFixedAssetCalculationClient: assetsFixedAssetCalculationServiceApi.FixedAssetCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.community.v1.ModerationLifecycleService") private readonly communityModerationLifecycleClient: communityModerationLifecycleServiceApi.ModerationLifecycleServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.localization.v1.LocaleQueryService") private readonly localizationLocaleQueryClient: localizationLocaleQueryServiceApi.LocaleQueryServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyQueryService") private readonly localizationTranslationKeyQueryClient: localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient,
    @inject("grpc:acme.pricing.v1.PriceListService") private readonly pricingPriceListClient: pricingPriceListServiceApi.PriceListServiceClient,
    @inject("grpc:acme.procurement.v1.PurchaseRequisitionService") private readonly procurementPurchaseRequisitionClient: procurementPurchaseRequisitionServiceApi.PurchaseRequisitionServiceClient,
    @inject("grpc:acme.venues.v1.VenueService") private readonly venuesVenueClient: venuesVenueServiceApi.VenueServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts translation jobs by status.
   */
  async countTranslationJobTotals(req: localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsRequest): Promise<localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountTranslationJobTotals", req);
    this.logger.info("count_translation_job_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = pricingPriceListServiceApi.ListPriceListsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        query: (req?.filter?.query ?? ""),
      },
      orderBy: (req?.orderBy ?? ""),
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke1: Unary<pricingPriceListServiceApi.ListPriceListsRequest, pricingPriceListServiceApi.ListPriceListsResponse> =
      (input, done) => this.pricingPriceListClient.listPriceLists(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<pricingPriceListServiceApi.ListPriceListsRequest, pricingPriceListServiceApi.ListPriceListsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.filter?.region ?? "") });
    return localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsResponse.fromPartial({
      result: {
        referenceIds: (reply1?.result?.referenceIds ?? []),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Deletes a translation job.
   */
  async deleteTranslationJobReport(req: localizationTranslationJobReportingServiceApi.DeleteTranslationJobReportRequest): Promise<localizationTranslationJobReportingServiceApi.DeleteTranslationJobReportResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteTranslationJobReport", req);
    this.logger.info("delete_translation_job_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceCalculationServiceApi.EstimatePreferenceRequest.fromPartial({
      context: req?.context,
      preference: { audit: { etag: (req?.etag ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<customersPreferenceCalculationServiceApi.EstimatePreferenceRequest, customersPreferenceCalculationServiceApi.EstimatePreferenceResponse> =
      (input, done) => this.customersPreferenceCalculationClient.estimatePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<customersPreferenceCalculationServiceApi.EstimatePreferenceResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.translationJobId ?? "") });
    return localizationTranslationJobReportingServiceApi.DeleteTranslationJobReportResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } });
  }

  /**
   * Returns a translation job.
   */
  async fetchTranslationJobReport(req: localizationTranslationJobReportingServiceApi.FetchTranslationJobReportRequest): Promise<localizationTranslationJobReportingServiceApi.FetchTranslationJobReportResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchTranslationJobReport", req);
    this.logger.info("fetch_translation_job_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    return localizationTranslationJobReportingServiceApi.FetchTranslationJobReportResponse.fromPartial({ translationJob: { translationJobId: (req?.translationJobId ?? "") } });
  }

  /**
   * Generates a translation job.
   */
  async generateTranslationJobReport(req: localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportRequest): Promise<localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateTranslationJobReport", req);
    this.logger.info("generate_translation_job_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleValidationServiceApi.ScoreLocaleRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      locale: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<localizationLocaleValidationServiceApi.ScoreLocaleRequest, localizationLocaleValidationServiceApi.ScoreLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.scoreLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_2: number | undefined;
    switch (reply1?.locale?.action?.$case) {
      case "discount":
        selected2_2 = ((reply1?.locale?.action?.$case === "discount" ? reply1?.locale?.action.discount : undefined)?.percent ?? 0);
        break;
      default:
        selected2_2 = 0;
    }
    const request2 = pricingPriceListServiceApi.UpdatePriceListRequest.fromPartial({
      context: req?.context,
      priceList: {
        audit: {
          createdAt: reply1?.locale?.audit?.createdAt,
          updatedBy: (reply1?.locale?.audit?.updatedBy ?? ""),
        },
        action: { $case: "discount", discount: { percent: (selected2_2 ?? 0) } },
        owner: { userId: (reply1?.locale?.owner?.userId ?? "") },
      },
    });
    const invoke2: Unary<pricingPriceListServiceApi.UpdatePriceListRequest, pricingPriceListServiceApi.UpdatePriceListResponse> =
      (input, done) => this.pricingPriceListClient.updatePriceList(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<pricingPriceListServiceApi.UpdatePriceListRequest, pricingPriceListServiceApi.UpdatePriceListResponse>(invoke2, request2);
    const request3 = venuesVenueServiceApi.CreateVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        audit: {
          createdAt: reply2?.priceList?.audit?.createdAt,
          createdBy: (reply2?.priceList?.audit?.createdBy ?? ""),
        },
        owner: { userId: (reply2?.priceList?.owner?.userId ?? "") },
      },
    });
    const method3 = "createVenue" as const;
    const invoke3: Unary<venuesVenueServiceApi.CreateVenueRequest, venuesVenueServiceApi.CreateVenueResponse> =
      (input, done) => this.venuesVenueClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<venuesVenueServiceApi.CreateVenueRequest, venuesVenueServiceApi.CreateVenueResponse>(invoke3, request3);
    const request4 = procurementPurchaseRequisitionServiceApi.SearchPurchaseRequisitionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.priceList?.audit?.updatedAt,
        ownerId: (reply3?.venue?.owner?.userId ?? ""),
        region: ((reply3?.venue?.locator?.$case === "address" ? reply3?.venue?.locator.address : undefined)?.region ?? ""),
      },
    });
    const proxy4 = forwarding(this.procurementPurchaseRequisitionClient);
    const invoke4: Unary<procurementPurchaseRequisitionServiceApi.SearchPurchaseRequisitionsRequest, procurementPurchaseRequisitionServiceApi.SearchPurchaseRequisitionsResponse> =
      (input, done) => proxy4.searchPurchaseRequisitions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<procurementPurchaseRequisitionServiceApi.SearchPurchaseRequisitionsRequest, procurementPurchaseRequisitionServiceApi.SearchPurchaseRequisitionsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists translation jobs a page at a time.
   */
  async listTranslationJobReports(req: localizationTranslationJobReportingServiceApi.ListTranslationJobReportsRequest): Promise<localizationTranslationJobReportingServiceApi.ListTranslationJobReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListTranslationJobReports", req);
    this.logger.info("list_translation_job_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.fromPartial({
      context: req?.context,
      customerSegment: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse> =
      (input, done) => this.customersCustomerSegmentValidationClient.lintCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationTranslationJobReportingServiceApi.ListTranslationJobReportsResponse.fromPartial({
      translationJobs: [{ assignee: { email: (reply1?.customerSegment?.owner?.email ?? "") } }],
    });
  }

  /**
   * Schedules a translation job.
   */
  async scheduleTranslationJobReport(req: localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest): Promise<localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleTranslationJobReport", req);
    this.logger.info("schedule_translation_job_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleQueryServiceApi.BrowseLocalesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<localizationLocaleQueryServiceApi.BrowseLocalesRequest, localizationLocaleQueryServiceApi.BrowseLocalesResponse> =
      (input, done) => this.localizationLocaleQueryClient.browseLocales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleQueryServiceApi.BrowseLocalesRequest, localizationLocaleQueryServiceApi.BrowseLocalesResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = communityForumWorkflowServiceApi.ResumeForumWorkflowRequest.fromPartial({
      context: input2?.context,
      forum: {
        children: [{
          children: [{
            manager: {
              email: (input2?.context?.actor?.email ?? ""),
              userId: (input2?.context?.actor?.userId ?? ""),
            },
          }],
        }],
      },
    });
    const invoke2: Unary<communityForumWorkflowServiceApi.ResumeForumWorkflowRequest, communityForumWorkflowServiceApi.ResumeForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.resumeForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumWorkflowServiceApi.ResumeForumWorkflowRequest, communityForumWorkflowServiceApi.ResumeForumWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares a translation job.
   */
  async shareTranslationJobReport(req: localizationTranslationJobReportingServiceApi.ShareTranslationJobReportRequest): Promise<localizationTranslationJobReportingServiceApi.ShareTranslationJobReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareTranslationJobReport", req);
    this.logger.info("share_translation_job_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureImportServiceApi.ListExposureImportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.templateId ?? ""),
      },
    });
    const cloned1: experimentsExposureImportServiceApi.ListExposureImportsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<experimentsExposureImportServiceApi.ListExposureImportsRequest, experimentsExposureImportServiceApi.ListExposureImportsResponse> =
      (input, done) => this.experimentsExposureImportClient.listExposureImports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureImportServiceApi.ListExposureImportsRequest, experimentsExposureImportServiceApi.ListExposureImportsResponse>(invoke1, cloned1);
    const request2 = localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: { requester: { email: (req?.details?.recipient?.email ?? "") } },
    });
    const decoded2 = localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest.fromJSON(
      JSON.parse(JSON.stringify(localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest.toJSON(request2))),
    );
    const invoke2: Unary<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.calculateTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse>(invoke2, decoded2);
    const request3 = localizationTranslationKeyQueryServiceApi.CountTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.translationJob?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
        ownerId: (reply2?.translationJob?.translationJobId ?? ""),
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.CountTranslationKeysRequest",
      value: Buffer.from(localizationTranslationKeyQueryServiceApi.CountTranslationKeysRequest.encode(request3).finish()),
    });
    const unpacked3 = localizationTranslationKeyQueryServiceApi.CountTranslationKeysRequest.decode(envelope3.value);
    const invoke3: Unary<localizationTranslationKeyQueryServiceApi.CountTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.CountTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyQueryClient.countTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationKeyQueryServiceApi.CountTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.CountTranslationKeysResponse>(invoke3, unpacked3);
    const request4 = assetsFixedAssetCalculationServiceApi.RecalculateFixedAssetsRequest.fromPartial({
      context: req?.context,
      fixedAsset: { owner: { email: (reply2?.translationJob?.requester?.email ?? "") } },
    });
    const client4 = this.clients.get<assetsFixedAssetCalculationServiceApi.FixedAssetCalculationServiceClient>("acme.assets.v1.FixedAssetCalculationService");
    const invoke4: Unary<assetsFixedAssetCalculationServiceApi.RecalculateFixedAssetsRequest, assetsFixedAssetCalculationServiceApi.RecalculateFixedAssetsResponse> =
      (input, done) => client4.recalculateFixedAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<assetsFixedAssetCalculationServiceApi.RecalculateFixedAssetsRequest, assetsFixedAssetCalculationServiceApi.RecalculateFixedAssetsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobReportingServiceApi.ShareTranslationJobReportResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      localizationTranslationJobReportingServiceApi.ShareTranslationJobReportResponse.fromPartial({ translationJob: { status: reply2?.translationJob?.status } }),
      localizationTranslationJobReportingServiceApi.ShareTranslationJobReportResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      localizationTranslationJobReportingServiceApi.ShareTranslationJobReportResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      localizationTranslationJobReportingServiceApi.ShareTranslationJobReportResponse.fromPartial({
        translationJob: {
          assignee: { email: (req?.details?.recipient?.email ?? "") },
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of translation jobs as they happen.
   */
  async streamTranslationJobMetrics(req: localizationTranslationJobReportingServiceApi.StreamTranslationJobMetricsRequest): Promise<localizationTranslationJobReportingServiceApi.StreamTranslationJobMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamTranslationJobMetrics", req);
    this.logger.info("stream_translation_job_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          name: req?.subscriber?.name,
          preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest, communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse> =
      (input, done) => this.communityModerationLifecycleClient.scheduleModerationExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest, communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = localizationLocaleValidationServiceApi.ScoreLocaleRequest.fromPartial({
      context: req?.context,
      locale: { audit: { createdBy: (reply1?.moderation?.audit?.createdBy ?? "") } },
    });
    const invoke2: Unary<localizationLocaleValidationServiceApi.ScoreLocaleRequest, localizationLocaleValidationServiceApi.ScoreLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.scoreLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<localizationLocaleValidationServiceApi.ScoreLocaleRequest, localizationLocaleValidationServiceApi.ScoreLocaleResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.subscriber?.phone ?? "") });
    return mergeResponses(
      localizationTranslationJobReportingServiceApi.StreamTranslationJobMetricsResponse.fromPartial({
        translationJob: { comments: [{ createdAt: reply1?.moderation?.audit?.createdAt }] },
      }),
      localizationTranslationJobReportingServiceApi.StreamTranslationJobMetricsResponse.fromPartial({
        translationJob: { audit: { createdBy: (reply2?.locale?.audit?.createdBy ?? "") } },
      }),
      localizationTranslationJobReportingServiceApi.StreamTranslationJobMetricsResponse.fromPartial({
        translationJob: {
          assignee: { email: (req?.subscriber?.email ?? "") },
          requester: { email: (req?.subscriber?.email ?? "") },
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for TranslationJobReportingService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationJobReportingHandler {
  constructor(@inject(TranslationJobReportingWorkflow) private readonly workflow: TranslationJobReportingWorkflow) {}

  /**
   * Counts translation jobs by status.
   */
  countTranslationJobTotals = unary<localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsRequest, localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsResponse>(
    (request) => this.workflow.countTranslationJobTotals(request),
  );

  /**
   * Deletes a translation job.
   */
  deleteTranslationJobReport = unary<localizationTranslationJobReportingServiceApi.DeleteTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.DeleteTranslationJobReportResponse>(
    (request) => this.workflow.deleteTranslationJobReport(request),
  );

  /**
   * Returns a translation job.
   */
  fetchTranslationJobReport = (call: ServerUnaryCall<localizationTranslationJobReportingServiceApi.FetchTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.FetchTranslationJobReportResponse>, done: sendUnaryData<localizationTranslationJobReportingServiceApi.FetchTranslationJobReportResponse>): void => {
    void this.workflow.fetchTranslationJobReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Generates a translation job.
   */
  generateTranslationJobReport = unary<localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.GenerateTranslationJobReportResponse>(
    (request) => this.workflow.generateTranslationJobReport(request),
  );

  /**
   * Lists translation jobs a page at a time.
   */
  listTranslationJobReports = unary<localizationTranslationJobReportingServiceApi.ListTranslationJobReportsRequest, localizationTranslationJobReportingServiceApi.ListTranslationJobReportsResponse>(
    (request) => this.workflow.listTranslationJobReports(request),
  );

  /**
   * Schedules a translation job.
   */
  scheduleTranslationJobReport = (call: ServerUnaryCall<localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse>, done: sendUnaryData<localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse>): void => {
    void this.workflow.scheduleTranslationJobReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Shares a translation job.
   */
  shareTranslationJobReport = unary<localizationTranslationJobReportingServiceApi.ShareTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ShareTranslationJobReportResponse>(
    (request) => this.workflow.shareTranslationJobReport(request),
  );

  /**
   * Streams the changes of translation jobs as they happen.
   */
  streamTranslationJobMetrics = serverStream<localizationTranslationJobReportingServiceApi.StreamTranslationJobMetricsRequest, localizationTranslationJobReportingServiceApi.StreamTranslationJobMetricsResponse>(
    (request) => this.workflow.streamTranslationJobMetrics(request),
  );
}

export function implementation(handler: TranslationJobReportingHandler): localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceServer {
  return {
    countTranslationJobTotals: handler.countTranslationJobTotals,
    deleteTranslationJobReport: handler.deleteTranslationJobReport,
    fetchTranslationJobReport: handler.fetchTranslationJobReport,
    generateTranslationJobReport: handler.generateTranslationJobReport,
    listTranslationJobReports: handler.listTranslationJobReports,
    scheduleTranslationJobReport: handler.scheduleTranslationJobReport,
    shareTranslationJobReport: handler.shareTranslationJobReport,
    streamTranslationJobMetrics: handler.streamTranslationJobMetrics,
  };
}
