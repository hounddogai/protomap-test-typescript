/**
 * Checks badges against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as communityBadgeCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityBadgeValidationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityModerationCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as fuelFuelCardQueryServiceApi from "../../../../.cache/proto/acme/fuel/v1/fuel_card_query_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as labelingLabelingTaskQueryServiceApi from "../../../../.cache/proto/acme/labeling/v1/labeling_task_query_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as secretsSecretServiceApi from "../../../../.cache/proto/acme/secrets/v1/secret_service.js";
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
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toBadgeRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate badge operations and persist audit data.
 */
@injectable()
export class BadgeValidationWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.fuel.v1.FuelCardQueryService") private readonly fuelFuelCardQueryClient: fuelFuelCardQueryServiceApi.FuelCardQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.labeling.v1.LabelingTaskQueryService") private readonly labelingLabelingTaskQueryClient: labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateHistoryService") private readonly notificationsNotificationTemplateHistoryClient: notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.secrets.v1.SecretService") private readonly secretsSecretClient: secretsSecretServiceApi.SecretServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a badge.
   */
  async checkBadgeEligibility(req: communityBadgeValidationServiceApi.CheckBadgeEligibilityRequest): Promise<communityBadgeValidationServiceApi.CheckBadgeEligibilityResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "CheckBadgeEligibility", req);
    this.logger.info("check_badge_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: { etag: (req?.badge?.audit?.etag ?? "") },
        owner: { displayName: (req?.badge?.owner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest, notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient.pushSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest, notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse>(invoke1, request1);
    const request2 = communityForumValidationServiceApi.LintForumsRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{ children: [{ audit: { createdAt: req?.badge?.audit?.createdAt } }] }],
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityForumValidationServiceApi.LintForumsRequest, communityForumValidationServiceApi.LintForumsResponse> =
      (input, done) => this.communityForumValidationClient.lintForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumValidationServiceApi.LintForumsRequest, communityForumValidationServiceApi.LintForumsResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = communityForumValidationServiceApi.NormalizeForumRequest.fromPartial({
      context: input3?.context,
      forum: {
        children: [{ children: [{ audit: { updatedAt: reply2?.forum?.audit?.updatedAt } }] }],
      },
    });
    const invoke3: Unary<communityForumValidationServiceApi.NormalizeForumRequest, communityForumValidationServiceApi.NormalizeForumResponse> =
      (input, done) => this.communityForumValidationClient.normalizeForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityForumValidationServiceApi.NormalizeForumRequest, communityForumValidationServiceApi.NormalizeForumResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeValidationServiceApi.CheckBadgeEligibilityResponse.fromPartial({
        badge: { audit: { etag: (reply1?.subscription?.audit?.etag ?? "") } },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      communityBadgeValidationServiceApi.CheckBadgeEligibilityResponse.fromPartial({
        badge: { audit: { updatedBy: (reply2?.forum?.audit?.updatedBy ?? "") } },
      }),
      communityBadgeValidationServiceApi.CheckBadgeEligibilityResponse.fromPartial({
        badge: { owner: { email: (reply3?.forum?.manager?.email ?? "") } },
        outcome: { nextSteps: (reply3?.outcome?.nextSteps ?? []) },
      }),
      communityBadgeValidationServiceApi.CheckBadgeEligibilityResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          version: (req?.badge?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Explains a badge.
   */
  async explainBadgeDecision(req: communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest): Promise<communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "ExplainBadgeDecision", req);
    this.logger.info("explain_badge_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeCalculationServiceApi.CalculateBadgeRequest.fromPartial({
      badge: { audit: { createdBy: (req?.badge?.audit?.createdBy ?? "") } },
      context: req?.context,
    });
    const cloned1: communityBadgeCalculationServiceApi.CalculateBadgeRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse> =
      (input, done) => this.communityBadgeCalculationClient.calculateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse>(invoke1, cloned1);
    const request2 = communityModerationCalculationServiceApi.RecalculateModerationsRequest.fromPartial({
      context: req?.context,
      moderation: { assignee: { displayName: (req?.badge?.owner?.displayName ?? "") } },
    });
    const decoded2 = communityModerationCalculationServiceApi.RecalculateModerationsRequest.fromJSON(
      JSON.parse(JSON.stringify(communityModerationCalculationServiceApi.RecalculateModerationsRequest.toJSON(request2))),
    );
    const invoke2: Unary<communityModerationCalculationServiceApi.RecalculateModerationsRequest, communityModerationCalculationServiceApi.RecalculateModerationsResponse> =
      (input, done) => this.communityModerationCalculationClient.recalculateModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationCalculationServiceApi.RecalculateModerationsRequest, communityModerationCalculationServiceApi.RecalculateModerationsResponse>(invoke2, decoded2);
    const request3 = communityForumValidationServiceApi.LintForumsRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{ children: [{ audit: { updatedAt: req?.badge?.audit?.updatedAt } }] }],
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.LintForumsRequest",
      value: Buffer.from(communityForumValidationServiceApi.LintForumsRequest.encode(request3).finish()),
    });
    const unpacked3 = communityForumValidationServiceApi.LintForumsRequest.decode(envelope3.value);
    const invoke3: Unary<communityForumValidationServiceApi.LintForumsRequest, communityForumValidationServiceApi.LintForumsResponse> =
      (input, done) => this.communityForumValidationClient.lintForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityForumValidationServiceApi.LintForumsRequest, communityForumValidationServiceApi.LintForumsResponse>(invoke3, unpacked3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse.fromPartial({
        badge: { audit: { createdBy: (reply1?.badge?.audit?.createdBy ?? "") } },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse.fromPartial({
        badge: { audit: { createdAt: reply2?.moderation?.audit?.createdAt } },
        outcome: { status: (reply2?.result?.status ?? "") },
      }),
      communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse.fromPartial({ badge: { audit: { updatedAt: reply3?.forum?.audit?.updatedAt } } }),
      communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          effective: req?.badge?.effective,
        },
      }),
    );
  }

  /**
   * Returns a badge.
   */
  async getBadgeRules(req: communityBadgeValidationServiceApi.GetBadgeRulesRequest): Promise<communityBadgeValidationServiceApi.GetBadgeRulesResponse> {
    validateContext(req.context);
    if (!req.badgeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "badge_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetBadgeRules", req);
    this.logger.info("get_badge_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeCalculationServiceApi.SimulateBadgeRequest.fromPartial({
      badge: { badgeId: (req?.badgeId ?? "") },
      context: req?.context,
    });
    const client1 = this.clients.get<communityBadgeCalculationServiceApi.BadgeCalculationServiceClient>("acme.community.v1.BadgeCalculationService");
    const invoke1: Unary<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse> =
      (input, done) => client1.simulateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse>(invoke1, request1);
    return mergeResponses(
      communityBadgeValidationServiceApi.GetBadgeRulesResponse.fromPartial({ badge: { owner: { userId: (reply1?.badge?.owner?.userId ?? "") } } }),
      communityBadgeValidationServiceApi.GetBadgeRulesResponse.fromPartial({ badge: { badgeId: (req?.badgeId ?? "") } }),
    );
  }

  /**
   * Lints a badge.
   */
  async lintBadges(req: communityBadgeValidationServiceApi.LintBadgesRequest): Promise<communityBadgeValidationServiceApi.LintBadgesResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "LintBadges", req);
    this.logger.info("lint_badges", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = labelingLabelingTaskQueryServiceApi.FindLabelingTasksRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.badge?.audit?.updatedAt,
        ownerId: (req?.badge?.owner?.userId ?? ""),
      },
    });
    const invoke1: Unary<labelingLabelingTaskQueryServiceApi.FindLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.FindLabelingTasksResponse> =
      (input, done) => this.labelingLabelingTaskQueryClient.findLabelingTasks(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<labelingLabelingTaskQueryServiceApi.FindLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.FindLabelingTasksResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = identityUserServiceApi.BatchGetUsersRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<identityUserServiceApi.BatchGetUsersRequest, identityUserServiceApi.BatchGetUsersResponse> =
      (input, done) => this.identityUserClient.batchGetUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<identityUserServiceApi.BatchGetUsersRequest, identityUserServiceApi.BatchGetUsersResponse>(invoke2, request2));
    const request3 = secretsSecretServiceApi.UpdateSecretRequest.fromPartial({
      context: req?.context,
      secret: { holder: { userId: (req?.badge?.owner?.userId ?? "") } },
    });
    const invoke3: Unary<secretsSecretServiceApi.UpdateSecretRequest, secretsSecretServiceApi.UpdateSecretResponse> =
      (input, done) => this.secretsSecretClient.updateSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("LintBadges.UpdateSecret", () => call<secretsSecretServiceApi.UpdateSecretRequest, secretsSecretServiceApi.UpdateSecretResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeValidationServiceApi.LintBadgesResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      communityBadgeValidationServiceApi.LintBadgesResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      communityBadgeValidationServiceApi.LintBadgesResponse.fromPartial({ badge: { owner: { email: (reply3?.secret?.contact?.email ?? "") } } }),
      communityBadgeValidationServiceApi.LintBadgesResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          priority: (req?.badge?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Normalizes a badge.
   */
  async normalizeBadge(req: communityBadgeValidationServiceApi.NormalizeBadgeRequest): Promise<communityBadgeValidationServiceApi.NormalizeBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "NormalizeBadge", req);
    this.logger.info("normalize_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationCalculationServiceApi.RecalculateModerationsRequest.fromPartial({
      context: req?.context,
      moderation: {
        origin: { $case: "customer", customer: { email: (req?.details?.contact?.email ?? "") } },
      },
    });
    const invoke1: Unary<communityModerationCalculationServiceApi.RecalculateModerationsRequest, communityModerationCalculationServiceApi.RecalculateModerationsResponse> =
      (input, done) => this.communityModerationCalculationClient.recalculateModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = venuesVenueValidationServiceApi.CheckVenueEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.badge?.owner?.email ?? "") } },
      venue: { audit: { createdAt: reply1?.moderation?.audit?.createdAt } },
    });
    const reply2 = await this.workQueue.enqueue<venuesVenueValidationServiceApi.CheckVenueEligibilityRequest, venuesVenueValidationServiceApi.CheckVenueEligibilityResponse>(
      "acme.community.v1.BadgeValidationService/NormalizeBadge:1", request2,
    );
    const request3 = communityForumValidationServiceApi.NormalizeForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: {
              updatedAt: req?.badge?.audit?.updatedAt,
              updatedBy: (req?.badge?.audit?.updatedBy ?? ""),
            },
            manager: { displayName: (reply1?.moderation?.assignee?.displayName ?? "") },
          }],
        }],
      },
    });
    const invoke3: Unary<communityForumValidationServiceApi.NormalizeForumRequest, communityForumValidationServiceApi.NormalizeForumResponse> =
      (input, done) => this.communityForumValidationClient.normalizeForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<communityForumValidationServiceApi.NormalizeForumRequest, communityForumValidationServiceApi.NormalizeForumResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeValidationServiceApi.NormalizeBadgeResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      communityBadgeValidationServiceApi.NormalizeBadgeResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      communityBadgeValidationServiceApi.NormalizeBadgeResponse.fromPartial({
        badge: { audit: { createdBy: (reply3?.forum?.audit?.createdBy ?? "") } },
      }),
      communityBadgeValidationServiceApi.NormalizeBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          description: (req?.badge?.description ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a badge.
   */
  async previewBadge(req: communityBadgeValidationServiceApi.PreviewBadgeRequest): Promise<communityBadgeValidationServiceApi.PreviewBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "PreviewBadge", req);
    this.logger.info("preview_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fuelFuelCardQueryServiceApi.ExportFuelCardsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.badge?.audit?.updatedAt,
        ownerId: (req?.badge?.owner?.userId ?? ""),
      },
    });
    const stream1 = this.fuelFuelCardQueryClient.exportFuelCards(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? fuelFuelCardQueryServiceApi.ExportFuelCardsResponse.fromPartial({});
    const request2 = notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.badge?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.badge?.parameters ?? {}))),
        ownerId: (req?.badge?.owner?.userId ?? ""),
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest, notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsResponse> =
      (input, done) => this.notificationsDeliveryAttemptExportClient.listDeliveryAttemptExports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeValidationServiceApi.PreviewBadgeResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      communityBadgeValidationServiceApi.PreviewBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          owner: req?.badge?.owner,
        },
      }),
    );
  }

  /**
   * Scores a badge.
   */
  async scoreBadge(req: communityBadgeValidationServiceApi.ScoreBadgeRequest): Promise<communityBadgeValidationServiceApi.ScoreBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "ScoreBadge", req);
    this.logger.info("score_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.CloneFeatureFlagRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        audit: {
          etag: (req?.badge?.audit?.etag ?? ""),
          updatedBy: (req?.badge?.audit?.updatedBy ?? ""),
        },
        owner: { email: (req?.badge?.owner?.email ?? "") },
        action: { $case: "route", route: {
          target: ((req?.badge?.action?.$case === "route" ? req?.badge?.action.route : undefined)?.target ?? ""),
        } },
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagServiceApi.CloneFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CloneFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.cloneFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = communityModerationCalculationServiceApi.RecalculateModerationsRequest.fromPartial({
      context: req?.context,
      moderation: { audit: { updatedBy: (req?.badge?.audit?.updatedBy ?? "") } },
    });
    const invoke2: Unary<communityModerationCalculationServiceApi.RecalculateModerationsRequest, communityModerationCalculationServiceApi.RecalculateModerationsResponse> =
      (input, done) => this.communityModerationCalculationClient.recalculateModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeValidationServiceApi.ScoreBadgeResponse.fromPartial({
        badge: { owner: { userId: (reply1?.featureFlag?.owner?.userId ?? "") } },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      communityBadgeValidationServiceApi.ScoreBadgeResponse.fromPartial({
        badge: { audit: { createdBy: (reply2?.moderation?.audit?.createdBy ?? "") } },
        breakdown: { total: reply2?.breakdown?.total },
      }),
      communityBadgeValidationServiceApi.ScoreBadgeResponse.fromPartial({
        badge: { badgeId: (req?.badgeId ?? "") },
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
      }),
    );
  }

  /**
   * Validates a badge.
   */
  async validateBadge(req: communityBadgeValidationServiceApi.ValidateBadgeRequest): Promise<communityBadgeValidationServiceApi.ValidateBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "ValidateBadge", req);
    this.logger.info("validate_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.ScoreForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{ children: [{ audit: { etag: (req?.badge?.audit?.etag ?? "") } }] }],
      },
    });
    const method1 = "scoreForum" as const;
    const invoke1: Unary<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse> =
      (input, done) => this.communityForumValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse>(invoke1, request1);
    const request2 = notificationsNotificationTemplateHistoryServiceApi.RecordNotificationTemplateVersionRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: {
          createdBy: (reply1?.forum?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.forum?.audit?.updatedBy ?? ""),
        },
        billingAddress: {
          lines: (reply1?.forum?.location?.lines ?? []).map((value) => value),
          locality: (reply1?.forum?.location?.locality ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.notificationsNotificationTemplateHistoryClient);
    const invoke2: Unary<notificationsNotificationTemplateHistoryServiceApi.RecordNotificationTemplateVersionRequest, notificationsNotificationTemplateHistoryServiceApi.RecordNotificationTemplateVersionResponse> =
      (input, done) => proxy2.recordNotificationTemplateVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateHistoryServiceApi.RecordNotificationTemplateVersionRequest, notificationsNotificationTemplateHistoryServiceApi.RecordNotificationTemplateVersionResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeValidationServiceApi.ValidateBadgeResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      communityBadgeValidationServiceApi.ValidateBadgeResponse.fromPartial({
        badge: {
          owner: {
            displayName: (reply2?.notificationTemplate?.counterparty?.displayName ?? ""),
          },
        },
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
      }),
      communityBadgeValidationServiceApi.ValidateBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          status: req?.badge?.status,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for BadgeValidationService; workflows own validation and database transactions.
 */
@injectable()
export class BadgeValidationHandler {
  constructor(@inject(BadgeValidationWorkflow) private readonly workflow: BadgeValidationWorkflow) {}

  /**
   * Checks a badge.
   */
  checkBadgeEligibility = unary<communityBadgeValidationServiceApi.CheckBadgeEligibilityRequest, communityBadgeValidationServiceApi.CheckBadgeEligibilityResponse>(
    (request) => this.workflow.checkBadgeEligibility(request),
  );

  /**
   * Explains a badge.
   */
  explainBadgeDecision = unary<communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest, communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse>(
    (request) => this.workflow.explainBadgeDecision(request),
  );

  /**
   * Returns a badge.
   */
  getBadgeRules = (call: ServerUnaryCall<communityBadgeValidationServiceApi.GetBadgeRulesRequest, communityBadgeValidationServiceApi.GetBadgeRulesResponse>, done: sendUnaryData<communityBadgeValidationServiceApi.GetBadgeRulesResponse>): void => {
    void this.workflow.getBadgeRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints a badge.
   */
  lintBadges = unary<communityBadgeValidationServiceApi.LintBadgesRequest, communityBadgeValidationServiceApi.LintBadgesResponse>(
    (request) => this.workflow.lintBadges(request),
  );

  /**
   * Normalizes a badge.
   */
  normalizeBadge = unary<communityBadgeValidationServiceApi.NormalizeBadgeRequest, communityBadgeValidationServiceApi.NormalizeBadgeResponse>(
    (request) => this.workflow.normalizeBadge(request),
  );

  /**
   * Previews a badge.
   */
  previewBadge = (call: ServerUnaryCall<communityBadgeValidationServiceApi.PreviewBadgeRequest, communityBadgeValidationServiceApi.PreviewBadgeResponse>, done: sendUnaryData<communityBadgeValidationServiceApi.PreviewBadgeResponse>): void => {
    void this.workflow.previewBadge(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Scores a badge.
   */
  scoreBadge = unary<communityBadgeValidationServiceApi.ScoreBadgeRequest, communityBadgeValidationServiceApi.ScoreBadgeResponse>(
    (request) => this.workflow.scoreBadge(request),
  );

  /**
   * Validates a badge.
   */
  validateBadge = unary<communityBadgeValidationServiceApi.ValidateBadgeRequest, communityBadgeValidationServiceApi.ValidateBadgeResponse>(
    (request) => this.workflow.validateBadge(request),
  );
}

export function implementation(handler: BadgeValidationHandler): communityBadgeValidationServiceApi.BadgeValidationServiceServer {
  return {
    checkBadgeEligibility: handler.checkBadgeEligibility,
    explainBadgeDecision: handler.explainBadgeDecision,
    getBadgeRules: handler.getBadgeRules,
    lintBadges: handler.lintBadges,
    normalizeBadge: handler.normalizeBadge,
    previewBadge: handler.previewBadge,
    scoreBadge: handler.scoreBadge,
    validateBadge: handler.validateBadge,
  };
}
