/**
 * Runs the long-lived workflow that takes an experiment from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as communityBadgeWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as experimentsExperimentReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as giftcardsGiftCardCalculationServiceApi from "../../../../.cache/proto/acme/giftcards/v1/gift_card_calculation_service.js";
import * as messagingChannelValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationAffinityWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_workflow_service.js";
import * as personalizationProfileWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary, workflow } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toExperimentRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate experiment operations and persist audit data.
 */
@injectable()
export class ExperimentWorkflowWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeWorkflowService") private readonly communityBadgeWorkflowClient: communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentReportingService") private readonly experimentsExperimentReportingClient: experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantReportingService") private readonly experimentsVariantReportingClient: experimentsVariantReportingServiceApi.VariantReportingServiceClient,
    @inject("grpc:acme.giftcards.v1.GiftCardCalculationService") private readonly giftcardsGiftCardCalculationClient: giftcardsGiftCardCalculationServiceApi.GiftCardCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelValidationService") private readonly messagingChannelValidationClient: messagingChannelValidationServiceApi.ChannelValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityWorkflowService") private readonly personalizationAffinityWorkflowClient: personalizationAffinityWorkflowServiceApi.AffinityWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileWorkflowService") private readonly personalizationProfileWorkflowClient: personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances an experiment.
   */
  async advanceExperimentWorkflow(req: experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowRequest): Promise<experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "AdvanceExperimentWorkflow", req);
    this.logger.info("advance_experiment_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest, notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.sendDeliveryAttemptTestNotice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("AdvanceExperimentWorkflow.SendDeliveryAttemptTestNotice", () => call<notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest, notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeResponse>(invoke1, request1));
    const request2 = experimentsVariantReportingServiceApi.GenerateVariantReportRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<experimentsVariantReportingServiceApi.GenerateVariantReportRequest, experimentsVariantReportingServiceApi.GenerateVariantReportResponse> =
      (input, done) => this.experimentsVariantReportingClient.generateVariantReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowRequest.fromPartial({
      affinity: {
        subject: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const reply3 = await this.workQueue.enqueue<personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowResponse>(
      "acme.experiments.v1.ExperimentWorkflowService/AdvanceExperimentWorkflow:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.details?.notify?.phone ?? "") });
    return mergeResponses(
      experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowResponse.fromPartial({
        experiment: {
          organizer: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
        },
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
      }),
      experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowResponse.fromPartial({
        outcome: { effectiveAt: reply3?.outcome?.effectiveAt },
        result: { correlationId: (reply3?.affinity?.correlationId ?? "") },
      }),
      experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          metadata: (req?.experiment?.metadata ?? {}),
        },
      }),
    );
  }

  /**
   * Cancels an experiment.
   */
  async cancelExperimentWorkflow(req: experimentsExperimentWorkflowServiceApi.CancelExperimentWorkflowRequest): Promise<experimentsExperimentWorkflowServiceApi.CancelExperimentWorkflowResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "CancelExperimentWorkflow", req);
    this.logger.info("cancel_experiment_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureReportingServiceApi.ShareExposureReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<experimentsExposureReportingServiceApi.ShareExposureReportRequest, experimentsExposureReportingServiceApi.ShareExposureReportResponse> =
      (input, done) => this.experimentsExposureReportingClient.shareExposureReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<experimentsExposureReportingServiceApi.ShareExposureReportRequest, experimentsExposureReportingServiceApi.ShareExposureReportResponse>(invoke1, request1));
    const request2 = messagingChannelValidationServiceApi.PreviewChannelRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke2: Unary<messagingChannelValidationServiceApi.PreviewChannelRequest, messagingChannelValidationServiceApi.PreviewChannelResponse> =
      (input, done) => this.messagingChannelValidationClient.previewChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<messagingChannelValidationServiceApi.PreviewChannelResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const settled3 = await Promise.allSettled((req?.experiment?.participants ?? []).map(async (item) => {
      const request3 = personalizationProfileWorkflowServiceApi.StartProfileWorkflowRequest.fromPartial({
        context: req?.context,
        profile: {
          contact: { preferredChannel: (item?.contact?.preferredChannel ?? "") },
        },
      });
      const invoke3: Unary<personalizationProfileWorkflowServiceApi.StartProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse> =
        (input, done) => this.personalizationProfileWorkflowClient.startProfileWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<personalizationProfileWorkflowServiceApi.StartProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentWorkflowServiceApi.CancelExperimentWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      experimentsExperimentWorkflowServiceApi.CancelExperimentWorkflowResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      experimentsExperimentWorkflowServiceApi.CancelExperimentWorkflowResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          metadata: (req?.experiment?.metadata ?? {}),
        },
      }),
    );
  }

  /**
   * Returns an experiment.
   */
  async inspectExperimentWorkflow(req: experimentsExperimentWorkflowServiceApi.InspectExperimentWorkflowRequest): Promise<experimentsExperimentWorkflowServiceApi.InspectExperimentWorkflowResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectExperimentWorkflow", req);
    this.logger.info("inspect_experiment_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueValidationServiceApi.LintVenuesRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      venue: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const invoke1: Unary<venuesVenueValidationServiceApi.LintVenuesRequest, venuesVenueValidationServiceApi.LintVenuesResponse> =
      (input, done) => this.venuesVenueValidationClient.lintVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      experimentsExperimentWorkflowServiceApi.InspectExperimentWorkflowResponse.fromPartial({
        experiment: {
          audit: { createdBy: (reply1?.venue?.audit?.createdBy ?? "") },
          location: {
            postalCode: ((reply1?.venue?.locator?.$case === "address" ? reply1?.venue?.locator.address : undefined)?.postalCode ?? ""),
          },
        },
      }),
      experimentsExperimentWorkflowServiceApi.InspectExperimentWorkflowResponse.fromPartial({ experiment: { experimentId: (req?.experimentId ?? "") } }),
    );
  }

  /**
   * Lists experiments a page at a time.
   */
  async listExperimentWorkflows(req: experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsRequest): Promise<experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListExperimentWorkflows", req);
    this.logger.info("list_experiment_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentReportingServiceApi.ListExperimentReportsRequest.fromPartial({
      context: req?.context,
      filter: { statuses: (req?.filter?.statuses ?? []).map((value) => value) },
    });
    const invoke1: Unary<experimentsExperimentReportingServiceApi.ListExperimentReportsRequest, experimentsExperimentReportingServiceApi.ListExperimentReportsResponse> =
      (input, done) => this.experimentsExperimentReportingClient.listExperimentReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExperimentWorkflowServiceApi.ListExperimentWorkflowsResponse.fromPartial({
      pageInfo: { totalSize: (reply1?.pageInfo?.totalSize ?? 0) },
      result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
    });
  }

  /**
   * Pauses an experiment.
   */
  async pauseExperimentWorkflow(req: experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowRequest): Promise<experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "PauseExperimentWorkflow", req);
    this.logger.info("pause_experiment_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<personalizationAffinityImportServiceApi.RetryAffinityImportResponse>> = [];
    for (const item of (req?.experiment?.participants ?? [])) {
      tasks1.push(async () => {
        const request1 = personalizationAffinityImportServiceApi.RetryAffinityImportRequest.fromPartial({
          context: req?.context,
          details: { notify: { name: item?.contact?.name } },
        });
        const invoke1: Unary<personalizationAffinityImportServiceApi.RetryAffinityImportRequest, personalizationAffinityImportServiceApi.RetryAffinityImportResponse> =
          (input, done) => this.personalizationAffinityImportClient.retryAffinityImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<personalizationAffinityImportServiceApi.RetryAffinityImportRequest, personalizationAffinityImportServiceApi.RetryAffinityImportResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? personalizationAffinityImportServiceApi.RetryAffinityImportResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowResponse.fromPartial({
      experiment: {
        experimentId: (req?.experimentId ?? ""),
        status: req?.experiment?.status,
      },
    });
  }

  /**
   * Resumes an experiment.
   */
  async resumeExperimentWorkflow(req: experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowRequest): Promise<experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "ResumeExperimentWorkflow", req);
    this.logger.info("resume_experiment_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.experiment?.audit?.createdAt,
        region: (req?.experiment?.location?.region ?? ""),
      },
    });
    const method1 = "countNotificationTemplates" as const;
    const invoke1: Unary<notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse>(invoke1, request1);
    const request2 = giftcardsGiftCardCalculationServiceApi.SimulateGiftCardRequest.fromPartial({
      context: req?.context,
      giftCard: {
        audit: { createdBy: (req?.experiment?.audit?.createdBy ?? "") },
        contact: { name: req?.details?.notify?.name },
      },
    });
    const proxy2 = forwarding(this.giftcardsGiftCardCalculationClient);
    const invoke2: Unary<giftcardsGiftCardCalculationServiceApi.SimulateGiftCardRequest, giftcardsGiftCardCalculationServiceApi.SimulateGiftCardResponse> =
      (input, done) => proxy2.simulateGiftCard(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<giftcardsGiftCardCalculationServiceApi.SimulateGiftCardRequest, giftcardsGiftCardCalculationServiceApi.SimulateGiftCardResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowResponse.fromPartial({
        experiment: {
          organizer: { email: (reply2?.giftCard?.contact?.email ?? "") },
          participants: [{ contact: { phone: (reply2?.giftCard?.contact?.phone ?? "") } }],
        },
      }),
      experimentsExperimentWorkflowServiceApi.ResumeExperimentWorkflowResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          metadata: (req?.experiment?.metadata ?? {}),
        },
      }),
    );
  }

  /**
   * Signals an experiment.
   */
  async signalExperimentWorkflow(req: experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowRequest): Promise<experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "SignalExperimentWorkflow", req);
    this.logger.info("signal_experiment_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest.fromPartial({
      badge: {
        audit: { etag: (req?.experiment?.audit?.etag ?? "") },
        owner: {
          email: (req?.details?.notify?.email ?? ""),
          userId: (req?.experiment?.organizer?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { notify: { name: req?.details?.notify?.name } },
    });
    const invoke1: Unary<communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse> =
      (input, done) => this.communityBadgeWorkflowClient.advanceBadgeWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse>(invoke1, request1);
    const request2 = experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.experiment?.organizer?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
      exposure: {
        subject: {
          displayName: (req?.experiment?.organizer?.displayName ?? ""),
          experimentId: (req?.experimentId ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse> =
      (input, done) => this.experimentsExposureValidationClient.explainExposureDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowResponse.fromPartial({
        experiment: {
          participants: [{ contact: { email: (reply1?.badge?.owner?.email ?? "") } }],
        },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          window: req?.experiment?.window,
        },
      }),
    );
  }

  /**
   * Starts an experiment.
   */
  async startExperimentWorkflow(req: experimentsExperimentWorkflowServiceApi.StartExperimentWorkflowRequest): Promise<experimentsExperimentWorkflowServiceApi.StartExperimentWorkflowResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "StartExperimentWorkflow", req);
    this.logger.info("start_experiment_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.experiment?.participants ?? []).map(async (item) => {
      const request1 = personalizationRecommendationSyncServiceApi.PushRecommendationRequest.fromPartial({
        context: req?.context,
        recommendation: {
          audit: { createdBy: (req?.experiment?.audit?.createdBy ?? "") },
          billingAddress: { recipient: (req?.experiment?.location?.recipient ?? "") },
          counterparty: { email: (item?.contact?.email ?? "") },
        },
      });
      const invoke1: Unary<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse> =
        (input, done) => this.personalizationRecommendationSyncClient.pushRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? personalizationRecommendationSyncServiceApi.PushRecommendationResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return experimentsExperimentWorkflowServiceApi.StartExperimentWorkflowResponse.fromPartial({
      experiment: {
        experimentId: (req?.experimentId ?? ""),
        metadata: (req?.experiment?.metadata ?? {}),
      },
    });
  }
}
