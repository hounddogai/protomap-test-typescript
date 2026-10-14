/**
 * Builds and schedules reports about exposures. Remote work stays behind typed client ports.
 */

import * as communityForumApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as experimentsExperimentServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsExposureImportServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as searchSearchIndexServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_service.js";
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
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { ExperimentsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate exposure operations and persist audit data.
 */
@injectable()
export class ExposureReportingWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantQueryService") private readonly experimentsVariantQueryClient: experimentsVariantQueryServiceApi.VariantQueryServiceClient,
    @inject("grpc:acme.experiments.v1.VariantValidationService") private readonly experimentsVariantValidationClient: experimentsVariantValidationServiceApi.VariantValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileApprovalService") private readonly personalizationProfileApprovalClient: personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexService") private readonly searchSearchIndexClient: searchSearchIndexServiceApi.SearchIndexServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts exposures by status.
   */
  async countExposureTotals(req: experimentsExposureReportingServiceApi.CountExposureTotalsRequest): Promise<experimentsExposureReportingServiceApi.CountExposureTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountExposureTotals", req);
    this.logger.info("count_exposure_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExposureReportingServiceApi.CountExposureTotalsResponse.fromPartial({});
  }

  /**
   * Returns an exposure.
   */
  async fetchExposureReport(req: experimentsExposureReportingServiceApi.FetchExposureReportRequest): Promise<experimentsExposureReportingServiceApi.FetchExposureReportResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchExposureReport", req);
    this.logger.info("fetch_exposure_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = experimentsExposureImportServiceApi.ValidateExposureImportRequest.fromPartial({
      context: input1?.context,
      details: {
        contact: { email: (input1?.context?.actor?.email ?? "") },
        locale: (input1?.context?.locale ?? ""),
      },
      exposure: {
        exposureId: (input1?.exposureId ?? ""),
        subject: { startsAt: input1?.context?.deadline },
      },
    });
    const invoke1: Unary<experimentsExposureImportServiceApi.ValidateExposureImportRequest, experimentsExposureImportServiceApi.ValidateExposureImportResponse> =
      (input, done) => this.experimentsExposureImportClient.validateExposureImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureImportServiceApi.ValidateExposureImportRequest, experimentsExposureImportServiceApi.ValidateExposureImportResponse>(invoke1, request1);
    return mergeResponses(
      experimentsExposureReportingServiceApi.FetchExposureReportResponse.fromPartial({ exposure: { occurredAt: reply1?.exposure?.occurredAt } }),
      experimentsExposureReportingServiceApi.FetchExposureReportResponse.fromPartial({ exposure: { exposureId: (req?.exposureId ?? "") } }),
    );
  }

  /**
   * Generates an exposure.
   */
  async generateExposureReport(req: experimentsExposureReportingServiceApi.GenerateExposureReportRequest): Promise<experimentsExposureReportingServiceApi.GenerateExposureReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateExposureReport", req);
    this.logger.info("generate_exposure_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantQueryServiceApi.FindVariantsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.exposureId ?? ""),
      },
    });
    const cloned1: experimentsVariantQueryServiceApi.FindVariantsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<experimentsVariantQueryServiceApi.FindVariantsRequest, experimentsVariantQueryServiceApi.FindVariantsResponse> =
      (input, done) => this.experimentsVariantQueryClient.findVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantQueryServiceApi.FindVariantsRequest, experimentsVariantQueryServiceApi.FindVariantsResponse>(invoke1, cloned1);
    const request2 = experimentsVariantValidationServiceApi.LintVariantsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
      reason: (req?.reason ?? ""),
      variant: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const decoded2 = experimentsVariantValidationServiceApi.LintVariantsRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsVariantValidationServiceApi.LintVariantsRequest.toJSON(request2))),
    );
    const invoke2: Unary<experimentsVariantValidationServiceApi.LintVariantsRequest, experimentsVariantValidationServiceApi.LintVariantsResponse> =
      (input, done) => this.experimentsVariantValidationClient.lintVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantValidationServiceApi.LintVariantsRequest, experimentsVariantValidationServiceApi.LintVariantsResponse>(invoke2, decoded2);
    const request3 = experimentsExposureValidationServiceApi.NormalizeExposureRequest.fromPartial({
      context: req?.context,
      exposure: { subject: { displayName: (reply2?.variant?.owner?.displayName ?? "") } },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.NormalizeExposureRequest",
      value: Buffer.from(experimentsExposureValidationServiceApi.NormalizeExposureRequest.encode(request3).finish()),
    });
    const unpacked3 = experimentsExposureValidationServiceApi.NormalizeExposureRequest.decode(envelope3.value);
    const invoke3: Unary<experimentsExposureValidationServiceApi.NormalizeExposureRequest, experimentsExposureValidationServiceApi.NormalizeExposureResponse> =
      (input, done) => this.experimentsExposureValidationClient.normalizeExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureValidationServiceApi.NormalizeExposureRequest, experimentsExposureValidationServiceApi.NormalizeExposureResponse>(invoke3, unpacked3);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      experimentsExposureReportingServiceApi.GenerateExposureReportResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      experimentsExposureReportingServiceApi.GenerateExposureReportResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      experimentsExposureReportingServiceApi.GenerateExposureReportResponse.fromPartial({ result: { correlationId: (reply3?.exposure?.correlationId ?? "") } }),
      experimentsExposureReportingServiceApi.GenerateExposureReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists exposures a page at a time.
   */
  async listExposureReports(req: experimentsExposureReportingServiceApi.ListExposureReportsRequest): Promise<experimentsExposureReportingServiceApi.ListExposureReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListExposureReports", req);
    this.logger.info("list_exposure_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExposureReportingServiceApi.ListExposureReportsResponse.fromPartial({});
  }

  /**
   * Schedules an exposure.
   */
  async scheduleExposureReport(req: experimentsExposureReportingServiceApi.ScheduleExposureReportRequest): Promise<experimentsExposureReportingServiceApi.ScheduleExposureReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleExposureReport", req);
    this.logger.info("schedule_exposure_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentServiceApi.UpdateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        organizer: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        window: req?.details?.period,
      },
    });
    const client1 = this.clients.get<experimentsExperimentServiceApi.ExperimentServiceClient>("acme.experiments.v1.ExperimentService");
    const invoke1: Unary<experimentsExperimentServiceApi.UpdateExperimentRequest, experimentsExperimentServiceApi.UpdateExperimentResponse> =
      (input, done) => client1.updateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentServiceApi.UpdateExperimentRequest, experimentsExperimentServiceApi.UpdateExperimentResponse>(invoke1, request1);
    const request2 = experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (reply1?.experiment?.location?.countryCode ?? ""),
          lines: (reply1?.experiment?.location?.lines ?? []).map((value) => value),
          locality: (reply1?.experiment?.location?.locality ?? ""),
          postalCode: (reply1?.experiment?.location?.postalCode ?? ""),
        },
      },
    });
    const invoke2: Unary<experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest, experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse> =
      (input, done) => this.experimentsExposureCalculationClient.compareExposureOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest, experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      subscription: {
        owner: {
          displayName: (reply1?.experiment?.organizer?.displayName ?? ""),
          email: (reply1?.experiment?.organizer?.email ?? ""),
        },
      },
    });
    const invoke3: Unary<notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.retrySubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse>(invoke3, request3));
    let selected4_1: string | undefined;
    switch (reply3?.subscription?.action?.$case) {
      case "block":
        selected4_1 = ((reply3?.subscription?.action?.$case === "block" ? reply3?.subscription?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      reason: (selected4_1 ?? ""),
    });
    const invoke4: Unary<notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.summarizeNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureReportingServiceApi.ScheduleExposureReportResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      experimentsExposureReportingServiceApi.ScheduleExposureReportResponse.fromPartial({ result: { correlationId: (reply2?.exposure?.correlationId ?? "") } }),
      experimentsExposureReportingServiceApi.ScheduleExposureReportResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      experimentsExposureReportingServiceApi.ScheduleExposureReportResponse.fromPartial({
        period: reply4?.period,
        result: { referenceIds: (reply4?.result?.referenceIds ?? []) },
      }),
    );
  }

  /**
   * Shares an exposure.
   */
  async shareExposureReport(req: experimentsExposureReportingServiceApi.ShareExposureReportRequest): Promise<experimentsExposureReportingServiceApi.ShareExposureReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareExposureReport", req);
    this.logger.info("share_exposure_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileApprovalServiceApi.SubmitProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        contact: {
          email: (req?.details?.recipient?.email ?? ""),
          preferredChannel: (req?.details?.recipient?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationProfileApprovalServiceApi.SubmitProfileRequest, personalizationProfileApprovalServiceApi.SubmitProfileResponse> =
      (input, done) => this.personalizationProfileApprovalClient.submitProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = communityForumApprovalServiceApi.ListPendingForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.profile?.audit?.updatedAt,
        region: (reply1?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse>(
      "acme.experiments.v1.ExposureReportingService/ShareExposureReport:1", request2,
    );
    const request3 = experimentsExperimentServiceApi.UpdateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{
          contact: { preferredChannel: (reply1?.profile?.contact?.preferredChannel ?? "") },
        }],
      },
    });
    const invoke3: Unary<experimentsExperimentServiceApi.UpdateExperimentRequest, experimentsExperimentServiceApi.UpdateExperimentResponse> =
      (input, done) => this.experimentsExperimentClient.updateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<experimentsExperimentServiceApi.UpdateExperimentRequest, experimentsExperimentServiceApi.UpdateExperimentResponse>(invoke3, request3));
    const request4 = experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (reply1?.profile?.primaryAddress?.countryCode ?? ""),
          lines: (reply3?.experiment?.location?.lines ?? []).map((value) => value),
          locality: (reply3?.experiment?.location?.locality ?? ""),
        },
      },
    });
    const invoke4: Unary<experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest, experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse> =
      (input, done) => this.experimentsVariantCalculationClient.compareVariantOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureReportingServiceApi.ShareExposureReportResponse.fromPartial({
        exposure: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      experimentsExposureReportingServiceApi.ShareExposureReportResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      experimentsExposureReportingServiceApi.ShareExposureReportResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      experimentsExposureReportingServiceApi.ShareExposureReportResponse.fromPartial({ exposure: { correlationId: (reply4?.result?.correlationId ?? "") } }),
      experimentsExposureReportingServiceApi.ShareExposureReportResponse.fromPartial({ exposure: { exposureId: (req?.exposureId ?? "") } }),
    );
  }

  /**
   * Streams the changes of exposures as they happen.
   */
  async streamExposureMetrics(req: experimentsExposureReportingServiceApi.StreamExposureMetricsRequest): Promise<experimentsExposureReportingServiceApi.StreamExposureMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamExposureMetrics", req);
    this.logger.info("stream_exposure_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexServiceApi.BatchGetSearchIndexesRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<searchSearchIndexServiceApi.BatchGetSearchIndexesRequest, searchSearchIndexServiceApi.BatchGetSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexClient.batchGetSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.subscriber?.name } },
    });
    const invoke2: Unary<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest, experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse> =
      (input, done) => this.experimentsExperimentValidationClient.explainExperimentDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = experimentsExposureSyncServiceApi.SyncExposuresRequest.fromPartial({
      context: req?.context,
      exposure: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (reply2?.experiment?.organizer?.displayName ?? "") },
      },
    });
    const method3 = "syncExposures" as const;
    const invoke3: Unary<experimentsExposureSyncServiceApi.SyncExposuresRequest, experimentsExposureSyncServiceApi.SyncExposuresResponse> =
      (input, done) => this.experimentsExposureSyncClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureSyncServiceApi.SyncExposuresRequest, experimentsExposureSyncServiceApi.SyncExposuresResponse>(invoke3, request3);
    const request4 = experimentsVariantQueryServiceApi.CountVariantsRequest.fromPartial({
      context: req?.context,
      filter: {
        ownerId: (req?.filter?.ownerId ?? ""),
        region: (reply2?.experiment?.location?.region ?? ""),
      },
    });
    const proxy4 = forwarding(this.experimentsVariantQueryClient);
    const invoke4: Unary<experimentsVariantQueryServiceApi.CountVariantsRequest, experimentsVariantQueryServiceApi.CountVariantsResponse> =
      (input, done) => proxy4.countVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsVariantQueryServiceApi.CountVariantsRequest, experimentsVariantQueryServiceApi.CountVariantsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      experimentsExposureReportingServiceApi.StreamExposureMetricsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      experimentsExposureReportingServiceApi.StreamExposureMetricsResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      experimentsExposureReportingServiceApi.StreamExposureMetricsResponse.fromPartial({ sequence: (reply3?.exposure?.sequence ?? 0) }),
      experimentsExposureReportingServiceApi.StreamExposureMetricsResponse.fromPartial({
        result: {
          message: (reply4?.result?.message ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
    );
  }
}
