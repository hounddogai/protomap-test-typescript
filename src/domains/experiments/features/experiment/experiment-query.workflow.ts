/**
 * Answers read-only questions about experiments, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as experimentsExperimentCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { ExperimentsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate experiment operations and persist audit data.
 */
@injectable()
export class ExperimentQueryWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantValidationService") private readonly experimentsVariantValidationClient: experimentsVariantValidationServiceApi.VariantValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionHistoryService") private readonly notificationsSubscriptionHistoryClient: notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists experiments a page at a time.
   */
  async browseExperiments(req: experimentsExperimentQueryServiceApi.BrowseExperimentsRequest): Promise<experimentsExperimentQueryServiceApi.BrowseExperimentsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseExperiments", req);
    this.logger.info("browse_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExperimentQueryServiceApi.BrowseExperimentsResponse.fromPartial({});
  }

  /**
   * Counts experiments by status.
   */
  async countExperiments(req: experimentsExperimentQueryServiceApi.CountExperimentsRequest): Promise<experimentsExperimentQueryServiceApi.CountExperimentsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountExperiments", req);
    this.logger.info("count_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExperimentQueryServiceApi.CountExperimentsResponse.fromPartial({});
  }

  /**
   * Streams every matching experiment.
   */
  async exportExperiments(req: experimentsExperimentQueryServiceApi.ExportExperimentsRequest): Promise<experimentsExperimentQueryServiceApi.ExportExperimentsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportExperiments", req);
    this.logger.info("export_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantValidationServiceApi.LintVariantsRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      variant: {
        audit: { createdAt: req?.filter?.createdAfter },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<experimentsVariantValidationServiceApi.LintVariantsRequest, experimentsVariantValidationServiceApi.LintVariantsResponse> =
      (input, done) => this.experimentsVariantValidationClient.lintVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantValidationServiceApi.LintVariantsRequest, experimentsVariantValidationServiceApi.LintVariantsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = experimentsExperimentCalculationServiceApi.CalculateExperimentRequest.fromPartial({
      context: input2?.context,
      experiment: {
        audit: {
          updatedAt: reply1?.variant?.audit?.updatedAt,
          updatedBy: (reply1?.variant?.audit?.updatedBy ?? ""),
        },
        organizer: { displayName: (reply1?.variant?.owner?.displayName ?? "") },
        participants: [{ contact: { email: (reply1?.variant?.owner?.email ?? "") } }],
      },
    });
    const invoke2: Unary<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.calculateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      experimentsExperimentQueryServiceApi.ExportExperimentsResponse.fromPartial({
        experiment: { organizer: { userId: (reply1?.variant?.owner?.userId ?? "") } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      experimentsExperimentQueryServiceApi.ExportExperimentsResponse.fromPartial({ experiment: { organizer: reply2?.experiment?.organizer } }),
      experimentsExperimentQueryServiceApi.ExportExperimentsResponse.fromPartial({ experiment: { location: { region: (req?.filter?.region ?? "") } } }),
    );
  }

  /**
   * Lists experiments a page at a time.
   */
  async findExperiments(req: experimentsExperimentQueryServiceApi.FindExperimentsRequest): Promise<experimentsExperimentQueryServiceApi.FindExperimentsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindExperiments", req);
    this.logger.info("find_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest.fromPartial({
      context: req?.context,
      experiment: { location: { region: (req?.filter?.region ?? "") } },
    });
    const cloned1: experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse> =
      (input, done) => this.experimentsExperimentValidationClient.checkExperimentEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExperimentQueryServiceApi.FindExperimentsResponse.fromPartial({ experiments: [{ organizer: reply1?.experiment?.organizer }] });
  }

  /**
   * Returns an experiment.
   */
  async lookupExperiment(req: experimentsExperimentQueryServiceApi.LookupExperimentRequest): Promise<experimentsExperimentQueryServiceApi.LookupExperimentResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupExperiment", req);
    this.logger.info("lookup_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    return experimentsExperimentQueryServiceApi.LookupExperimentResponse.fromPartial({ experiment: { experimentId: (req?.experimentId ?? "") } });
  }

  /**
   * Returns an experiment.
   */
  async peekExperiment(req: experimentsExperimentQueryServiceApi.PeekExperimentRequest): Promise<experimentsExperimentQueryServiceApi.PeekExperimentResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekExperiment", req);
    this.logger.info("peek_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    return experimentsExperimentQueryServiceApi.PeekExperimentResponse.fromPartial({ experiment: { experimentId: (req?.experimentId ?? "") } });
  }

  /**
   * Returns several experiments at once.
   */
  async resolveExperiments(req: experimentsExperimentQueryServiceApi.ResolveExperimentsRequest): Promise<experimentsExperimentQueryServiceApi.ResolveExperimentsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveExperiments", req);
    this.logger.info("resolve_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: { createdAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        scopes: (req?.experimentIds ?? []).map((value) => value),
      },
    });
    const decoded1 = notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest.toJSON(request1))),
    );
    const invoke1: Unary<notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionResponse> =
      (input, done) => this.notificationsSubscriptionHistoryClient.annotateSubscriptionVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionResponse>(invoke1, decoded1);
    return experimentsExperimentQueryServiceApi.ResolveExperimentsResponse.fromPartial({
      result: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        message: (reply1?.outcome?.message ?? ""),
      },
    });
  }

  /**
   * Lists experiments a page at a time.
   */
  async suggestExperiments(req: experimentsExperimentQueryServiceApi.SuggestExperimentsRequest): Promise<experimentsExperimentQueryServiceApi.SuggestExperimentsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestExperiments", req);
    this.logger.info("suggest_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      exposure: { measurements: [{ observedAt: req?.filter?.createdAfter }] },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.ExplainExposureCalculationRequest",
      value: Buffer.from(experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest.encode(request1).finish()),
    });
    const unpacked1 = experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest.decode(envelope1.value);
    const invoke1: Unary<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse> =
      (input, done) => this.experimentsExposureCalculationClient.explainExposureCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExperimentQueryServiceApi.SuggestExperimentsResponse.fromPartial({
      result: {
        message: (reply1?.outcome?.message ?? ""),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Summarizes an experiment.
   */
  async summarizeExperiments(req: experimentsExperimentQueryServiceApi.SummarizeExperimentsRequest): Promise<experimentsExperimentQueryServiceApi.SummarizeExperimentsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeExperiments", req);
    this.logger.info("summarize_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureCalculationServiceApi.SimulateExposureRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      exposure: {
        attributes: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
        subject: { experimentId: (req?.experimentId ?? "") },
      },
      reason: (req?.reason ?? ""),
    });
    const client1 = this.clients.get<experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient>("acme.experiments.v1.ExposureCalculationService");
    const invoke1: Unary<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse> =
      (input, done) => client1.simulateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      experimentsExperimentQueryServiceApi.SummarizeExperimentsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      experimentsExperimentQueryServiceApi.SummarizeExperimentsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
