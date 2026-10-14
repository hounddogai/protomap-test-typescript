/**
 * Builds and schedules reports about transcode jobs. Remote work stays behind typed client ports.
 */

import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as experimentsVariantApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import * as formsFormSubmissionApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_approval_service.js";
import * as localizationTranslationKeyServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetReportingServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_reporting_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as mediaTranscodeJobReportingServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_reporting_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
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
import { MediaRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate transcode job operations and persist audit data.
 */
@injectable()
export class TranscodeJobReportingWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantApprovalService") private readonly experimentsVariantApprovalClient: experimentsVariantApprovalServiceApi.VariantApprovalServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionApprovalService") private readonly formsFormSubmissionApprovalClient: formsFormSubmissionApprovalServiceApi.FormSubmissionApprovalServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyService") private readonly localizationTranslationKeyClient: localizationTranslationKeyServiceApi.TranslationKeyServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetReportingService") private readonly mediaMediaAssetReportingClient: mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobCalculationService") private readonly mediaTranscodeJobCalculationClient: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobSyncService") private readonly mediaTranscodeJobSyncClient: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts transcode jobs by status.
   */
  async countTranscodeJobTotals(req: mediaTranscodeJobReportingServiceApi.CountTranscodeJobTotalsRequest): Promise<mediaTranscodeJobReportingServiceApi.CountTranscodeJobTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountTranscodeJobTotals", req);
    this.logger.info("count_transcode_job_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.QuoteCustomerSegmentRequest",
      value: Buffer.from(customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest.encode(request1).finish()),
    });
    const unpacked1 = customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest.decode(envelope1.value);
    const invoke1: Unary<customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.quoteCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentResponse>(invoke1, unpacked1);
    const request2 = mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        origin: { $case: "customer", customer: { displayName: (reply1?.customerSegment?.owner?.displayName ?? "") } },
        requester: { email: (reply1?.customerSegment?.owner?.email ?? "") },
      },
    });
    const client2 = this.clients.get<mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient>("acme.media.v1.TranscodeJobSyncService");
    const invoke2: Unary<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse> =
      (input, done) => client2.reconcileTranscodeJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse>(invoke2, request2);
    const request3 = localizationTranslationKeyServiceApi.BatchCreateTranslationKeysRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply3 = await upload<localizationTranslationKeyServiceApi.BatchCreateTranslationKeysRequest, localizationTranslationKeyServiceApi.BatchCreateTranslationKeysResponse>(
      (done) => this.localizationTranslationKeyClient.batchCreateTranslationKeys(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      mediaTranscodeJobReportingServiceApi.CountTranscodeJobTotalsResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      mediaTranscodeJobReportingServiceApi.CountTranscodeJobTotalsResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a transcode job.
   */
  async fetchTranscodeJobReport(req: mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportRequest): Promise<mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchTranscodeJobReport", req);
    this.logger.info("fetch_transcode_job_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      consentRecord: {
        correlationId: (req?.transcodeJobId ?? ""),
        measurements: [{ observedAt: req?.context?.deadline }],
        source: (req?.context?.actor?.userId ?? ""),
      },
      context: req?.context,
    });
    const invoke1: Unary<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.recalculateConsentRecords(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest.fromPartial({
      context: req?.context,
      details: { currencyCode: (reply1?.breakdown?.currencyCode ?? "") },
      preference: {
        owner: {
          displayName: (reply1?.consentRecord?.subject?.displayName ?? ""),
          email: (req?.context?.actor?.email ?? ""),
        },
      },
    });
    const invoke2: Unary<customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest, customersPreferenceCalculationServiceApi.ComparePreferenceOptionsResponse> =
      (input, done) => this.customersPreferenceCalculationClient.comparePreferenceOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest, customersPreferenceCalculationServiceApi.ComparePreferenceOptionsResponse>(invoke2, request2));
    return mergeResponses(
      mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportResponse.fromPartial({
        transcodeJob: { requester: { email: (reply2?.preference?.owner?.email ?? "") } },
      }),
      mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportResponse.fromPartial({ transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") } }),
    );
  }

  /**
   * Generates a transcode job.
   */
  async generateTranscodeJobReport(req: mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportRequest): Promise<mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateTranscodeJobReport", req);
    this.logger.info("generate_transcode_job_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionApprovalServiceApi.RejectFormSubmissionRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { approver: { email: (req?.context?.actor?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<formsFormSubmissionApprovalServiceApi.RejectFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RejectFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionApprovalClient.rejectFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("GenerateTranscodeJobReport.RejectFormSubmission", () => call<formsFormSubmissionApprovalServiceApi.RejectFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RejectFormSubmissionResponse>(invoke1, request1));
    const request2 = mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest.fromPartial({
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
        format: (req?.details?.format ?? ""),
        recipientEmails: (req?.details?.recipientEmails ?? []).map((value) => value),
      },
    });
    const invoke2: Unary<mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse> =
      (input, done) => this.mediaMediaAssetReportingClient.scheduleMediaAssetReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      mediaAsset: {
        owner: { displayName: (reply1?.formSubmission?.subject?.displayName ?? "") },
      },
      reason: (req?.reason ?? ""),
    });
    const reply3 = await this.workQueue.enqueue<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>(
      "acme.media.v1.TranscodeJobReportingService/GenerateTranscodeJobReport:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists transcode jobs a page at a time.
   */
  async listTranscodeJobReports(req: mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest): Promise<mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListTranscodeJobReports", req);
    this.logger.info("list_transcode_job_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.context?.actor?.userId ?? "") } },
      subscription: { owner: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.delegateSubscriptionApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } });
  }

  /**
   * Schedules a transcode job.
   */
  async scheduleTranscodeJobReport(req: mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportRequest): Promise<mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleTranscodeJobReport", req);
    this.logger.info("schedule_transcode_job_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantApprovalServiceApi.CommentVariantApprovalRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<experimentsVariantApprovalServiceApi.CommentVariantApprovalRequest, experimentsVariantApprovalServiceApi.CommentVariantApprovalResponse> =
      (input, done) => this.experimentsVariantApprovalClient.commentVariantApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsVariantApprovalServiceApi.CommentVariantApprovalResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = notificationsSubscriptionApprovalServiceApi.RejectSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: {
          createdAt: reply1?.variant?.audit?.createdAt,
          updatedBy: (reply1?.variant?.audit?.updatedBy ?? ""),
        },
        action: { $case: "block", block: {
          reason: ((reply1?.variant?.action?.$case === "block" ? reply1?.variant?.action.block : undefined)?.reason ?? ""),
        } },
      },
    });
    const invoke2: Unary<notificationsSubscriptionApprovalServiceApi.RejectSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RejectSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.rejectSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Streams the changes of transcode jobs as they happen.
   */
  async streamTranscodeJobMetrics(req: mediaTranscodeJobReportingServiceApi.StreamTranscodeJobMetricsRequest): Promise<mediaTranscodeJobReportingServiceApi.StreamTranscodeJobMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamTranscodeJobMetrics", req);
    this.logger.info("stream_transcode_job_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerQueryServiceApi.SummarizeCustomersRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<customersCustomerQueryServiceApi.SummarizeCustomersRequest, customersCustomerQueryServiceApi.SummarizeCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient.summarizeCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.subscriber?.email ?? "") } },
      transcodeJob: {
        requester: {
          name: req?.subscriber?.name,
          phone: (req?.subscriber?.phone ?? ""),
          preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
        },
      },
    });
    const method2 = "explainTranscodeJobCalculation" as const;
    const invoke2: Unary<mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationRequest, mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationResponse> =
      (input, done) => this.mediaTranscodeJobCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationRequest, mediaTranscodeJobCalculationServiceApi.ExplainTranscodeJobCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.filter?.region ?? "") });
    return mergeResponses(
      mediaTranscodeJobReportingServiceApi.StreamTranscodeJobMetricsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      mediaTranscodeJobReportingServiceApi.StreamTranscodeJobMetricsResponse.fromPartial({
        transcodeJob: {
          assignee: {
            email: ((reply2?.transcodeJob?.origin?.$case === "customer" ? reply2?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
          },
          requester: { email: (reply2?.transcodeJob?.requester?.email ?? "") },
        },
      }),
      mediaTranscodeJobReportingServiceApi.StreamTranscodeJobMetricsResponse.fromPartial({
        transcodeJob: {
          requester: {
            name: req?.subscriber?.name,
            preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
          },
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for TranscodeJobReportingService; workflows own validation and database transactions.
 */
@injectable()
export class TranscodeJobReportingHandler {
  constructor(@inject(TranscodeJobReportingWorkflow) private readonly workflow: TranscodeJobReportingWorkflow) {}

  /**
   * Counts transcode jobs by status.
   */
  countTranscodeJobTotals = unary<mediaTranscodeJobReportingServiceApi.CountTranscodeJobTotalsRequest, mediaTranscodeJobReportingServiceApi.CountTranscodeJobTotalsResponse>(
    (request) => this.workflow.countTranscodeJobTotals(request),
  );

  /**
   * Returns a transcode job.
   */
  fetchTranscodeJobReport = unary<mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportResponse>(
    (request) => this.workflow.fetchTranscodeJobReport(request),
  );

  /**
   * Generates a transcode job.
   */
  generateTranscodeJobReport = (call: ServerUnaryCall<mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportResponse>, done: sendUnaryData<mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportResponse>): void => {
    void this.workflow.generateTranscodeJobReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists transcode jobs a page at a time.
   */
  listTranscodeJobReports = unary<mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest, mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsResponse>(
    (request) => this.workflow.listTranscodeJobReports(request),
  );

  /**
   * Schedules a transcode job.
   */
  scheduleTranscodeJobReport = unary<mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.ScheduleTranscodeJobReportResponse>(
    (request) => this.workflow.scheduleTranscodeJobReport(request),
  );

  /**
   * Streams the changes of transcode jobs as they happen.
   */
  streamTranscodeJobMetrics = serverStream<mediaTranscodeJobReportingServiceApi.StreamTranscodeJobMetricsRequest, mediaTranscodeJobReportingServiceApi.StreamTranscodeJobMetricsResponse>(
    (request) => this.workflow.streamTranscodeJobMetrics(request),
  );
}

export function implementation(handler: TranscodeJobReportingHandler): mediaTranscodeJobReportingServiceApi.TranscodeJobReportingServiceServer {
  return {
    countTranscodeJobTotals: handler.countTranscodeJobTotals,
    fetchTranscodeJobReport: handler.fetchTranscodeJobReport,
    generateTranscodeJobReport: handler.generateTranscodeJobReport,
    listTranscodeJobReports: handler.listTranscodeJobReports,
    scheduleTranscodeJobReport: handler.scheduleTranscodeJobReport,
    streamTranscodeJobMetrics: handler.streamTranscodeJobMetrics,
  };
}
