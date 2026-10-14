/**
 * Moves a rendition between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as catalogProductQueryServiceApi from "../../../../.cache/proto/acme/catalog/v1/product_query_service.js";
import * as communityBadgeApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersCustomerValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as experimentsVariantReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as mediaRenditionLifecycleServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_lifecycle_service.js";
import * as mediaRenditionReportingServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as mediaTranscodeJobValidationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as notificationsSubscriptionExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as webhooksWebhookSecretApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_approval_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
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
import { toRenditionRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate rendition operations and persist audit data.
 */
@injectable()
export class RenditionLifecycleWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.catalog.v1.ProductQueryService") private readonly catalogProductQueryClient: catalogProductQueryServiceApi.ProductQueryServiceClient,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerValidationService") private readonly customersCustomerValidationClient: customersCustomerValidationServiceApi.CustomerValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantReportingService") private readonly experimentsVariantReportingClient: experimentsVariantReportingServiceApi.VariantReportingServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.media.v1.RenditionCalculationService") private readonly mediaRenditionCalculationClient: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient,
    @inject("grpc:acme.media.v1.RenditionReportingService") private readonly mediaRenditionReportingClient: mediaRenditionReportingServiceApi.RenditionReportingServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobSyncService") private readonly mediaTranscodeJobSyncClient: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobValidationService") private readonly mediaTranscodeJobValidationClient: mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionExportService") private readonly notificationsSubscriptionExportClient: notificationsSubscriptionExportServiceApi.SubscriptionExportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretApprovalService") private readonly webhooksWebhookSecretApprovalClient: webhooksWebhookSecretApprovalServiceApi.WebhookSecretApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a rendition.
   */
  async activateRendition(req: mediaRenditionLifecycleServiceApi.ActivateRenditionRequest): Promise<mediaRenditionLifecycleServiceApi.ActivateRenditionResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateRendition", req);
    this.logger.info("activate_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobSyncServiceApi.PushTranscodeJobRequest.fromPartial({
      context: req?.context,
      transcodeJob: { requester: { email: (req?.details?.newOwner?.email ?? "") } },
    });
    const client1 = this.clients.get<mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient>("acme.media.v1.TranscodeJobSyncService");
    const invoke1: Unary<mediaTranscodeJobSyncServiceApi.PushTranscodeJobRequest, mediaTranscodeJobSyncServiceApi.PushTranscodeJobResponse> =
      (input, done) => client1.pushTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobSyncServiceApi.PushTranscodeJobRequest, mediaTranscodeJobSyncServiceApi.PushTranscodeJobResponse>(invoke1, request1);
    const request2 = notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.transcodeJob?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.outcome?.referenceId ?? ""),
      },
    });
    const invoke2: Unary<notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest, notificationsSubscriptionExportServiceApi.ListSubscriptionExportsResponse> =
      (input, done) => this.notificationsSubscriptionExportClient.listSubscriptionExports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest, notificationsSubscriptionExportServiceApi.ListSubscriptionExportsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionLifecycleServiceApi.ActivateRenditionResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      mediaRenditionLifecycleServiceApi.ActivateRenditionResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      mediaRenditionLifecycleServiceApi.ActivateRenditionResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        rendition: { renditionId: (req?.renditionId ?? "") },
      }),
    );
  }

  /**
   * Expires a rendition.
   */
  async expireRendition(req: mediaRenditionLifecycleServiceApi.ExpireRenditionRequest): Promise<mediaRenditionLifecycleServiceApi.ExpireRenditionResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireRendition", req);
    this.logger.info("expire_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.details?.newOwner?.userId ?? "") } },
      subscription: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.recallSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse>(invoke1, request1));
    const request2 = experimentsVariantReportingServiceApi.ListVariantReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.subscription?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.subscription?.parameters ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke2: Unary<experimentsVariantReportingServiceApi.ListVariantReportsRequest, experimentsVariantReportingServiceApi.ListVariantReportsResponse> =
      (input, done) => this.experimentsVariantReportingClient.listVariantReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ExpireRendition.ListVariantReports", () => call<experimentsVariantReportingServiceApi.ListVariantReportsRequest, experimentsVariantReportingServiceApi.ListVariantReportsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      mediaRenditionLifecycleServiceApi.ExpireRenditionResponse.fromPartial({ rendition: { owner: reply1?.subscription?.owner } }),
      mediaRenditionLifecycleServiceApi.ExpireRenditionResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      mediaRenditionLifecycleServiceApi.ExpireRenditionResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        rendition: { renditionId: (req?.renditionId ?? "") },
      }),
    );
  }

  /**
   * Returns a rendition.
   */
  async getRenditionLifecycle(req: mediaRenditionLifecycleServiceApi.GetRenditionLifecycleRequest): Promise<mediaRenditionLifecycleServiceApi.GetRenditionLifecycleResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetRenditionLifecycle", req);
    this.logger.info("get_rendition_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionCalculationServiceApi.SimulateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        renditionId: (req?.renditionId ?? ""),
      },
    });
    const invoke1: Unary<mediaRenditionCalculationServiceApi.SimulateRenditionRequest, mediaRenditionCalculationServiceApi.SimulateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.simulateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.rendition?.specs ?? {}))),
      },
    });
    const reply2 = await this.workQueue.enqueue<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest, personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse>(
      "acme.media.v1.RenditionLifecycleService/GetRenditionLifecycle:1", request2,
    );
    return mergeResponses(
      mediaRenditionLifecycleServiceApi.GetRenditionLifecycleResponse.fromPartial({
        rendition: {
          components: { primary: {
            componentId: (reply1?.rendition?.components?.["primary"]?.componentId ?? ""),
          } },
        },
      }),
      mediaRenditionLifecycleServiceApi.GetRenditionLifecycleResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      mediaRenditionLifecycleServiceApi.GetRenditionLifecycleResponse.fromPartial({ rendition: { renditionId: (req?.renditionId ?? "") } }),
    );
  }

  /**
   * Reinstates a rendition.
   */
  async reinstateRendition(req: mediaRenditionLifecycleServiceApi.ReinstateRenditionRequest): Promise<mediaRenditionLifecycleServiceApi.ReinstateRenditionResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateRendition", req);
    this.logger.info("reinstate_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeApprovalServiceApi.SubmitBadgeRequest.fromPartial({
      badge: { owner: { email: (req?.details?.notifyContact?.email ?? "") } },
      context: req?.context,
    });
    const invoke1: Unary<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse> =
      (input, done) => this.communityBadgeApprovalClient.submitBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse>(invoke1, request1));
    const request2 = personalizationAffinityReportingServiceApi.ScheduleAffinityReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: ((reply1?.badge?.action?.$case === "block" ? reply1?.badge?.action.block : undefined)?.reason ?? ""),
    });
    const invoke2: Unary<personalizationAffinityReportingServiceApi.ScheduleAffinityReportRequest, personalizationAffinityReportingServiceApi.ScheduleAffinityReportResponse> =
      (input, done) => this.personalizationAffinityReportingClient.scheduleAffinityReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<personalizationAffinityReportingServiceApi.ScheduleAffinityReportResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionLifecycleServiceApi.ReinstateRenditionResponse.fromPartial({
        rendition: {
          components: { primary: { description: (reply1?.badge?.description ?? "") } },
        },
      }),
      mediaRenditionLifecycleServiceApi.ReinstateRenditionResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      mediaRenditionLifecycleServiceApi.ReinstateRenditionResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        rendition: { renditionId: (req?.renditionId ?? "") },
      }),
    );
  }

  /**
   * Renews a rendition.
   */
  async renewRendition(req: mediaRenditionLifecycleServiceApi.RenewRenditionRequest): Promise<mediaRenditionLifecycleServiceApi.RenewRenditionResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewRendition", req);
    this.logger.info("renew_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      consentRecord: {
        occurredAt: req?.details?.effectiveAt,
        subject: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.quoteConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = mediaRenditionReportingServiceApi.ListRenditionReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (reply1?.consentRecord?.subject?.householdId ?? ""),
      },
    });
    const invoke2: Unary<mediaRenditionReportingServiceApi.ListRenditionReportsRequest, mediaRenditionReportingServiceApi.ListRenditionReportsResponse> =
      (input, done) => this.mediaRenditionReportingClient.listRenditionReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      mediaRenditionLifecycleServiceApi.RenewRenditionResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      mediaRenditionLifecycleServiceApi.RenewRenditionResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      mediaRenditionLifecycleServiceApi.RenewRenditionResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        rendition: { renditionId: (req?.renditionId ?? "") },
      }),
    );
  }

  /**
   * Schedules a rendition.
   */
  async scheduleRenditionExpiry(req: mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryRequest): Promise<mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "ScheduleRenditionExpiry", req);
    this.logger.info("schedule_rendition_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.rendition?.audit?.updatedAt,
        region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
      },
    });
    const method1 = "listTranscodeJobConflicts" as const;
    const invoke1: Unary<mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest, mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse> =
      (input, done) => this.mediaTranscodeJobSyncClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest, mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse>(invoke1, request1);
    const request2 = webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretRequest.fromPartial({
      context: req?.context,
      details: { approver: { displayName: (req?.rendition?.owner?.displayName ?? "") } },
      webhookSecret: {
        audit: { updatedBy: (req?.rendition?.audit?.updatedBy ?? "") },
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const proxy2 = forwarding(this.webhooksWebhookSecretApprovalClient);
    const invoke2: Unary<webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretRequest, webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretResponse> =
      (input, done) => proxy2.escalateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretRequest, webhooksWebhookSecretApprovalServiceApi.EscalateWebhookSecretResponse>(invoke2, request2);
    const request3 = mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        audit: {
          createdBy: (req?.rendition?.audit?.createdBy ?? ""),
          etag: (reply2?.webhookSecret?.audit?.etag ?? ""),
        },
      },
    });
    const invoke3: Unary<mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest, mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse> =
      (input, done) => this.mediaTranscodeJobValidationClient.lintTranscodeJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaTranscodeJobValidationServiceApi.LintTranscodeJobsRequest, mediaTranscodeJobValidationServiceApi.LintTranscodeJobsResponse>(invoke3, request3);
    const request4 = notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply3?.transcodeJob?.sla?.dueAt,
        labels: Object.fromEntries(Object.entries((reply2?.webhookSecret?.labels ?? {}))),
        region: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? ""),
      },
    });
    const { context: scope4, ...payload4 } = request4;
    const spread4 = { ...payload4, context: scope4 ?
      { ...scope4, baggage: { ...scope4.baggage } } : undefined };
    const invoke4: Unary<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest, notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.listPendingSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsRequest, notificationsSubscriptionApprovalServiceApi.ListPendingSubscriptionsResponse>(invoke4, spread4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryResponse.fromPartial({
        rendition: {
          owner: { displayName: (reply2?.webhookSecret?.holder?.displayName ?? "") },
        },
      }),
      mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryResponse.fromPartial({ result: { message: (reply3?.outcome?.message ?? "") } }),
      mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryResponse.fromPartial({
        outcome: { message: (reply4?.result?.message ?? "") },
        result: { referenceIds: (reply4?.result?.referenceIds ?? []) },
      }),
      mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryResponse.fromPartial({
        rendition: {
          capacity: (req?.rendition?.capacity ?? 0),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Suspends a rendition.
   */
  async suspendRendition(req: mediaRenditionLifecycleServiceApi.SuspendRenditionRequest): Promise<mediaRenditionLifecycleServiceApi.SuspendRenditionResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendRendition", req);
    this.logger.info("suspend_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((input1?.annotations ?? {}))),
        ownerId: (input1?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.browseFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsResponse>(invoke1, request1);
    const request2 = notificationsNotificationSyncServiceApi.SyncNotificationsRequest.fromPartial({
      context: req?.context,
      notification: { requester: { name: req?.details?.notifyContact?.name } },
    });
    const cloned2: notificationsNotificationSyncServiceApi.SyncNotificationsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<notificationsNotificationSyncServiceApi.SyncNotificationsRequest, notificationsNotificationSyncServiceApi.SyncNotificationsResponse> =
      (input, done) => this.notificationsNotificationSyncClient.syncNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationSyncServiceApi.SyncNotificationsRequest, notificationsNotificationSyncServiceApi.SyncNotificationsResponse>(invoke2, cloned2);
    const request3 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply2?.notification?.assignee?.email ?? "") } },
      searchIndex: {
        audit: {
          etag: (reply2?.notification?.audit?.etag ?? ""),
          updatedAt: reply2?.notification?.audit?.updatedAt,
        },
        owner: { email: (reply2?.notification?.requester?.email ?? "") },
      },
    });
    const decoded3 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromJSON(
      JSON.parse(JSON.stringify(searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.toJSON(request3))),
    );
    const invoke3: Unary<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.normalizeSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse>(invoke3, decoded3);
    const request4 = customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: { createdAt: reply3?.searchIndex?.audit?.createdAt },
        owner: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.LintCustomerSegmentsRequest",
      value: Buffer.from(customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.encode(request4).finish()),
    });
    const unpacked4 = customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.decode(envelope4.value);
    const invoke4: Unary<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse> =
      (input, done) => this.customersCustomerSegmentValidationClient.lintCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionLifecycleServiceApi.SuspendRenditionResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      mediaRenditionLifecycleServiceApi.SuspendRenditionResponse.fromPartial({ outcome: { effectiveAt: reply2?.outcome?.effectiveAt } }),
      mediaRenditionLifecycleServiceApi.SuspendRenditionResponse.fromPartial({
        rendition: {
          audit: { updatedAt: reply3?.searchIndex?.audit?.updatedAt },
          components: { primary: {
            componentId: (reply3?.searchIndex?.components?.["primary"]?.componentId ?? ""),
          } },
        },
      }),
      mediaRenditionLifecycleServiceApi.SuspendRenditionResponse.fromPartial({ result: { status: (reply4?.result?.status ?? "") } }),
      mediaRenditionLifecycleServiceApi.SuspendRenditionResponse.fromPartial({
        rendition: {
          owner: { email: (req?.details?.notifyContact?.email ?? "") },
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Terminates a rendition.
   */
  async terminateRendition(req: mediaRenditionLifecycleServiceApi.TerminateRenditionRequest): Promise<mediaRenditionLifecycleServiceApi.TerminateRenditionResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateRendition", req);
    this.logger.info("terminate_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerValidationServiceApi.LintCustomersRequest.fromPartial({
      context: req?.context,
      customer: { contact: { phone: (req?.details?.notifyContact?.phone ?? "") } },
    });
    const client1 = this.clients.get<customersCustomerValidationServiceApi.CustomerValidationServiceClient>("acme.customers.v1.CustomerValidationService");
    const invoke1: Unary<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse> =
      (input, done) => client1.lintCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse>(invoke1, request1);
    const request2 = catalogProductQueryServiceApi.BrowseProductsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.customer?.attributes ?? {}))),
        ownerId: (reply1?.outcome?.referenceId ?? ""),
        region: (reply1?.customer?.primaryAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<catalogProductQueryServiceApi.BrowseProductsRequest, catalogProductQueryServiceApi.BrowseProductsResponse> =
      (input, done) => this.catalogProductQueryClient.browseProducts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<catalogProductQueryServiceApi.BrowseProductsRequest, catalogProductQueryServiceApi.BrowseProductsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionLifecycleServiceApi.TerminateRenditionResponse.fromPartial({ rendition: { audit: { etag: (reply1?.customer?.audit?.etag ?? "") } } }),
      mediaRenditionLifecycleServiceApi.TerminateRenditionResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      mediaRenditionLifecycleServiceApi.TerminateRenditionResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        rendition: { renditionId: (req?.renditionId ?? "") },
      }),
    );
  }
}
