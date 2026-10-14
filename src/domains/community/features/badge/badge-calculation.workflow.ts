/**
 * Computes the figures of a badge, such as totals, taxes, and estimates. Remote work stays behind typed client ports.
 */

import * as anomaliesAnomalyQueryServiceApi from "../../../../../.cache/proto/acme/anomalies/v1/anomaly_query_service.js";
import * as authorizationAccessPolicyQueryServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityForumValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as maintenanceWorkOrderCalculationServiceApi from "../../../../../.cache/proto/acme/maintenance/v1/work_order_calculation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary, workflow } from "../../../../platform/rpc.js";
import { upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toBadgeRecord } from "../../data/records.js";
import { CommunityRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate badge operations and persist audit data.
 */
@injectable()
export class BadgeCalculationWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.anomalies.v1.AnomalyQueryService") private readonly anomaliesAnomalyQueryClient: anomaliesAnomalyQueryServiceApi.AnomalyQueryServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.maintenance.v1.WorkOrderCalculationService") private readonly maintenanceWorkOrderCalculationClient: maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a badge.
   */
  async calculateBadge(req: communityBadgeCalculationServiceApi.CalculateBadgeRequest): Promise<communityBadgeCalculationServiceApi.CalculateBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "CalculateBadge", req);
    this.logger.info("calculate_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = maintenanceWorkOrderCalculationServiceApi.QuoteWorkOrderRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
    });
    const invoke1: Unary<maintenanceWorkOrderCalculationServiceApi.QuoteWorkOrderRequest, maintenanceWorkOrderCalculationServiceApi.QuoteWorkOrderResponse> =
      (input, done) => this.maintenanceWorkOrderCalculationClient.quoteWorkOrder(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("CalculateBadge.QuoteWorkOrder", () => call<maintenanceWorkOrderCalculationServiceApi.QuoteWorkOrderRequest, maintenanceWorkOrderCalculationServiceApi.QuoteWorkOrderResponse>(invoke1, request1));
    const request2 = notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
    });
    const invoke2: Unary<notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.ListNotificationVersionsResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.listNotificationVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeCalculationServiceApi.CalculateBadgeResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      communityBadgeCalculationServiceApi.CalculateBadgeResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      communityBadgeCalculationServiceApi.CalculateBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          effective: req?.badge?.effective,
        },
      }),
    );
  }

  /**
   * Estimates a badge.
   */
  async estimateBadge(req: communityBadgeCalculationServiceApi.EstimateBadgeRequest): Promise<communityBadgeCalculationServiceApi.EstimateBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "EstimateBadge", req);
    this.logger.info("estimate_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.badge?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.badge?.parameters ?? {}))),
        ownerId: (req?.badge?.badgeId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse>(
      "acme.community.v1.BadgeCalculationService/EstimateBadge:0", request1,
    );
    const request2 = communityPostCalculationServiceApi.CalculatePostRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (req?.details?.destination?.locality ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      },
    });
    const invoke2: Unary<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse> =
      (input, done) => this.communityPostCalculationClient.calculatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeCalculationServiceApi.EstimateBadgeResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      communityBadgeCalculationServiceApi.EstimateBadgeResponse.fromPartial({
        badge: { audit: { createdAt: reply2?.post?.audit?.createdAt } },
        breakdown: { total: reply2?.breakdown?.total },
      }),
      communityBadgeCalculationServiceApi.EstimateBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          parameters: (req?.badge?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Explains a badge.
   */
  async explainBadgeCalculation(req: communityBadgeCalculationServiceApi.ExplainBadgeCalculationRequest): Promise<communityBadgeCalculationServiceApi.ExplainBadgeCalculationResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "ExplainBadgeCalculation", req);
    this.logger.info("explain_badge_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = anomaliesAnomalyQueryServiceApi.BrowseAnomaliesRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.badge?.owner?.userId ?? "") },
    });
    const invoke1: Unary<anomaliesAnomalyQueryServiceApi.BrowseAnomaliesRequest, anomaliesAnomalyQueryServiceApi.BrowseAnomaliesResponse> =
      (input, done) => this.anomaliesAnomalyQueryClient.browseAnomalies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<anomaliesAnomalyQueryServiceApi.BrowseAnomaliesResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = communityForumValidationServiceApi.CheckForumEligibilityRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: {
              createdAt: req?.badge?.audit?.createdAt,
              updatedAt: req?.badge?.audit?.updatedAt,
              updatedBy: (req?.badge?.audit?.updatedBy ?? ""),
            },
          }],
          manager: { email: (req?.badge?.owner?.email ?? "") },
        }],
      },
    });
    const invoke2: Unary<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse> =
      (input, done) => this.communityForumValidationClient.checkForumEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeCalculationServiceApi.ExplainBadgeCalculationResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      communityBadgeCalculationServiceApi.ExplainBadgeCalculationResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      communityBadgeCalculationServiceApi.ExplainBadgeCalculationResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          parameters: (req?.badge?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Returns a badge.
   */
  async getBadgeRates(req: communityBadgeCalculationServiceApi.GetBadgeRatesRequest): Promise<communityBadgeCalculationServiceApi.GetBadgeRatesResponse> {
    validateContext(req.context);
    if (!req.badgeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "badge_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetBadgeRates", req);
    this.logger.info("get_badge_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationServiceApi.BatchCreateNotificationsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "record", record: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        audit: { createdAt: req?.context?.deadline },
        origin: { $case: "externalReference", externalReference: (req?.badgeId ?? "") },
      } },
    });
    const reply1 = await upload<notificationsNotificationServiceApi.BatchCreateNotificationsRequest, notificationsNotificationServiceApi.BatchCreateNotificationsResponse>(
      (done) => this.notificationsNotificationClient.batchCreateNotifications(metadataFor(request1.context), { deadline: Date.now() + 15_000 }, done), [request1],
    );
    return communityBadgeCalculationServiceApi.GetBadgeRatesResponse.fromPartial({ badge: { badgeId: (req?.badgeId ?? "") } });
  }

  /**
   * Quotes a badge.
   */
  async quoteBadge(req: communityBadgeCalculationServiceApi.QuoteBadgeRequest): Promise<communityBadgeCalculationServiceApi.QuoteBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "QuoteBadge", req);
    this.logger.info("quote_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.PreviewForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { updatedBy: (req?.badge?.audit?.updatedBy ?? "") },
            location: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
          }],
        }],
      },
    });
    const invoke1: Unary<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse> =
      (input, done) => this.communityForumValidationClient.previewForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = notificationsNotificationSyncServiceApi.ResolveNotificationConflictRequest.fromPartial({
      context: req?.context,
      notification: {
        origin: { $case: "customer", customer: { displayName: (req?.badge?.owner?.displayName ?? "") } },
      },
    });
    const method2 = "resolveNotificationConflict" as const;
    const invoke2: Unary<notificationsNotificationSyncServiceApi.ResolveNotificationConflictRequest, notificationsNotificationSyncServiceApi.ResolveNotificationConflictResponse> =
      (input, done) => this.notificationsNotificationSyncClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationSyncServiceApi.ResolveNotificationConflictRequest, notificationsNotificationSyncServiceApi.ResolveNotificationConflictResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeCalculationServiceApi.QuoteBadgeResponse.fromPartial({
        badge: { audit: { updatedBy: (reply1?.forum?.audit?.updatedBy ?? "") } },
      }),
      communityBadgeCalculationServiceApi.QuoteBadgeResponse.fromPartial({
        badge: { owner: { email: (reply2?.notification?.assignee?.email ?? "") } },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      communityBadgeCalculationServiceApi.QuoteBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          parameters: (req?.badge?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Recalculates a badge.
   */
  async recalculateBadges(req: communityBadgeCalculationServiceApi.RecalculateBadgesRequest): Promise<communityBadgeCalculationServiceApi.RecalculateBadgesResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "RecalculateBadges", req);
    this.logger.info("recalculate_badges", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = maintenanceWorkOrderCalculationServiceApi.ExplainWorkOrderCalculationRequest.fromPartial({
      context: req?.context,
      workOrder: {
        origin: { $case: "customer", customer: { displayName: (req?.badge?.owner?.displayName ?? "") } },
      },
    });
    const proxy1 = forwarding(this.maintenanceWorkOrderCalculationClient);
    const invoke1: Unary<maintenanceWorkOrderCalculationServiceApi.ExplainWorkOrderCalculationRequest, maintenanceWorkOrderCalculationServiceApi.ExplainWorkOrderCalculationResponse> =
      (input, done) => proxy1.explainWorkOrderCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<maintenanceWorkOrderCalculationServiceApi.ExplainWorkOrderCalculationRequest, maintenanceWorkOrderCalculationServiceApi.ExplainWorkOrderCalculationResponse>(invoke1, request1);
    const request2 = communityForumValidationServiceApi.ExplainForumDecisionRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{ audit: { updatedBy: (reply1?.workOrder?.audit?.updatedBy ?? "") } }],
        }],
      },
    });
    const invoke2: Unary<communityForumValidationServiceApi.ExplainForumDecisionRequest, communityForumValidationServiceApi.ExplainForumDecisionResponse> =
      (input, done) => this.communityForumValidationClient.explainForumDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumValidationServiceApi.ExplainForumDecisionRequest, communityForumValidationServiceApi.ExplainForumDecisionResponse>(invoke2, request2);
    const request3 = communityForumValidationServiceApi.PreviewForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            location: {
              countryCode: (req?.details?.destination?.countryCode ?? ""),
              recipient: (req?.details?.destination?.recipient ?? ""),
            },
            manager: { email: (reply1?.workOrder?.assignee?.email ?? "") },
          }],
        }],
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse> =
      (input, done) => this.communityForumValidationClient.previewForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeCalculationServiceApi.RecalculateBadgesResponse.fromPartial({
        badge: {
          audit: {
            createdBy: (reply1?.workOrder?.audit?.createdBy ?? ""),
            updatedAt: reply1?.workOrder?.audit?.updatedAt,
          },
        },
      }),
      communityBadgeCalculationServiceApi.RecalculateBadgesResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      communityBadgeCalculationServiceApi.RecalculateBadgesResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      communityBadgeCalculationServiceApi.RecalculateBadgesResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          priority: (req?.badge?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Simulates a badge.
   */
  async simulateBadge(req: communityBadgeCalculationServiceApi.SimulateBadgeRequest): Promise<communityBadgeCalculationServiceApi.SimulateBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "SimulateBadge", req);
    this.logger.info("simulate_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsNotificationServiceApi.CreateNotificationRequest.fromPartial({
      context: input1?.context,
      notification: { audit: { etag: (input1?.badge?.audit?.etag ?? "") } },
    });
    const invoke1: Unary<notificationsNotificationServiceApi.CreateNotificationRequest, notificationsNotificationServiceApi.CreateNotificationResponse> =
      (input, done) => this.notificationsNotificationClient.createNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationServiceApi.CreateNotificationRequest, notificationsNotificationServiceApi.CreateNotificationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeCalculationServiceApi.SimulateBadgeResponse.fromPartial({
        badge: {
          audit: {
            updatedAt: reply1?.notification?.audit?.updatedAt,
            updatedBy: (reply1?.notification?.audit?.updatedBy ?? ""),
          },
        },
      }),
      communityBadgeCalculationServiceApi.SimulateBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          version: (req?.badge?.version ?? 0),
        },
      }),
    );
  }
}
