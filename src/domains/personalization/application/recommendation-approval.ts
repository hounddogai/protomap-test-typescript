/**
 * Routes recommendations through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as communityBadgeApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityBadgeWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as communityForumApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityModerationApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as communityPostWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as personalizationRecommendationApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_approval_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as personalizationRecommendationLifecycleServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_lifecycle_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
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
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toRecommendationRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate recommendation operations and persist audit data.
 */
@injectable()
export class RecommendationApprovalWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.community.v1.BadgeWorkflowService") private readonly communityBadgeWorkflowClient: communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostWorkflowService") private readonly communityPostWorkflowClient: communityPostWorkflowServiceApi.PostWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileApprovalService") private readonly personalizationProfileApprovalClient: personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationLifecycleService") private readonly personalizationRecommendationLifecycleClient: personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a recommendation.
   */
  async approveRecommendation(req: personalizationRecommendationApprovalServiceApi.ApproveRecommendationRequest): Promise<personalizationRecommendationApprovalServiceApi.ApproveRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "ApproveRecommendation", req);
    this.logger.info("approve_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse>> = [];
    for (const item of (req?.recommendation?.lines ?? [])) {
      tasks1.push(async () => {
        const request1 = personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: req?.recommendation?.audit?.updatedAt,
            labels: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
            ownerId: (item?.lineId ?? ""),
            region: (req?.recommendation?.billingAddress?.region ?? ""),
          },
        });
        const invoke1: Unary<personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest, personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse> =
          (input, done) => this.personalizationAffinityReportingClient.countAffinityTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest, personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse.fromPartial({});
    const request2 = communityModerationApprovalServiceApi.ListPendingModerationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        region: (req?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const proxy2 = forwarding(this.communityModerationApprovalClient);
    const invoke2: Unary<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse> =
      (input, done) => proxy2.listPendingModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationApprovalServiceApi.ApproveRecommendationResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      personalizationRecommendationApprovalServiceApi.ApproveRecommendationResponse.fromPartial({
        recommendation: {
          dueAt: req?.recommendation?.dueAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a recommendation.
   */
  async commentRecommendationApproval(req: personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalRequest): Promise<personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "CommentRecommendationApproval", req);
    this.logger.info("comment_recommendation_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileApprovalServiceApi.ListPendingProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.recommendation?.audit?.updatedAt,
        region: (req?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<personalizationProfileApprovalServiceApi.ListPendingProfilesRequest, personalizationProfileApprovalServiceApi.ListPendingProfilesResponse> =
      (input, done) => this.personalizationProfileApprovalClient.listPendingProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileApprovalServiceApi.ListPendingProfilesRequest, personalizationProfileApprovalServiceApi.ListPendingProfilesResponse>(invoke1, request1);
    const request2 = communityForumApprovalServiceApi.ApproveForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { createdBy: (req?.recommendation?.audit?.createdBy ?? "") },
            manager: { email: (req?.recommendation?.counterparty?.email ?? "") },
          }],
        }],
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityForumApprovalServiceApi.ApproveForumRequest, communityForumApprovalServiceApi.ApproveForumResponse> =
      (input, done) => this.communityForumApprovalClient.approveForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumApprovalServiceApi.ApproveForumRequest, communityForumApprovalServiceApi.ApproveForumResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = personalizationRecommendationLifecycleServiceApi.ExpireRecommendationRequest.fromPartial({
      context: input3?.context,
      details: {
        newOwner: {
          displayName: (input3?.recommendation?.counterparty?.displayName ?? ""),
        },
        notifyContact: { email: (input3?.details?.approver?.email ?? "") },
      },
      recommendationId: (input3?.recommendationId ?? ""),
    });
    const invoke3: Unary<personalizationRecommendationLifecycleServiceApi.ExpireRecommendationRequest, personalizationRecommendationLifecycleServiceApi.ExpireRecommendationResponse> =
      (input, done) => this.personalizationRecommendationLifecycleClient.expireRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationRecommendationLifecycleServiceApi.ExpireRecommendationRequest, personalizationRecommendationLifecycleServiceApi.ExpireRecommendationResponse>(invoke3, request3);
    let selected4_1: string | undefined;
    switch (req?.recommendation?.settlement?.$case) {
      case "card":
        selected4_1 = ((req?.recommendation?.settlement?.$case === "card" ? req?.recommendation?.settlement.card : undefined)?.holderName ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = personalizationRecommendationSyncServiceApi.SyncRecommendationsRequest.fromPartial({
      context: req?.context,
      recommendation: {
        billingAddress: { postalCode: (req?.recommendation?.billingAddress?.postalCode ?? "") },
        settlement: { $case: "card", card: { holderName: (selected4_1 ?? "") } },
      },
    });
    const invoke4: Unary<personalizationRecommendationSyncServiceApi.SyncRecommendationsRequest, personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationSyncClient.syncRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<personalizationRecommendationSyncServiceApi.SyncRecommendationsRequest, personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalResponse.fromPartial({
        recommendation: {
          audit: { etag: (reply2?.forum?.audit?.etag ?? "") },
          counterparty: { email: (reply2?.forum?.manager?.email ?? "") },
        },
      }),
      personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalResponse.fromPartial({ recommendation: { notes: (reply3?.recommendation?.notes ?? "") } }),
      personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalResponse.fromPartial({
        outcome: { nextSteps: (reply4?.outcome?.nextSteps ?? []) },
        recommendation: { recommendationId: (reply4?.recommendation?.recommendationId ?? "") },
      }),
      personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        recommendation: { total: req?.recommendation?.total },
      }),
    );
  }

  /**
   * Escalates a recommendation.
   */
  async escalateRecommendation(req: personalizationRecommendationApprovalServiceApi.EscalateRecommendationRequest): Promise<personalizationRecommendationApprovalServiceApi.EscalateRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "EscalateRecommendation", req);
    this.logger.info("escalate_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.recommendation?.lines ?? []).map(async (item) => {
      const request1 = communityBadgeApprovalServiceApi.RejectBadgeRequest.fromPartial({
        badge: { action: { $case: "discount", discount: { amount: item?.amount } } },
        context: req?.context,
      });
      const invoke1: Unary<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse> =
        (input, done) => this.communityBadgeApprovalClient.rejectBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? communityBadgeApprovalServiceApi.RejectBadgeResponse.fromPartial({});
    const request2 = personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest.fromPartial({
      affinity: {
        subject: {
          displayName: (req?.recommendation?.counterparty?.displayName ?? ""),
          number: (req?.recommendation?.number ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { email: (reply1?.badge?.owner?.email ?? "") } },
      reason: ((reply1?.badge?.action?.$case === "block" ? reply1?.badge?.action.block : undefined)?.reason ?? ""),
    });
    const decoded2 = personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest.toJSON(request2))),
    );
    const invoke2: Unary<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest, personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse> =
      (input, done) => this.personalizationAffinityValidationClient.explainAffinityDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest, personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse>(invoke2, decoded2);
    const request3 = notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.recommendation?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.badge?.parameters ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (req?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.ListNotificationTemplateSubscriptionsRequest",
      value: Buffer.from(notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest.encode(request3).finish()),
    });
    const unpacked3 = notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest.decode(envelope3.value);
    const invoke3: Unary<notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest, notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsResponse> =
      (input, done) => this.notificationsNotificationTemplateNotificationClient.listNotificationTemplateSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest, notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsResponse>(invoke3, unpacked3);
    let selected4_1: string | undefined;
    switch (req?.recommendation?.settlement?.$case) {
      case "card":
        selected4_1 = ((req?.recommendation?.settlement?.$case === "card" ? req?.recommendation?.settlement.card : undefined)?.holderName ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        billingAddress: { postalCode: (req?.recommendation?.billingAddress?.postalCode ?? "") },
        settlement: { $case: "card", card: { holderName: (selected4_1 ?? "") } },
      },
    });
    const invoke4: Unary<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.calculateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationApprovalServiceApi.EscalateRecommendationResponse.fromPartial({
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
        recommendation: { number: (reply2?.affinity?.subject?.number ?? "") },
      }),
      personalizationRecommendationApprovalServiceApi.EscalateRecommendationResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      personalizationRecommendationApprovalServiceApi.EscalateRecommendationResponse.fromPartial({ recommendation: { total: reply4?.recommendation?.total } }),
      personalizationRecommendationApprovalServiceApi.EscalateRecommendationResponse.fromPartial({
        recommendation: {
          billingAddress: req?.recommendation?.billingAddress,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a recommendation.
   */
  async getRecommendationApprovalStatus(req: personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusRequest): Promise<personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetRecommendationApprovalStatus", req);
    this.logger.info("get_recommendation_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationLifecycleServiceApi.RenewRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      recommendationId: (req?.recommendationId ?? ""),
    });
    const invoke1: Unary<personalizationRecommendationLifecycleServiceApi.RenewRecommendationRequest, personalizationRecommendationLifecycleServiceApi.RenewRecommendationResponse> =
      (input, done) => this.personalizationRecommendationLifecycleClient.renewRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<personalizationRecommendationLifecycleServiceApi.RenewRecommendationRequest, personalizationRecommendationLifecycleServiceApi.RenewRecommendationResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    return mergeResponses(
      personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusResponse.fromPartial({ recommendation: { dueAt: reply1?.recommendation?.dueAt } }),
      personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusResponse.fromPartial({ recommendation: { recommendationId: (req?.recommendationId ?? "") } }),
    );
  }

  /**
   * Recalls a recommendation.
   */
  async recallRecommendation(req: personalizationRecommendationApprovalServiceApi.RecallRecommendationRequest): Promise<personalizationRecommendationApprovalServiceApi.RecallRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "RecallRecommendation", req);
    this.logger.info("recall_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.NormalizeAffinityRequest.fromPartial({
      affinity: { subject: { displayName: (req?.details?.approver?.displayName ?? "") } },
      context: req?.context,
    });
    const invoke1: Unary<personalizationAffinityValidationServiceApi.NormalizeAffinityRequest, personalizationAffinityValidationServiceApi.NormalizeAffinityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.normalizeAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<personalizationAffinityValidationServiceApi.NormalizeAffinityRequest, personalizationAffinityValidationServiceApi.NormalizeAffinityResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationApprovalServiceApi.RecallRecommendationResponse.fromPartial({
        outcome: {
          nextSteps: (reply1?.outcome?.nextSteps ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      personalizationRecommendationApprovalServiceApi.RecallRecommendationResponse.fromPartial({
        recommendation: {
          recommendationId: (req?.recommendationId ?? ""),
          total: req?.recommendation?.total,
        },
      }),
    );
  }

  /**
   * Rejects a recommendation.
   */
  async rejectRecommendation(req: personalizationRecommendationApprovalServiceApi.RejectRecommendationRequest): Promise<personalizationRecommendationApprovalServiceApi.RejectRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "RejectRecommendation", req);
    this.logger.info("reject_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest.fromPartial({
      badge: {
        owner: { displayName: (req?.recommendation?.counterparty?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse> =
      (input, done) => this.communityBadgeWorkflowClient.cancelBadgeWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("RejectRecommendation.CancelBadgeWorkflow", () => call<communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse>(invoke1, request1));
    const request2 = notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        recipient: { email: (req?.recommendation?.counterparty?.email ?? "") },
        variables: Object.fromEntries(Object.entries((reply1?.badge?.parameters ?? {}))),
      },
      reason: ((reply1?.badge?.action?.$case === "block" ? reply1?.badge?.action.block : undefined)?.reason ?? ""),
    });
    const invoke2: Unary<notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersRequest, notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersResponse> =
      (input, done) => this.notificationsNotificationNotificationClient.notifyNotificationWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationApprovalServiceApi.RejectRecommendationResponse.fromPartial({
        outcome: { message: (reply1?.outcome?.message ?? "") },
        recommendation: {
          counterparty: { displayName: (reply1?.badge?.owner?.displayName ?? "") },
        },
      }),
      personalizationRecommendationApprovalServiceApi.RejectRecommendationResponse.fromPartial({
        recommendation: {
          counterparty: {
            displayName: ((reply2?.notification?.origin?.$case === "customer" ? reply2?.notification?.origin.customer : undefined)?.displayName ?? ""),
          },
        },
      }),
      personalizationRecommendationApprovalServiceApi.RejectRecommendationResponse.fromPartial({
        recommendation: {
          dueAt: req?.recommendation?.dueAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a recommendation.
   */
  async submitRecommendation(req: personalizationRecommendationApprovalServiceApi.SubmitRecommendationRequest): Promise<personalizationRecommendationApprovalServiceApi.SubmitRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "SubmitRecommendation", req);
    this.logger.info("submit_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.ListRecommendationReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (req?.recommendation?.recommendationId ?? ""),
        region: (req?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<personalizationRecommendationReportingServiceApi.ListRecommendationReportsRequest, personalizationRecommendationReportingServiceApi.ListRecommendationReportsResponse>(
      "acme.personalization.v1.RecommendationApprovalService/SubmitRecommendation:0", request1,
    );
    const request2 = personalizationProfileApprovalServiceApi.RejectProfileRequest.fromPartial({
      context: req?.context,
      profile: { audit: { etag: (req?.recommendation?.audit?.etag ?? "") } },
    });
    const invoke2: Unary<personalizationProfileApprovalServiceApi.RejectProfileRequest, personalizationProfileApprovalServiceApi.RejectProfileResponse> =
      (input, done) => this.personalizationProfileApprovalClient.rejectProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<personalizationProfileApprovalServiceApi.RejectProfileRequest, personalizationProfileApprovalServiceApi.RejectProfileResponse>(invoke2, request2));
    const request3 = communityPostWorkflowServiceApi.AdvancePostWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: { email: (reply2?.profile?.relationshipManager?.email ?? "") },
      },
      post: {
        billingAddress: {
          lines: (req?.recommendation?.billingAddress?.lines ?? []).map((value) => value),
          locality: (req?.recommendation?.billingAddress?.locality ?? ""),
          region: (reply2?.profile?.primaryAddress?.region ?? ""),
        },
      },
    });
    const invoke3: Unary<communityPostWorkflowServiceApi.AdvancePostWorkflowRequest, communityPostWorkflowServiceApi.AdvancePostWorkflowResponse> =
      (input, done) => this.communityPostWorkflowClient.advancePostWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<communityPostWorkflowServiceApi.AdvancePostWorkflowResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationApprovalServiceApi.SubmitRecommendationResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      personalizationRecommendationApprovalServiceApi.SubmitRecommendationResponse.fromPartial({
        recommendation: {
          number: ((reply2?.profile?.identityDocument?.$case === "passport" ? reply2?.profile?.identityDocument.passport : undefined)?.number ?? ""),
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      personalizationRecommendationApprovalServiceApi.SubmitRecommendationResponse.fromPartial({
        recommendation: {
          billingAddress: { recipient: (reply3?.post?.billingAddress?.recipient ?? "") },
        },
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
      }),
      personalizationRecommendationApprovalServiceApi.SubmitRecommendationResponse.fromPartial({
        recommendation: {
          counterparty: req?.recommendation?.counterparty,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }
}
