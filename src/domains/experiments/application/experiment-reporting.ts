/**
 * Builds and schedules reports about experiments. Remote work stays behind typed client ports.
 */

import * as budgetingBudgetServiceApi from "../../../../.cache/proto/acme/budgeting/v1/budget_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExperimentReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as showsShowCalculationServiceApi from "../../../../.cache/proto/acme/shows/v1/show_calculation_service.js";
import * as venuesVenueServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate experiment operations and persist audit data.
 */
@injectable()
export class ExperimentReportingWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.budgeting.v1.BudgetService") private readonly budgetingBudgetClient: budgetingBudgetServiceApi.BudgetServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantQueryService") private readonly experimentsVariantQueryClient: experimentsVariantQueryServiceApi.VariantQueryServiceClient,
    @inject("grpc:acme.experiments.v1.VariantValidationService") private readonly experimentsVariantValidationClient: experimentsVariantValidationServiceApi.VariantValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.shows.v1.ShowCalculationService") private readonly showsShowCalculationClient: showsShowCalculationServiceApi.ShowCalculationServiceClient,
    @inject("grpc:acme.venues.v1.VenueService") private readonly venuesVenueClient: venuesVenueServiceApi.VenueServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts experiments by status.
   */
  async countExperimentTotals(req: experimentsExperimentReportingServiceApi.CountExperimentTotalsRequest): Promise<experimentsExperimentReportingServiceApi.CountExperimentTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountExperimentTotals", req);
    this.logger.info("count_experiment_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantQueryServiceApi.FindVariantsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        region: (req?.filter?.region ?? ""),
      },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke1: Unary<experimentsVariantQueryServiceApi.FindVariantsRequest, experimentsVariantQueryServiceApi.FindVariantsResponse> =
      (input, done) => this.experimentsVariantQueryClient.findVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<experimentsVariantQueryServiceApi.FindVariantsRequest, experimentsVariantQueryServiceApi.FindVariantsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExperimentReportingServiceApi.CountExperimentTotalsResponse.fromPartial({
      result: {
        message: (reply1?.result?.message ?? ""),
        referenceIds: (reply1?.result?.referenceIds ?? []),
      },
    });
  }

  /**
   * Deletes an experiment.
   */
  async deleteExperimentReport(req: experimentsExperimentReportingServiceApi.DeleteExperimentReportRequest): Promise<experimentsExperimentReportingServiceApi.DeleteExperimentReportResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteExperimentReport", req);
    this.logger.info("delete_experiment_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantValidationServiceApi.NormalizeVariantRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse> =
      (input, done) => this.experimentsVariantValidationClient.normalizeVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse>(invoke1, request1));
    const request2 = personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: reply1?.variant?.audit?.updatedAt },
    });
    const invoke2: Unary<personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest, personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse> =
      (input, done) => this.personalizationAffinitySyncClient.listAffinityConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("DeleteExperimentReport.ListAffinityConflicts", () => call<personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest, personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse>(invoke2, request2));
    const request3 = notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.variant?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (reply1?.variant?.variantId ?? ""),
      },
    });
    const invoke3: Unary<notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest, notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.listSubscriptionWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = experimentsExposureValidationServiceApi.LintExposuresRequest.fromPartial({
      context: req?.context,
      exposure: { subject: { displayName: (reply1?.variant?.owner?.displayName ?? "") } },
    });
    const reply4 = await this.workQueue.enqueue<experimentsExposureValidationServiceApi.LintExposuresRequest, experimentsExposureValidationServiceApi.LintExposuresResponse>(
      "acme.experiments.v1.ExperimentReportingService/DeleteExperimentReport:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return mergeResponses(
      experimentsExperimentReportingServiceApi.DeleteExperimentReportResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      experimentsExperimentReportingServiceApi.DeleteExperimentReportResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      experimentsExperimentReportingServiceApi.DeleteExperimentReportResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      experimentsExperimentReportingServiceApi.DeleteExperimentReportResponse.fromPartial({
        result: {
          correlationId: (reply4?.exposure?.correlationId ?? ""),
          status: (reply4?.outcome?.status ?? ""),
        },
      }),
    );
  }

  /**
   * Returns an experiment.
   */
  async fetchExperimentReport(req: experimentsExperimentReportingServiceApi.FetchExperimentReportRequest): Promise<experimentsExperimentReportingServiceApi.FetchExperimentReportResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchExperimentReport", req);
    this.logger.info("fetch_experiment_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    return experimentsExperimentReportingServiceApi.FetchExperimentReportResponse.fromPartial({ experiment: { experimentId: (req?.experimentId ?? "") } });
  }

  /**
   * Generates an experiment.
   */
  async generateExperimentReport(req: experimentsExperimentReportingServiceApi.GenerateExperimentReportRequest): Promise<experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateExperimentReport", req);
    this.logger.info("generate_experiment_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      subscription: { action: { $case: "block", block: { reason: (req?.reason ?? "") } } },
    });
    const invoke1: Unary<notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.retrySubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.RetrySubscriptionWorkflowResponse>(invoke1, request1));
    const request2 = personalizationAffinityReportingServiceApi.ListAffinityReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.subscription?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
      },
    });
    const invoke2: Unary<personalizationAffinityReportingServiceApi.ListAffinityReportsRequest, personalizationAffinityReportingServiceApi.ListAffinityReportsResponse> =
      (input, done) => this.personalizationAffinityReportingClient.listAffinityReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<personalizationAffinityReportingServiceApi.ListAffinityReportsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = venuesVenueServiceApi.CreateVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        audit: {
          createdAt: reply1?.subscription?.audit?.createdAt,
          etag: (reply1?.subscription?.audit?.etag ?? ""),
          updatedAt: reply1?.subscription?.audit?.updatedAt,
        },
        owner: { displayName: (reply1?.subscription?.owner?.displayName ?? "") },
      },
    });
    const invoke3: Unary<venuesVenueServiceApi.CreateVenueRequest, venuesVenueServiceApi.CreateVenueResponse> =
      (input, done) => this.venuesVenueClient.createVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    const request4 = showsShowCalculationServiceApi.SimulateShowRequest.fromPartial({
      context: req?.context,
      show: {
        participants: [{ contact: { email: (reply1?.subscription?.owner?.email ?? "") } }],
      },
    });
    const invoke4: Unary<showsShowCalculationServiceApi.SimulateShowRequest, showsShowCalculationServiceApi.SimulateShowResponse> =
      (input, done) => this.showsShowCalculationClient.simulateShow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke4 = promisify(invoke4);
    const reply4 = requireReply(await asyncInvoke4(request4));
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse.fromPartial({ result: { status: (reply4?.result?.status ?? "") } }),
      experimentsExperimentReportingServiceApi.GenerateExperimentReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists experiments a page at a time.
   */
  async listExperimentReports(req: experimentsExperimentReportingServiceApi.ListExperimentReportsRequest): Promise<experimentsExperimentReportingServiceApi.ListExperimentReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListExperimentReports", req);
    this.logger.info("list_experiment_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExperimentReportingServiceApi.ListExperimentReportsResponse.fromPartial({});
  }

  /**
   * Schedules an experiment.
   */
  async scheduleExperimentReport(req: experimentsExperimentReportingServiceApi.ScheduleExperimentReportRequest): Promise<experimentsExperimentReportingServiceApi.ScheduleExperimentReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleExperimentReport", req);
    this.logger.info("schedule_experiment_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      subscription: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const method1 = "cancelSubscriptionWorkflow" as const;
    const invoke1: Unary<notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      experimentsExperimentReportingServiceApi.ScheduleExperimentReportResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      experimentsExperimentReportingServiceApi.ScheduleExperimentReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares an experiment.
   */
  async shareExperimentReport(req: experimentsExperimentReportingServiceApi.ShareExperimentReportRequest): Promise<experimentsExperimentReportingServiceApi.ShareExperimentReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareExperimentReport", req);
    this.logger.info("share_experiment_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.SimulateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{ contact: { email: (req?.details?.recipient?.email ?? "") } }],
      },
    });
    const proxy1 = forwarding(this.experimentsExperimentCalculationClient);
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.SimulateExperimentRequest, experimentsExperimentCalculationServiceApi.SimulateExperimentResponse> =
      (input, done) => proxy1.simulateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentCalculationServiceApi.SimulateExperimentRequest, experimentsExperimentCalculationServiceApi.SimulateExperimentResponse>(invoke1, request1);
    const request2 = experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest.fromPartial({
      context: req?.context,
      variant: { audit: { createdBy: (reply1?.experiment?.audit?.createdBy ?? "") } },
    });
    const invoke2: Unary<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse> =
      (input, done) => this.experimentsVariantValidationClient.checkVariantEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse>(invoke2, request2);
    const request3 = budgetingBudgetServiceApi.CreateBudgetRequest.fromPartial({
      budget: {
        audit: {
          createdAt: reply1?.experiment?.audit?.createdAt,
          updatedAt: reply2?.variant?.audit?.updatedAt,
        },
        contact: { email: (reply2?.variant?.owner?.email ?? "") },
        limits: [{
          amount: (reply2?.variant?.action?.$case === "discount" ? reply2?.variant?.action.discount : undefined)?.amount,
        }],
      },
      context: req?.context,
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<budgetingBudgetServiceApi.CreateBudgetRequest, budgetingBudgetServiceApi.CreateBudgetResponse> =
      (input, done) => this.budgetingBudgetClient.createBudget(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<budgetingBudgetServiceApi.CreateBudgetRequest, budgetingBudgetServiceApi.CreateBudgetResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentReportingServiceApi.ShareExperimentReportResponse.fromPartial({
        experiment: {
          organizer: { displayName: (reply1?.experiment?.organizer?.displayName ?? "") },
          participants: [{ contact: { email: (reply1?.experiment?.organizer?.email ?? "") } }],
        },
      }),
      experimentsExperimentReportingServiceApi.ShareExperimentReportResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      experimentsExperimentReportingServiceApi.ShareExperimentReportResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      experimentsExperimentReportingServiceApi.ShareExperimentReportResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          organizer: { email: (req?.details?.recipient?.email ?? "") },
        },
      }),
    );
  }

  /**
   * Streams the changes of experiments as they happen.
   */
  async streamExperimentMetrics(req: experimentsExperimentReportingServiceApi.StreamExperimentMetricsRequest): Promise<experimentsExperimentReportingServiceApi.StreamExperimentMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamExperimentMetrics", req);
    this.logger.info("stream_experiment_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = experimentsVariantCalculationServiceApi.RecalculateVariantsRequest.fromPartial({
      context: input1?.context,
      details: { destination: { region: (input1?.filter?.region ?? "") } },
    });
    const invoke1: Unary<experimentsVariantCalculationServiceApi.RecalculateVariantsRequest, experimentsVariantCalculationServiceApi.RecalculateVariantsResponse> =
      (input, done) => this.experimentsVariantCalculationClient.recalculateVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantCalculationServiceApi.RecalculateVariantsRequest, experimentsVariantCalculationServiceApi.RecalculateVariantsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      experimentsExperimentReportingServiceApi.StreamExperimentMetricsResponse.fromPartial({
        experiment: { audit: { createdAt: reply1?.variant?.audit?.createdAt } },
      }),
      experimentsExperimentReportingServiceApi.StreamExperimentMetricsResponse.fromPartial({
        experiment: {
          location: { region: (req?.filter?.region ?? "") },
          organizer: { email: (req?.subscriber?.email ?? "") },
        },
      }),
    );
  }
}
