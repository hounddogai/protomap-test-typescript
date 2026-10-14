/**
 * Moves an experiment between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as experimentsExperimentLifecycleServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_lifecycle_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as experimentsVariantReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as personalizationAffinityWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_workflow_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
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
import { toExperimentRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate experiment operations and persist audit data.
 */
@injectable()
export class ExperimentLifecycleWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentQueryService") private readonly experimentsExperimentQueryClient: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantReportingService") private readonly experimentsVariantReportingClient: experimentsVariantReportingServiceApi.VariantReportingServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityWorkflowService") private readonly personalizationAffinityWorkflowClient: personalizationAffinityWorkflowServiceApi.AffinityWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates an experiment.
   */
  async activateExperiment(req: experimentsExperimentLifecycleServiceApi.ActivateExperimentRequest): Promise<experimentsExperimentLifecycleServiceApi.ActivateExperimentResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateExperiment", req);
    this.logger.info("activate_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantReportingServiceApi.CountVariantTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (req?.experimentId ?? ""),
      },
    });
    const proxy1 = forwarding(this.experimentsVariantReportingClient);
    const invoke1: Unary<experimentsVariantReportingServiceApi.CountVariantTotalsRequest, experimentsVariantReportingServiceApi.CountVariantTotalsResponse> =
      (input, done) => proxy1.countVariantTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantReportingServiceApi.CountVariantTotalsRequest, experimentsVariantReportingServiceApi.CountVariantTotalsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentLifecycleServiceApi.ActivateExperimentResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      experimentsExperimentLifecycleServiceApi.ActivateExperimentResponse.fromPartial({
        experiment: { experimentId: (req?.experimentId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires an experiment.
   */
  async expireExperiment(req: experimentsExperimentLifecycleServiceApi.ExpireExperimentRequest): Promise<experimentsExperimentLifecycleServiceApi.ExpireExperimentResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireExperiment", req);
    this.logger.info("expire_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.LintExperimentsRequest.fromPartial({
      context: req?.context,
      experiment: {
        organizer: { userId: (req?.details?.newOwner?.userId ?? "") },
        participants: [{ contact: { email: (req?.details?.newOwner?.email ?? "") } }],
      },
    });
    const invoke1: Unary<experimentsExperimentValidationServiceApi.LintExperimentsRequest, experimentsExperimentValidationServiceApi.LintExperimentsResponse> =
      (input, done) => this.experimentsExperimentValidationClient.lintExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentValidationServiceApi.LintExperimentsRequest, experimentsExperimentValidationServiceApi.LintExperimentsResponse>(invoke1, request1);
    const request2 = communityForumWorkflowServiceApi.StartForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            location: {
              locality: (reply1?.experiment?.location?.locality ?? ""),
              postalCode: (reply1?.experiment?.location?.postalCode ?? ""),
            },
            manager: { displayName: (reply1?.experiment?.organizer?.displayName ?? "") },
          }],
        }],
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityForumWorkflowServiceApi.StartForumWorkflowRequest, communityForumWorkflowServiceApi.StartForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.startForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumWorkflowServiceApi.StartForumWorkflowRequest, communityForumWorkflowServiceApi.StartForumWorkflowResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowRequest.fromPartial({
      affinity: {
        subject: { displayName: (input3?.details?.newOwner?.displayName ?? "") },
      },
      context: input3?.context,
      details: {
        notify: {
          email: (reply2?.forum?.manager?.email ?? ""),
          name: input3?.details?.notifyContact?.name,
        },
      },
    });
    const invoke3: Unary<personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowResponse> =
      (input, done) => this.personalizationAffinityWorkflowClient.signalAffinityWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentLifecycleServiceApi.ExpireExperimentResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      experimentsExperimentLifecycleServiceApi.ExpireExperimentResponse.fromPartial({
        experiment: {
          audit: { createdBy: (reply2?.forum?.audit?.createdBy ?? "") },
          organizer: { userId: (reply2?.forum?.manager?.userId ?? "") },
        },
      }),
      experimentsExperimentLifecycleServiceApi.ExpireExperimentResponse.fromPartial({
        result: {
          referenceIds: (reply3?.result?.referenceIds ?? []),
          status: (reply3?.outcome?.status ?? ""),
        },
      }),
      experimentsExperimentLifecycleServiceApi.ExpireExperimentResponse.fromPartial({
        experiment: { experimentId: (req?.experimentId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns an experiment.
   */
  async getExperimentLifecycle(req: experimentsExperimentLifecycleServiceApi.GetExperimentLifecycleRequest): Promise<experimentsExperimentLifecycleServiceApi.GetExperimentLifecycleResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetExperimentLifecycle", req);
    this.logger.info("get_experiment_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantSyncServiceApi.ResolveVariantConflictRequest.fromPartial({
      context: req?.context,
      variant: {
        audit: { createdAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        scopes: (req?.context?.actor?.roles ?? []).map((value) => value),
      },
    });
    const cloned1: experimentsVariantSyncServiceApi.ResolveVariantConflictRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<experimentsVariantSyncServiceApi.ResolveVariantConflictRequest, experimentsVariantSyncServiceApi.ResolveVariantConflictResponse> =
      (input, done) => this.experimentsVariantSyncClient.resolveVariantConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantSyncServiceApi.ResolveVariantConflictRequest, experimentsVariantSyncServiceApi.ResolveVariantConflictResponse>(invoke1, cloned1);
    return mergeResponses(
      experimentsExperimentLifecycleServiceApi.GetExperimentLifecycleResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      experimentsExperimentLifecycleServiceApi.GetExperimentLifecycleResponse.fromPartial({ experiment: { experimentId: (req?.experimentId ?? "") } }),
    );
  }

  /**
   * Reinstates an experiment.
   */
  async reinstateExperiment(req: experimentsExperimentLifecycleServiceApi.ReinstateExperimentRequest): Promise<experimentsExperimentLifecycleServiceApi.ReinstateExperimentResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateExperiment", req);
    this.logger.info("reinstate_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentQueryServiceApi.LookupExperimentRequest.fromPartial({
      context: req?.context,
      experimentId: (req?.experimentId ?? ""),
    });
    const decoded1 = experimentsExperimentQueryServiceApi.LookupExperimentRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExperimentQueryServiceApi.LookupExperimentRequest.toJSON(request1))),
    );
    const invoke1: Unary<experimentsExperimentQueryServiceApi.LookupExperimentRequest, experimentsExperimentQueryServiceApi.LookupExperimentResponse> =
      (input, done) => this.experimentsExperimentQueryClient.lookupExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentQueryServiceApi.LookupExperimentRequest, experimentsExperimentQueryServiceApi.LookupExperimentResponse>(invoke1, decoded1);
    const request2 = experimentsVariantSyncServiceApi.PushVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        audit: {
          createdBy: (reply1?.experiment?.audit?.createdBy ?? ""),
          etag: (reply1?.experiment?.audit?.etag ?? ""),
        },
        owner: {
          displayName: (reply1?.experiment?.organizer?.displayName ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.PushVariantRequest",
      value: Buffer.from(experimentsVariantSyncServiceApi.PushVariantRequest.encode(request2).finish()),
    });
    const unpacked2 = experimentsVariantSyncServiceApi.PushVariantRequest.decode(envelope2.value);
    const invoke2: Unary<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse> =
      (input, done) => this.experimentsVariantSyncClient.pushVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse>(invoke2, unpacked2);
    const request3 = experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.notifyContact?.phone ?? "") } },
      exposure: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
    });
    const client3 = this.clients.get<experimentsExposureValidationServiceApi.ExposureValidationServiceClient>("acme.experiments.v1.ExposureValidationService");
    const invoke3: Unary<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse> =
      (input, done) => client3.explainExposureDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse>(invoke3, request3);
    const request4 = notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply3?.result?.details ?? {}))),
        period: reply1?.experiment?.window,
      },
      reason: ((reply2?.variant?.action?.$case === "block" ? reply2?.variant?.action.block : undefined)?.reason ?? ""),
    });
    const invoke4: Unary<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.scheduleNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentLifecycleServiceApi.ReinstateExperimentResponse.fromPartial({
        experiment: { audit: { etag: (reply1?.experiment?.audit?.etag ?? "") } },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      experimentsExperimentLifecycleServiceApi.ReinstateExperimentResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      experimentsExperimentLifecycleServiceApi.ReinstateExperimentResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      experimentsExperimentLifecycleServiceApi.ReinstateExperimentResponse.fromPartial({
        result: {
          referenceIds: (reply4?.result?.referenceIds ?? []),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      experimentsExperimentLifecycleServiceApi.ReinstateExperimentResponse.fromPartial({
        experiment: { experimentId: (req?.experimentId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews an experiment.
   */
  async renewExperiment(req: experimentsExperimentLifecycleServiceApi.RenewExperimentRequest): Promise<experimentsExperimentLifecycleServiceApi.RenewExperimentResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewExperiment", req);
    this.logger.info("renew_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureCalculationServiceApi.QuoteExposureRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      exposure: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<experimentsExposureCalculationServiceApi.QuoteExposureRequest, experimentsExposureCalculationServiceApi.QuoteExposureResponse> =
      (input, done) => this.experimentsExposureCalculationClient.quoteExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<experimentsExposureCalculationServiceApi.QuoteExposureRequest, experimentsExposureCalculationServiceApi.QuoteExposureResponse>(invoke1, request1));
    const request2 = experimentsExposureSyncServiceApi.ReconcileExposuresRequest.fromPartial({
      context: req?.context,
      exposure: {
        kind: (reply1?.exposure?.kind ?? ""),
        subject: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          startsAt: reply1?.exposure?.subject?.startsAt,
        },
      },
    });
    const invoke2: Unary<experimentsExposureSyncServiceApi.ReconcileExposuresRequest, experimentsExposureSyncServiceApi.ReconcileExposuresResponse> =
      (input, done) => this.experimentsExposureSyncClient.reconcileExposures(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("RenewExperiment.ReconcileExposures", () => call<experimentsExposureSyncServiceApi.ReconcileExposuresRequest, experimentsExposureSyncServiceApi.ReconcileExposuresResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      experimentsExperimentLifecycleServiceApi.RenewExperimentResponse.fromPartial({
        experiment: {
          organizer: { displayName: (reply1?.exposure?.subject?.displayName ?? "") },
        },
      }),
      experimentsExperimentLifecycleServiceApi.RenewExperimentResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      experimentsExperimentLifecycleServiceApi.RenewExperimentResponse.fromPartial({
        experiment: { experimentId: (req?.experimentId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules an experiment.
   */
  async scheduleExperimentExpiry(req: experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryRequest): Promise<experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "ScheduleExperimentExpiry", req);
    this.logger.info("schedule_experiment_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        audit: {
          updatedAt: req?.experiment?.audit?.updatedAt,
          updatedBy: (req?.experiment?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CreateFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.createFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = experimentsExposureSyncServiceApi.ReconcileExposuresRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      exposure: {
        subject: {
          displayName: (req?.experiment?.organizer?.displayName ?? ""),
          experimentId: (req?.experimentId ?? ""),
        },
      },
      reason: ((reply1?.featureFlag?.action?.$case === "block" ? reply1?.featureFlag?.action.block : undefined)?.reason ?? ""),
    });
    const reply2 = await this.workQueue.enqueue<experimentsExposureSyncServiceApi.ReconcileExposuresRequest, experimentsExposureSyncServiceApi.ReconcileExposuresResponse>(
      "acme.experiments.v1.ExperimentLifecycleService/ScheduleExperimentExpiry:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryResponse.fromPartial({
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          title: (req?.experiment?.title ?? ""),
        },
      }),
    );
  }

  /**
   * Suspends an experiment.
   */
  async suspendExperiment(req: experimentsExperimentLifecycleServiceApi.SuspendExperimentRequest): Promise<experimentsExperimentLifecycleServiceApi.SuspendExperimentResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendExperiment", req);
    this.logger.info("suspend_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.CloneFeatureFlagRequest.fromPartial({
      context: req?.context,
      featureFlag: { owner: { email: (req?.details?.notifyContact?.email ?? "") } },
    });
    const invoke1: Unary<featureflagsFeatureFlagServiceApi.CloneFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CloneFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.cloneFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<featureflagsFeatureFlagServiceApi.CloneFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CloneFeatureFlagResponse>(invoke1, request1));
    const request2 = experimentsVariantSyncServiceApi.PushVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (reply1?.featureFlag?.owner?.userId ?? ""),
        },
        action: { $case: "route", route: {
          target: ((reply1?.featureFlag?.action?.$case === "route" ? reply1?.featureFlag?.action.route : undefined)?.target ?? ""),
        } },
      },
    });
    const invoke2: Unary<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse> =
      (input, done) => this.experimentsVariantSyncClient.pushVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<experimentsVariantSyncServiceApi.PushVariantResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest.fromPartial({
      context: req?.context,
      variant: { owner: { userId: (reply1?.featureFlag?.owner?.userId ?? "") } },
    });
    const invoke3: Unary<experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest, experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse> =
      (input, done) => this.experimentsVariantCalculationClient.explainVariantCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    let selected4_2: string | undefined;
    switch (reply1?.featureFlag?.action?.$case) {
      case "block":
        selected4_2 = ((reply1?.featureFlag?.action?.$case === "block" ? reply1?.featureFlag?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected4_2 = "";
    }
    const request4 = personalizationProfileReportingServiceApi.ShareProfileReportRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (reply1?.featureFlag?.owner?.email ?? "") } },
      reason: (selected4_2 ?? ""),
    });
    const invoke4: Unary<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse> =
      (input, done) => this.personalizationProfileReportingClient.shareProfileReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentLifecycleServiceApi.SuspendExperimentResponse.fromPartial({
        experiment: { organizer: { email: (reply1?.featureFlag?.owner?.email ?? "") } },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      experimentsExperimentLifecycleServiceApi.SuspendExperimentResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      experimentsExperimentLifecycleServiceApi.SuspendExperimentResponse.fromPartial({
        experiment: { organizer: { email: (reply3?.variant?.owner?.email ?? "") } },
      }),
      experimentsExperimentLifecycleServiceApi.SuspendExperimentResponse.fromPartial({
        outcome: {
          nextSteps: (reply4?.outcome?.nextSteps ?? []),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      experimentsExperimentLifecycleServiceApi.SuspendExperimentResponse.fromPartial({
        experiment: { experimentId: (req?.experimentId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates an experiment.
   */
  async terminateExperiment(req: experimentsExperimentLifecycleServiceApi.TerminateExperimentRequest): Promise<experimentsExperimentLifecycleServiceApi.TerminateExperimentResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateExperiment", req);
    this.logger.info("terminate_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const method1 = "countRecommendationTotals" as const;
    const invoke1: Unary<personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest, personalizationRecommendationReportingServiceApi.CountRecommendationTotalsResponse> =
      (input, done) => this.personalizationRecommendationReportingClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest, personalizationRecommendationReportingServiceApi.CountRecommendationTotalsResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptSyncServiceApi.PushDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
    });
    const proxy2 = forwarding(this.notificationsDeliveryAttemptSyncClient);
    const invoke2: Unary<notificationsDeliveryAttemptSyncServiceApi.PushDeliveryAttemptRequest, notificationsDeliveryAttemptSyncServiceApi.PushDeliveryAttemptResponse> =
      (input, done) => proxy2.pushDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptSyncServiceApi.PushDeliveryAttemptRequest, notificationsDeliveryAttemptSyncServiceApi.PushDeliveryAttemptResponse>(invoke2, request2);
    const request3 = venuesVenueValidationServiceApi.ScoreVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const invoke3: Unary<venuesVenueValidationServiceApi.ScoreVenueRequest, venuesVenueValidationServiceApi.ScoreVenueResponse> =
      (input, done) => this.venuesVenueValidationClient.scoreVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<venuesVenueValidationServiceApi.ScoreVenueRequest, venuesVenueValidationServiceApi.ScoreVenueResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentLifecycleServiceApi.TerminateExperimentResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      experimentsExperimentLifecycleServiceApi.TerminateExperimentResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      experimentsExperimentLifecycleServiceApi.TerminateExperimentResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      experimentsExperimentLifecycleServiceApi.TerminateExperimentResponse.fromPartial({
        experiment: { experimentId: (req?.experimentId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}

/**
 * The gRPC boundary for ExperimentLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class ExperimentLifecycleHandler {
  constructor(@inject(ExperimentLifecycleWorkflow) private readonly workflow: ExperimentLifecycleWorkflow) {}

  /**
   * Activates an experiment.
   */
  activateExperiment = unary<experimentsExperimentLifecycleServiceApi.ActivateExperimentRequest, experimentsExperimentLifecycleServiceApi.ActivateExperimentResponse>(
    (request) => this.workflow.activateExperiment(request),
  );

  /**
   * Expires an experiment.
   */
  expireExperiment = unary<experimentsExperimentLifecycleServiceApi.ExpireExperimentRequest, experimentsExperimentLifecycleServiceApi.ExpireExperimentResponse>(
    (request) => this.workflow.expireExperiment(request),
  );

  /**
   * Returns an experiment.
   */
  getExperimentLifecycle = (call: ServerUnaryCall<experimentsExperimentLifecycleServiceApi.GetExperimentLifecycleRequest, experimentsExperimentLifecycleServiceApi.GetExperimentLifecycleResponse>, done: sendUnaryData<experimentsExperimentLifecycleServiceApi.GetExperimentLifecycleResponse>): void => {
    void this.workflow.getExperimentLifecycle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reinstates an experiment.
   */
  reinstateExperiment = unary<experimentsExperimentLifecycleServiceApi.ReinstateExperimentRequest, experimentsExperimentLifecycleServiceApi.ReinstateExperimentResponse>(
    (request) => this.workflow.reinstateExperiment(request),
  );

  /**
   * Renews an experiment.
   */
  renewExperiment = unary<experimentsExperimentLifecycleServiceApi.RenewExperimentRequest, experimentsExperimentLifecycleServiceApi.RenewExperimentResponse>(
    (request) => this.workflow.renewExperiment(request),
  );

  /**
   * Schedules an experiment.
   */
  scheduleExperimentExpiry = (call: ServerUnaryCall<experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryRequest, experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryResponse>, done: sendUnaryData<experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryResponse>): void => {
    void this.workflow.scheduleExperimentExpiry(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Suspends an experiment.
   */
  suspendExperiment = unary<experimentsExperimentLifecycleServiceApi.SuspendExperimentRequest, experimentsExperimentLifecycleServiceApi.SuspendExperimentResponse>(
    (request) => this.workflow.suspendExperiment(request),
  );

  /**
   * Terminates an experiment.
   */
  terminateExperiment = unary<experimentsExperimentLifecycleServiceApi.TerminateExperimentRequest, experimentsExperimentLifecycleServiceApi.TerminateExperimentResponse>(
    (request) => this.workflow.terminateExperiment(request),
  );
}

export function implementation(handler: ExperimentLifecycleHandler): experimentsExperimentLifecycleServiceApi.ExperimentLifecycleServiceServer {
  return {
    activateExperiment: handler.activateExperiment,
    expireExperiment: handler.expireExperiment,
    getExperimentLifecycle: handler.getExperimentLifecycle,
    reinstateExperiment: handler.reinstateExperiment,
    renewExperiment: handler.renewExperiment,
    scheduleExperimentExpiry: handler.scheduleExperimentExpiry,
    suspendExperiment: handler.suspendExperiment,
    terminateExperiment: handler.terminateExperiment,
  };
}
