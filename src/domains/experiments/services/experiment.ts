/**
 * Manages experiments: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as experimentsExperimentServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toExperimentRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate experiment operations and persist audit data.
 */
@injectable()
export class ExperimentWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of experiments and answers once at the end.
   */
  async batchCreateExperiments(req: experimentsExperimentServiceApi.BatchCreateExperimentsRequest): Promise<experimentsExperimentServiceApi.BatchCreateExperimentsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateExperiments", req);
    this.logger.info("batch_create_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected1_1 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.preferredChannel ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{ contact: { preferredChannel: (selected1_1 ?? "") } }],
      },
    });
    const invoke1: Unary<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse> =
      (input, done) => this.experimentsExperimentValidationClient.checkExperimentEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>(invoke1, request1);
    const request2 = experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: (req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.name,
        },
      },
    });
    const decoded2 = experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest.toJSON(request2))),
    );
    const invoke2: Unary<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse> =
      (input, done) => this.experimentsExposureCalculationClient.explainExposureCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      experimentsExperimentServiceApi.BatchCreateExperimentsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      experimentsExperimentServiceApi.BatchCreateExperimentsResponse.fromPartial({ result: { correlationId: (reply2?.exposure?.correlationId ?? "") } }),
    );
  }

  /**
   * Returns several experiments at once.
   */
  async batchGetExperiments(req: experimentsExperimentServiceApi.BatchGetExperimentsRequest): Promise<experimentsExperimentServiceApi.BatchGetExperimentsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetExperiments", req);
    this.logger.info("batch_get_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagValidationServiceApi.LintFeatureFlagsRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      featureFlag: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.featureflags.v1.LintFeatureFlagsRequest",
      value: Buffer.from(featureflagsFeatureFlagValidationServiceApi.LintFeatureFlagsRequest.encode(request1).finish()),
    });
    const unpacked1 = featureflagsFeatureFlagValidationServiceApi.LintFeatureFlagsRequest.decode(envelope1.value);
    const invoke1: Unary<featureflagsFeatureFlagValidationServiceApi.LintFeatureFlagsRequest, featureflagsFeatureFlagValidationServiceApi.LintFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.lintFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagValidationServiceApi.LintFeatureFlagsRequest, featureflagsFeatureFlagValidationServiceApi.LintFeatureFlagsResponse>(invoke1, unpacked1);
    return experimentsExperimentServiceApi.BatchGetExperimentsResponse.fromPartial({
      result: {
        referenceIds: (reply1?.result?.referenceIds ?? []),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Creates an experiment.
   */
  async cloneExperiment(req: experimentsExperimentServiceApi.CloneExperimentRequest): Promise<experimentsExperimentServiceApi.CloneExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "CloneExperiment", req);
    this.logger.info("clone_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.experiment?.organizer?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      exposure: {
        subject: {
          displayName: (req?.experiment?.organizer?.displayName ?? ""),
          experimentId: (req?.experiment?.experimentId ?? ""),
        },
      },
    });
    const client1 = this.clients.get<experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient>("acme.experiments.v1.ExposureCalculationService");
    const invoke1: Unary<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse> =
      (input, done) => client1.explainExposureCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse>(invoke1, request1);
    const tasks2: Array<() => Promise<experimentsExperimentValidationServiceApi.PreviewExperimentResponse>> = [];
    for (const item of (req?.experiment?.participants ?? [])) {
      tasks2.push(async () => {
        const request2 = experimentsExperimentValidationServiceApi.PreviewExperimentRequest.fromPartial({
          context: req?.context,
          details: {
            contact: {
              name: item?.contact?.name,
              preferredChannel: (item?.contact?.preferredChannel ?? ""),
            },
          },
          experiment: {
            participants: [{
              contact: { phone: (item?.contact?.phone ?? "") },
              participantId: (item?.participantId ?? ""),
            }],
          },
        });
        const invoke2: Unary<experimentsExperimentValidationServiceApi.PreviewExperimentRequest, experimentsExperimentValidationServiceApi.PreviewExperimentResponse> =
          (input, done) => this.experimentsExperimentValidationClient.previewExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<experimentsExperimentValidationServiceApi.PreviewExperimentRequest, experimentsExperimentValidationServiceApi.PreviewExperimentResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? experimentsExperimentValidationServiceApi.PreviewExperimentResponse.fromPartial({});
    const request3 = experimentsExperimentValidationServiceApi.NormalizeExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        location: { locality: (req?.experiment?.location?.locality ?? "") },
        organizer: { displayName: (reply2?.experiment?.organizer?.displayName ?? "") },
        participants: [{ contact: { email: (reply2?.experiment?.organizer?.email ?? "") } }],
      },
    });
    const invoke3: Unary<experimentsExperimentValidationServiceApi.NormalizeExperimentRequest, experimentsExperimentValidationServiceApi.NormalizeExperimentResponse> =
      (input, done) => this.experimentsExperimentValidationClient.normalizeExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<experimentsExperimentValidationServiceApi.NormalizeExperimentRequest, experimentsExperimentValidationServiceApi.NormalizeExperimentResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      experimentsExperimentServiceApi.CloneExperimentResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      experimentsExperimentServiceApi.CloneExperimentResponse.fromPartial({
        experiment: { organizer: { email: (reply3?.experiment?.organizer?.email ?? "") } },
      }),
      experimentsExperimentServiceApi.CloneExperimentResponse.fromPartial({
        experiment: {
          status: req?.experiment?.status,
          title: (req?.experiment?.title ?? ""),
        },
      }),
    );
  }

  /**
   * Creates an experiment.
   */
  async createExperiment(req: experimentsExperimentServiceApi.CreateExperimentRequest): Promise<experimentsExperimentServiceApi.CreateExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "CreateExperiment", req);
    this.logger.info("create_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.GetExperimentRulesRequest.fromPartial({
      context: req?.context,
      experimentId: (req?.experiment?.experimentId ?? ""),
    });
    const invoke1: Unary<experimentsExperimentValidationServiceApi.GetExperimentRulesRequest, experimentsExperimentValidationServiceApi.GetExperimentRulesResponse> =
      (input, done) => this.experimentsExperimentValidationClient.getExperimentRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<experimentsExperimentValidationServiceApi.GetExperimentRulesRequest, experimentsExperimentValidationServiceApi.GetExperimentRulesResponse>(invoke1, request1));
    const request2 = personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: { audit: { createdBy: (req?.experiment?.audit?.createdBy ?? "") } },
    });
    const invoke2: Unary<personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest, personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.normalizeRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("CreateExperiment.NormalizeRecommendation", () => call<personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest, personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      experimentsExperimentServiceApi.CreateExperimentResponse.fromPartial({
        experiment: {
          audit: { createdBy: (reply1?.experiment?.audit?.createdBy ?? "") },
          experimentId: (reply1?.experiment?.experimentId ?? ""),
        },
      }),
      experimentsExperimentServiceApi.CreateExperimentResponse.fromPartial({
        experiment: {
          organizer: { email: (reply2?.recommendation?.counterparty?.email ?? "") },
        },
      }),
      experimentsExperimentServiceApi.CreateExperimentResponse.fromPartial({
        experiment: {
          metadata: (req?.experiment?.metadata ?? {}),
          title: (req?.experiment?.title ?? ""),
        },
      }),
    );
  }

  /**
   * Returns an experiment.
   */
  async getExperiment(req: experimentsExperimentServiceApi.GetExperimentRequest): Promise<experimentsExperimentServiceApi.GetExperimentResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetExperiment", req);
    this.logger.info("get_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    return experimentsExperimentServiceApi.GetExperimentResponse.fromPartial({ experiment: { experimentId: (req?.experimentId ?? "") } });
  }

  /**
   * Lists experiments a page at a time.
   */
  async listExperiments(req: experimentsExperimentServiceApi.ListExperimentsRequest): Promise<experimentsExperimentServiceApi.ListExperimentsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListExperiments", req);
    this.logger.info("list_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExperimentServiceApi.ListExperimentsResponse.fromPartial({});
  }

  /**
   * Lists experiments a page at a time.
   */
  async searchExperiments(req: experimentsExperimentServiceApi.SearchExperimentsRequest): Promise<experimentsExperimentServiceApi.SearchExperimentsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchExperiments", req);
    this.logger.info("search_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.ScoreExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { updatedAt: req?.filter?.createdAfter },
        location: { region: (req?.filter?.region ?? "") },
        organizer: { userId: (req?.context?.actor?.userId ?? "") },
        participants: [{ contact: { email: (req?.context?.actor?.email ?? "") } }],
      },
    });
    const invoke1: Unary<experimentsExperimentValidationServiceApi.ScoreExperimentRequest, experimentsExperimentValidationServiceApi.ScoreExperimentResponse> =
      (input, done) => this.experimentsExperimentValidationClient.scoreExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExperimentServiceApi.SearchExperimentsResponse.fromPartial({
      experiments: [{ audit: { etag: (reply1?.experiment?.audit?.etag ?? "") } }],
    });
  }

  /**
   * Changes an experiment.
   */
  async updateExperiment(req: experimentsExperimentServiceApi.UpdateExperimentRequest): Promise<experimentsExperimentServiceApi.UpdateExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "UpdateExperiment", req);
    this.logger.info("update_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest.fromPartial({
      context: req?.context,
      experiment: { audit: { createdBy: (req?.experiment?.audit?.createdBy ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>(
      "acme.experiments.v1.ExperimentService/UpdateExperiment:0", request1,
    );
    const request2 = experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest.fromPartial({
      context: req?.context,
      exposure: {
        subject: {
          displayName: (req?.experiment?.organizer?.displayName ?? ""),
          experimentId: (reply1?.experiment?.experimentId ?? ""),
        },
      },
    });
    const invoke2: Unary<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse> =
      (input, done) => this.experimentsExposureValidationClient.explainExposureDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.experiment?.audit?.etag ?? "") });
    return mergeResponses(
      experimentsExperimentServiceApi.UpdateExperimentResponse.fromPartial({
        experiment: { location: { region: (reply1?.experiment?.location?.region ?? "") } },
      }),
      experimentsExperimentServiceApi.UpdateExperimentResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      experimentsExperimentServiceApi.UpdateExperimentResponse.fromPartial({
        experiment: {
          experimentId: (req?.experiment?.experimentId ?? ""),
          title: (req?.experiment?.title ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of experiments as they happen.
   */
  async watchExperiments(req: experimentsExperimentServiceApi.WatchExperimentsRequest): Promise<experimentsExperimentServiceApi.WatchExperimentsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchExperiments", req);
    this.logger.info("watch_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionWorkflowServiceApi.ResumeSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          phone: (req?.subscriber?.phone ?? ""),
          preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
        },
      },
      subscription: { owner: { email: (req?.subscriber?.email ?? "") } },
    });
    const invoke1: Unary<notificationsSubscriptionWorkflowServiceApi.ResumeSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.ResumeSubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.resumeSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsSubscriptionWorkflowServiceApi.ResumeSubscriptionWorkflowResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.filter?.ownerId ?? "") });
    return mergeResponses(
      experimentsExperimentServiceApi.WatchExperimentsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      experimentsExperimentServiceApi.WatchExperimentsResponse.fromPartial({
        experiment: {
          location: { region: (req?.filter?.region ?? "") },
          organizer: { email: (req?.subscriber?.email ?? "") },
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ExperimentService; workflows own validation and database transactions.
 */
@injectable()
export class ExperimentHandler {
  constructor(@inject(ExperimentWorkflow) private readonly workflow: ExperimentWorkflow) {}

  /**
   * Takes a stream of experiments and answers once at the end.
   */
  batchCreateExperiments = clientStream<experimentsExperimentServiceApi.BatchCreateExperimentsRequest, experimentsExperimentServiceApi.BatchCreateExperimentsResponse>(
    (request) => this.workflow.batchCreateExperiments(request), () => experimentsExperimentServiceApi.BatchCreateExperimentsResponse.fromPartial({}),
  );

  /**
   * Returns several experiments at once.
   */
  batchGetExperiments = unary<experimentsExperimentServiceApi.BatchGetExperimentsRequest, experimentsExperimentServiceApi.BatchGetExperimentsResponse>(
    (request) => this.workflow.batchGetExperiments(request),
  );

  /**
   * Creates an experiment.
   */
  cloneExperiment = (call: ServerUnaryCall<experimentsExperimentServiceApi.CloneExperimentRequest, experimentsExperimentServiceApi.CloneExperimentResponse>, done: sendUnaryData<experimentsExperimentServiceApi.CloneExperimentResponse>): void => {
    void this.workflow.cloneExperiment(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Creates an experiment.
   */
  createExperiment = unary<experimentsExperimentServiceApi.CreateExperimentRequest, experimentsExperimentServiceApi.CreateExperimentResponse>(
    (request) => this.workflow.createExperiment(request),
  );

  /**
   * Returns an experiment.
   */
  getExperiment = unary<experimentsExperimentServiceApi.GetExperimentRequest, experimentsExperimentServiceApi.GetExperimentResponse>(
    (request) => this.workflow.getExperiment(request),
  );

  /**
   * Lists experiments a page at a time.
   */
  listExperiments = (call: ServerUnaryCall<experimentsExperimentServiceApi.ListExperimentsRequest, experimentsExperimentServiceApi.ListExperimentsResponse>, done: sendUnaryData<experimentsExperimentServiceApi.ListExperimentsResponse>): void => {
    void this.workflow.listExperiments(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists experiments a page at a time.
   */
  searchExperiments = unary<experimentsExperimentServiceApi.SearchExperimentsRequest, experimentsExperimentServiceApi.SearchExperimentsResponse>(
    (request) => this.workflow.searchExperiments(request),
  );

  /**
   * Changes an experiment.
   */
  updateExperiment = unary<experimentsExperimentServiceApi.UpdateExperimentRequest, experimentsExperimentServiceApi.UpdateExperimentResponse>(
    (request) => this.workflow.updateExperiment(request),
  );

  /**
   * Streams the changes of experiments as they happen.
   */
  watchExperiments = serverStream<experimentsExperimentServiceApi.WatchExperimentsRequest, experimentsExperimentServiceApi.WatchExperimentsResponse>(
    (request) => this.workflow.watchExperiments(request),
  );
}

export function implementation(handler: ExperimentHandler): experimentsExperimentServiceApi.ExperimentServiceServer {
  return {
    batchCreateExperiments: handler.batchCreateExperiments,
    batchGetExperiments: handler.batchGetExperiments,
    cloneExperiment: handler.cloneExperiment,
    createExperiment: handler.createExperiment,
    getExperiment: handler.getExperiment,
    listExperiments: handler.listExperiments,
    searchExperiments: handler.searchExperiments,
    updateExperiment: handler.updateExperiment,
    watchExperiments: handler.watchExperiments,
  };
}
