/**
 * Moves an affinity between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as communityBadgeApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityModerationApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as communityPostApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as keymanagementCryptoKeyQueryServiceApi from "../../../../../.cache/proto/acme/keymanagement/v1/crypto_key_query_service.js";
import * as notificationsNotificationAdminServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_admin_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as personalizationAffinityLifecycleServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_lifecycle_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as personalizationRecommendationLifecycleServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_lifecycle_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as surveysSurveyServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_service.js";
import * as telematicsTelemetryReadingQueryServiceApi from "../../../../../.cache/proto/acme/telematics/v1/telemetry_reading_query_service.js";
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
  workflow,
} from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toAffinityRecord } from "../../data/records.js";
import { PersonalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate affinity operations and persist audit data.
 */
@injectable()
export class AffinityLifecycleWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.keymanagement.v1.CryptoKeyQueryService") private readonly keymanagementCryptoKeyQueryClient: keymanagementCryptoKeyQueryServiceApi.CryptoKeyQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationAdminService") private readonly notificationsNotificationAdminClient: notificationsNotificationAdminServiceApi.NotificationAdminServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileService") private readonly personalizationProfileClient: personalizationProfileServiceApi.ProfileServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationLifecycleService") private readonly personalizationRecommendationLifecycleClient: personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyService") private readonly surveysSurveyClient: surveysSurveyServiceApi.SurveyServiceClient,
    @inject("grpc:acme.telematics.v1.TelemetryReadingQueryService") private readonly telematicsTelemetryReadingQueryClient: telematicsTelemetryReadingQueryServiceApi.TelemetryReadingQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates an affinity.
   */
  async activateAffinity(req: personalizationAffinityLifecycleServiceApi.ActivateAffinityRequest): Promise<personalizationAffinityLifecycleServiceApi.ActivateAffinityResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateAffinity", req);
    this.logger.info("activate_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.ValidateAffinityRequest.fromPartial({
      affinity: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.newOwner?.email ?? ""),
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const client1 = this.clients.get<personalizationAffinityValidationServiceApi.AffinityValidationServiceClient>("acme.personalization.v1.AffinityValidationService");
    const invoke1: Unary<personalizationAffinityValidationServiceApi.ValidateAffinityRequest, personalizationAffinityValidationServiceApi.ValidateAffinityResponse> =
      (input, done) => client1.validateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityValidationServiceApi.ValidateAffinityRequest, personalizationAffinityValidationServiceApi.ValidateAffinityResponse>(invoke1, request1);
    const request2 = keymanagementCryptoKeyQueryServiceApi.FindCryptoKeysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.outcome?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
    });
    const invoke2: Unary<keymanagementCryptoKeyQueryServiceApi.FindCryptoKeysRequest, keymanagementCryptoKeyQueryServiceApi.FindCryptoKeysResponse> =
      (input, done) => this.keymanagementCryptoKeyQueryClient.findCryptoKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<keymanagementCryptoKeyQueryServiceApi.FindCryptoKeysRequest, keymanagementCryptoKeyQueryServiceApi.FindCryptoKeysResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = telematicsTelemetryReadingQueryServiceApi.ExportTelemetryReadingsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const stream3 = this.telematicsTelemetryReadingQueryClient.exportTelemetryReadings(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? telematicsTelemetryReadingQueryServiceApi.ExportTelemetryReadingsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityLifecycleServiceApi.ActivateAffinityResponse.fromPartial({
        affinity: { sequence: (reply1?.affinity?.sequence ?? 0) },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      personalizationAffinityLifecycleServiceApi.ActivateAffinityResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      personalizationAffinityLifecycleServiceApi.ActivateAffinityResponse.fromPartial({
        affinity: { affinityId: (req?.affinityId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires an affinity.
   */
  async expireAffinity(req: personalizationAffinityLifecycleServiceApi.ExpireAffinityRequest): Promise<personalizationAffinityLifecycleServiceApi.ExpireAffinityResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireAffinity", req);
    this.logger.info("expire_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostApprovalServiceApi.DelegatePostApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.newOwner?.email ?? "") } },
    });
    const invoke1: Unary<communityPostApprovalServiceApi.DelegatePostApprovalRequest, communityPostApprovalServiceApi.DelegatePostApprovalResponse> =
      (input, done) => this.communityPostApprovalClient.delegatePostApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<communityPostApprovalServiceApi.DelegatePostApprovalRequest, communityPostApprovalServiceApi.DelegatePostApprovalResponse>(invoke1, request1));
    const request2 = keymanagementCryptoKeyQueryServiceApi.BrowseCryptoKeysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.post?.audit?.createdAt,
        ownerId: (reply1?.post?.postId ?? ""),
        region: (reply1?.post?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<keymanagementCryptoKeyQueryServiceApi.BrowseCryptoKeysRequest, keymanagementCryptoKeyQueryServiceApi.BrowseCryptoKeysResponse> =
      (input, done) => this.keymanagementCryptoKeyQueryClient.browseCryptoKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ExpireAffinity.BrowseCryptoKeys", () => call<keymanagementCryptoKeyQueryServiceApi.BrowseCryptoKeysRequest, keymanagementCryptoKeyQueryServiceApi.BrowseCryptoKeysResponse>(invoke2, request2));
    const request3 = notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (reply1?.post?.billingAddress?.region ?? "") } },
      subscription: {
        audit: { updatedAt: reply1?.post?.audit?.updatedAt },
        owner: {
          displayName: (reply1?.post?.counterparty?.displayName ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const invoke3: Unary<notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient.estimateSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityLifecycleServiceApi.ExpireAffinityResponse.fromPartial({ outcome: { effectiveAt: reply1?.outcome?.effectiveAt } }),
      personalizationAffinityLifecycleServiceApi.ExpireAffinityResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      personalizationAffinityLifecycleServiceApi.ExpireAffinityResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      personalizationAffinityLifecycleServiceApi.ExpireAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          subject: { displayName: (req?.details?.newOwner?.displayName ?? "") },
        },
      }),
    );
  }

  /**
   * Returns an affinity.
   */
  async getAffinityLifecycle(req: personalizationAffinityLifecycleServiceApi.GetAffinityLifecycleRequest): Promise<personalizationAffinityLifecycleServiceApi.GetAffinityLifecycleResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAffinityLifecycle", req);
    this.logger.info("get_affinity_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationSyncServiceApi.PushRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: { createdAt: req?.context?.deadline },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse>(
      "acme.personalization.v1.AffinityLifecycleService/GetAffinityLifecycle:0", request1,
    );
    const request2 = notificationsNotificationAdminServiceApi.RepairNotificationRequest.fromPartial({
      context: req?.context,
      notification: { audit: { updatedAt: reply1?.recommendation?.audit?.updatedAt } },
    });
    const invoke2: Unary<notificationsNotificationAdminServiceApi.RepairNotificationRequest, notificationsNotificationAdminServiceApi.RepairNotificationResponse> =
      (input, done) => this.notificationsNotificationAdminClient.repairNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<notificationsNotificationAdminServiceApi.RepairNotificationRequest, notificationsNotificationAdminServiceApi.RepairNotificationResponse>(invoke2, request2));
    return mergeResponses(
      personalizationAffinityLifecycleServiceApi.GetAffinityLifecycleResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      personalizationAffinityLifecycleServiceApi.GetAffinityLifecycleResponse.fromPartial({
        affinity: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      personalizationAffinityLifecycleServiceApi.GetAffinityLifecycleResponse.fromPartial({ affinity: { affinityId: (req?.affinityId ?? "") } }),
    );
  }

  /**
   * Renews an affinity.
   */
  async renewAffinity(req: personalizationAffinityLifecycleServiceApi.RenewAffinityRequest): Promise<personalizationAffinityLifecycleServiceApi.RenewAffinityResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewAffinity", req);
    this.logger.info("renew_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostApprovalServiceApi.DelegatePostApprovalRequest.fromPartial({
      context: req?.context,
      post: {
        counterparty: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<communityPostApprovalServiceApi.DelegatePostApprovalRequest, communityPostApprovalServiceApi.DelegatePostApprovalResponse> =
      (input, done) => this.communityPostApprovalClient.delegatePostApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<communityPostApprovalServiceApi.DelegatePostApprovalResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = surveysSurveyServiceApi.ListSurveysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.post?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.post?.metadata ?? {}))),
        ownerId: (reply1?.post?.counterparty?.profileId ?? ""),
        region: (reply1?.post?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<surveysSurveyServiceApi.ListSurveysRequest, surveysSurveyServiceApi.ListSurveysResponse> =
      (input, done) => this.surveysSurveyClient.listSurveys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (reply1?.post?.billingAddress?.lines ?? []).map((value) => value),
        },
      },
    });
    const invoke3: Unary<notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient.simulateSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityLifecycleServiceApi.RenewAffinityResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      personalizationAffinityLifecycleServiceApi.RenewAffinityResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      personalizationAffinityLifecycleServiceApi.RenewAffinityResponse.fromPartial({
        affinity: {
          subject: { displayName: (reply3?.subscription?.owner?.displayName ?? "") },
        },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      personalizationAffinityLifecycleServiceApi.RenewAffinityResponse.fromPartial({
        affinity: { affinityId: (req?.affinityId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules an affinity.
   */
  async scheduleAffinityExpiry(req: personalizationAffinityLifecycleServiceApi.ScheduleAffinityExpiryRequest): Promise<personalizationAffinityLifecycleServiceApi.ScheduleAffinityExpiryResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "ScheduleAffinityExpiry", req);
    this.logger.info("schedule_affinity_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationLifecycleServiceApi.ActivateRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        notifyContact: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
      recommendationId: (req?.affinity?.subject?.recommendationId ?? ""),
    });
    const method1 = "activateRecommendation" as const;
    const invoke1: Unary<personalizationRecommendationLifecycleServiceApi.ActivateRecommendationRequest, personalizationRecommendationLifecycleServiceApi.ActivateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationLifecycleClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationLifecycleServiceApi.ActivateRecommendationRequest, personalizationRecommendationLifecycleServiceApi.ActivateRecommendationResponse>(invoke1, request1);
    const request2 = personalizationAffinitySyncServiceApi.PushAffinityRequest.fromPartial({
      affinity: {
        subject: { recommendationId: (req?.affinity?.subject?.recommendationId ?? "") },
      },
      context: req?.context,
    });
    const proxy2 = forwarding(this.personalizationAffinitySyncClient);
    const invoke2: Unary<personalizationAffinitySyncServiceApi.PushAffinityRequest, personalizationAffinitySyncServiceApi.PushAffinityResponse> =
      (input, done) => proxy2.pushAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinitySyncServiceApi.PushAffinityRequest, personalizationAffinitySyncServiceApi.PushAffinityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityLifecycleServiceApi.ScheduleAffinityExpiryResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      personalizationAffinityLifecycleServiceApi.ScheduleAffinityExpiryResponse.fromPartial({ result: { correlationId: (reply2?.affinity?.correlationId ?? "") } }),
      personalizationAffinityLifecycleServiceApi.ScheduleAffinityExpiryResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          occurredAt: req?.affinity?.occurredAt,
        },
      }),
    );
  }

  /**
   * Suspends an affinity.
   */
  async suspendAffinity(req: personalizationAffinityLifecycleServiceApi.SuspendAffinityRequest): Promise<personalizationAffinityLifecycleServiceApi.SuspendAffinityResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendAffinity", req);
    this.logger.info("suspend_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityReportingServiceApi.ShareAffinityReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.newOwner?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationAffinityReportingServiceApi.ShareAffinityReportRequest, personalizationAffinityReportingServiceApi.ShareAffinityReportResponse> =
      (input, done) => this.personalizationAffinityReportingClient.shareAffinityReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityReportingServiceApi.ShareAffinityReportRequest, personalizationAffinityReportingServiceApi.ShareAffinityReportResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityLifecycleServiceApi.SuspendAffinityResponse.fromPartial({
        affinity: {
          attributes: (reply1?.affinity?.attributes ?? {}),
          occurredAt: reply1?.affinity?.occurredAt,
        },
      }),
      personalizationAffinityLifecycleServiceApi.SuspendAffinityResponse.fromPartial({
        affinity: { affinityId: (req?.affinityId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates an affinity.
   */
  async terminateAffinity(req: personalizationAffinityLifecycleServiceApi.TerminateAffinityRequest): Promise<personalizationAffinityLifecycleServiceApi.TerminateAffinityResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateAffinity", req);
    this.logger.info("terminate_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileServiceApi.CreateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        contact: {
          email: (req?.details?.notifyContact?.email ?? ""),
          name: req?.details?.notifyContact?.name,
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<personalizationProfileServiceApi.CreateProfileRequest, personalizationProfileServiceApi.CreateProfileResponse> =
      (input, done) => this.personalizationProfileClient.createProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileServiceApi.CreateProfileRequest, personalizationProfileServiceApi.CreateProfileResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest.fromPartial({
      context: input2?.context,
      details: {
        recipient: {
          name: reply1?.profile?.contact?.name,
          preferredChannel: (reply1?.profile?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse> =
      (input, done) => this.notificationsSubscriptionNotificationClient.subscribeSubscriptionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse>(invoke2, request2);
    const request3 = communityBadgeApprovalServiceApi.SubmitBadgeRequest.fromPartial({
      badge: {
        audit: {
          createdAt: reply2?.subscription?.audit?.createdAt,
          updatedAt: reply2?.subscription?.audit?.updatedAt,
          updatedBy: (reply2?.subscription?.audit?.updatedBy ?? ""),
        },
      },
      context: req?.context,
      details: { approver: { email: (req?.details?.notifyContact?.email ?? "") } },
    });
    const cloned3: communityBadgeApprovalServiceApi.SubmitBadgeRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse> =
      (input, done) => this.communityBadgeApprovalClient.submitBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse>(invoke3, cloned3);
    const request4 = communityModerationApprovalServiceApi.ListPendingModerationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply3?.badge?.audit?.createdAt,
        ownerId: (reply1?.profile?.relationshipManager?.userId ?? ""),
        region: (reply1?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const decoded4 = communityModerationApprovalServiceApi.ListPendingModerationsRequest.fromJSON(
      JSON.parse(JSON.stringify(communityModerationApprovalServiceApi.ListPendingModerationsRequest.toJSON(request4))),
    );
    const invoke4: Unary<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse> =
      (input, done) => this.communityModerationApprovalClient.listPendingModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityLifecycleServiceApi.TerminateAffinityResponse.fromPartial({
        affinity: { attributes: (reply1?.profile?.attributes ?? {}) },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      personalizationAffinityLifecycleServiceApi.TerminateAffinityResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { message: (reply2?.outcome?.message ?? "") },
      }),
      personalizationAffinityLifecycleServiceApi.TerminateAffinityResponse.fromPartial({ outcome: { effectiveAt: reply3?.outcome?.effectiveAt } }),
      personalizationAffinityLifecycleServiceApi.TerminateAffinityResponse.fromPartial({
        outcome: { status: (reply4?.result?.status ?? "") },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      personalizationAffinityLifecycleServiceApi.TerminateAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          subject: { displayName: (req?.details?.newOwner?.displayName ?? "") },
        },
      }),
    );
  }
}
