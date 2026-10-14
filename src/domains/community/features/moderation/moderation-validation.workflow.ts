/**
 * Checks moderations against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as auditAuditEventQueryServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_query_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityBadgeValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as communityForumValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityModerationValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as documentsDocumentQueryServiceApi from "../../../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as notificationsNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsSubscriptionExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as seatingSeatMapServiceApi from "../../../../../.cache/proto/acme/seating/v1/seat_map_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
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
} from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toModerationRecord } from "../../data/records.js";
import { CommunityRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate moderation operations and persist audit data.
 */
@injectable()
export class ModerationValidationWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventQueryService") private readonly auditAuditEventQueryClient: auditAuditEventQueryServiceApi.AuditEventQueryServiceClient,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentQueryService") private readonly documentsDocumentQueryClient: documentsDocumentQueryServiceApi.DocumentQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionExportService") private readonly notificationsSubscriptionExportClient: notificationsSubscriptionExportServiceApi.SubscriptionExportServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.seating.v1.SeatMapService") private readonly seatingSeatMapClient: seatingSeatMapServiceApi.SeatMapServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a moderation.
   */
  async checkModerationEligibility(req: communityModerationValidationServiceApi.CheckModerationEligibilityRequest): Promise<communityModerationValidationServiceApi.CheckModerationEligibilityResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "CheckModerationEligibility", req);
    this.logger.info("check_moderation_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.QuotePostRequest.fromPartial({
      context: req?.context,
      post: { counterparty: { email: (req?.moderation?.requester?.email ?? "") } },
    });
    const method1 = "quotePost" as const;
    const invoke1: Unary<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse> =
      (input, done) => this.communityPostCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse>(invoke1, request1);
    const request2 = communityBadgeCalculationServiceApi.CalculateBadgeRequest.fromPartial({
      badge: { audit: { createdBy: (req?.moderation?.audit?.createdBy ?? "") } },
      context: req?.context,
    });
    const proxy2 = forwarding(this.communityBadgeCalculationClient);
    const invoke2: Unary<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse> =
      (input, done) => proxy2.calculateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationValidationServiceApi.CheckModerationEligibilityResponse.fromPartial({
        moderation: { comments: [{ createdAt: reply1?.post?.audit?.createdAt }] },
      }),
      communityModerationValidationServiceApi.CheckModerationEligibilityResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      communityModerationValidationServiceApi.CheckModerationEligibilityResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          status: req?.moderation?.status,
        },
      }),
    );
  }

  /**
   * Explains a moderation.
   */
  async explainModerationDecision(req: communityModerationValidationServiceApi.ExplainModerationDecisionRequest): Promise<communityModerationValidationServiceApi.ExplainModerationDecisionResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "ExplainModerationDecision", req);
    this.logger.info("explain_moderation_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.NormalizePostRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      post: { counterparty: { email: (req?.moderation?.requester?.email ?? "") } },
    });
    const invoke1: Unary<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse> =
      (input, done) => this.communityPostValidationClient.normalizePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>(invoke1, request1);
    const request2 = communityBadgeCalculationServiceApi.CalculateBadgeRequest.fromPartial({
      badge: {
        owner: {
          displayName: (reply1?.post?.counterparty?.displayName ?? ""),
          userId: (req?.moderation?.assignee?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse> =
      (input, done) => this.communityBadgeCalculationClient.calculateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationValidationServiceApi.ExplainModerationDecisionResponse.fromPartial({
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      communityModerationValidationServiceApi.ExplainModerationDecisionResponse.fromPartial({ moderation: { priority: (reply2?.badge?.priority ?? 0) } }),
      communityModerationValidationServiceApi.ExplainModerationDecisionResponse.fromPartial({
        moderation: {
          assignee: req?.moderation?.assignee,
          moderationId: (req?.moderationId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a moderation.
   */
  async getModerationRules(req: communityModerationValidationServiceApi.GetModerationRulesRequest): Promise<communityModerationValidationServiceApi.GetModerationRulesResponse> {
    validateContext(req.context);
    if (!req.moderationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "moderation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetModerationRules", req);
    this.logger.info("get_moderation_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsNotificationServiceApi.ListNotificationsRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.context?.deadline,
        labels: Object.fromEntries(Object.entries((input1?.context?.baggage ?? {}))),
        ownerId: (input1?.moderationId ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationServiceApi.ListNotificationsRequest, notificationsNotificationServiceApi.ListNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient.listNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationServiceApi.ListNotificationsRequest, notificationsNotificationServiceApi.ListNotificationsResponse>(invoke1, request1);
    const request2 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { updatedAt: req?.context?.deadline },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        }],
      },
    });
    const cloned2: communityPostCalculationServiceApi.ComparePostOptionsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse> =
      (input, done) => this.communityPostCalculationClient.comparePostOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(invoke2, cloned2);
    return mergeResponses(
      communityModerationValidationServiceApi.GetModerationRulesResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      communityModerationValidationServiceApi.GetModerationRulesResponse.fromPartial({
        moderation: {
          comments: [{ createdAt: reply2?.post?.audit?.createdAt }],
          sla: { dueAt: reply2?.post?.dueAt },
        },
      }),
      communityModerationValidationServiceApi.GetModerationRulesResponse.fromPartial({ moderation: { moderationId: (req?.moderationId ?? "") } }),
    );
  }

  /**
   * Lints a moderation.
   */
  async lintModerations(req: communityModerationValidationServiceApi.LintModerationsRequest): Promise<communityModerationValidationServiceApi.LintModerationsResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "LintModerations", req);
    this.logger.info("lint_moderations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventQueryServiceApi.ResolveAuditEventsRequest.fromPartial({ context: req?.context });
    const decoded1 = auditAuditEventQueryServiceApi.ResolveAuditEventsRequest.fromJSON(
      JSON.parse(JSON.stringify(auditAuditEventQueryServiceApi.ResolveAuditEventsRequest.toJSON(request1))),
    );
    const invoke1: Unary<auditAuditEventQueryServiceApi.ResolveAuditEventsRequest, auditAuditEventQueryServiceApi.ResolveAuditEventsResponse> =
      (input, done) => this.auditAuditEventQueryClient.resolveAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventQueryServiceApi.ResolveAuditEventsRequest, auditAuditEventQueryServiceApi.ResolveAuditEventsResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationValidationServiceApi.LintModerationsResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      communityModerationValidationServiceApi.LintModerationsResponse.fromPartial({
        moderation: {
          customFields: (req?.moderation?.customFields ?? {}),
          moderationId: (req?.moderationId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a moderation.
   */
  async normalizeModeration(req: communityModerationValidationServiceApi.NormalizeModerationRequest): Promise<communityModerationValidationServiceApi.NormalizeModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "NormalizeModeration", req);
    this.logger.info("normalize_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentQueryServiceApi.FindDocumentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.moderation?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.moderation?.sla?.policyId ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.documents.v1.FindDocumentsRequest",
      value: Buffer.from(documentsDocumentQueryServiceApi.FindDocumentsRequest.encode(request1).finish()),
    });
    const unpacked1 = documentsDocumentQueryServiceApi.FindDocumentsRequest.decode(envelope1.value);
    const invoke1: Unary<documentsDocumentQueryServiceApi.FindDocumentsRequest, documentsDocumentQueryServiceApi.FindDocumentsResponse> =
      (input, done) => this.documentsDocumentQueryClient.findDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<documentsDocumentQueryServiceApi.FindDocumentsRequest, documentsDocumentQueryServiceApi.FindDocumentsResponse>(invoke1, unpacked1);
    const request2 = notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
      subscription: {
        owner: {
          displayName: (req?.moderation?.assignee?.displayName ?? ""),
          email: (req?.moderation?.requester?.email ?? ""),
          userId: (req?.moderation?.assignee?.userId ?? ""),
        },
      },
    });
    const client2 = this.clients.get<notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient>("acme.notifications.v1.SubscriptionWorkflowService");
    const invoke2: Unary<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse> =
      (input, done) => client2.pauseSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationValidationServiceApi.NormalizeModerationResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      communityModerationValidationServiceApi.NormalizeModerationResponse.fromPartial({
        moderation: { audit: { etag: (reply2?.subscription?.audit?.etag ?? "") } },
      }),
      communityModerationValidationServiceApi.NormalizeModerationResponse.fromPartial({
        moderation: {
          customFields: (req?.moderation?.customFields ?? {}),
          moderationId: (req?.moderationId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a moderation.
   */
  async previewModeration(req: communityModerationValidationServiceApi.PreviewModerationRequest): Promise<communityModerationValidationServiceApi.PreviewModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "PreviewModeration", req);
    this.logger.info("preview_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.ValidateForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { createdAt: req?.moderation?.audit?.createdAt },
            manager: {
              email: ((req?.moderation?.origin?.$case === "customer" ? req?.moderation?.origin.customer : undefined)?.email ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<communityForumValidationServiceApi.ValidateForumRequest, communityForumValidationServiceApi.ValidateForumResponse> =
      (input, done) => this.communityForumValidationClient.validateForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<communityForumValidationServiceApi.ValidateForumRequest, communityForumValidationServiceApi.ValidateForumResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationValidationServiceApi.PreviewModerationResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      communityModerationValidationServiceApi.PreviewModerationResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          requester: req?.moderation?.requester,
        },
      }),
    );
  }

  /**
   * Scores a moderation.
   */
  async scoreModeration(req: communityModerationValidationServiceApi.ScoreModerationRequest): Promise<communityModerationValidationServiceApi.ScoreModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "ScoreModeration", req);
    this.logger.info("score_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.PreviewPostRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: { countryCode: (req?.details?.destination?.countryCode ?? "") },
        counterparty: {
          displayName: ((req?.moderation?.origin?.$case === "customer" ? req?.moderation?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
    });
    const invoke1: Unary<communityPostValidationServiceApi.PreviewPostRequest, communityPostValidationServiceApi.PreviewPostResponse> =
      (input, done) => this.communityPostValidationClient.previewPost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<communityPostValidationServiceApi.PreviewPostRequest, communityPostValidationServiceApi.PreviewPostResponse>(invoke1, request1));
    const request2 = seatingSeatMapServiceApi.BatchGetSeatMapsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<seatingSeatMapServiceApi.BatchGetSeatMapsRequest, seatingSeatMapServiceApi.BatchGetSeatMapsResponse> =
      (input, done) => this.seatingSeatMapClient.batchGetSeatMaps(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ScoreModeration.BatchGetSeatMaps", () => call<seatingSeatMapServiceApi.BatchGetSeatMapsRequest, seatingSeatMapServiceApi.BatchGetSeatMapsResponse>(invoke2, request2));
    const request3 = communityForumValidationServiceApi.PreviewForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { createdAt: req?.moderation?.audit?.createdAt },
            location: { postalCode: (reply1?.post?.billingAddress?.postalCode ?? "") },
          }],
        }],
      },
    });
    const invoke3: Unary<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse> =
      (input, done) => this.communityForumValidationClient.previewForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationValidationServiceApi.ScoreModerationResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      communityModerationValidationServiceApi.ScoreModerationResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      communityModerationValidationServiceApi.ScoreModerationResponse.fromPartial({ moderation: { audit: { etag: (reply3?.forum?.audit?.etag ?? "") } } }),
      communityModerationValidationServiceApi.ScoreModerationResponse.fromPartial({
        moderation: {
          assignee: req?.moderation?.assignee,
          moderationId: (req?.moderationId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a moderation.
   */
  async validateModeration(req: communityModerationValidationServiceApi.ValidateModerationRequest): Promise<communityModerationValidationServiceApi.ValidateModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "ValidateModeration", req);
    this.logger.info("validate_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.ExplainPostDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.moderation?.assignee?.email ?? "") } },
      post: { audit: { etag: (req?.moderation?.audit?.etag ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<communityPostValidationServiceApi.ExplainPostDecisionRequest, communityPostValidationServiceApi.ExplainPostDecisionResponse>(
      "acme.community.v1.ModerationValidationService/ValidateModeration:0", request1,
    );
    const request2 = communityBadgeValidationServiceApi.LintBadgesRequest.fromPartial({
      badge: {
        audit: { updatedAt: reply1?.post?.audit?.updatedAt },
        owner: { displayName: (reply1?.post?.counterparty?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
    });
    const invoke2: Unary<communityBadgeValidationServiceApi.LintBadgesRequest, communityBadgeValidationServiceApi.LintBadgesResponse> =
      (input, done) => this.communityBadgeValidationClient.lintBadges(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<communityBadgeValidationServiceApi.LintBadgesRequest, communityBadgeValidationServiceApi.LintBadgesResponse>(invoke2, request2));
    const request3 = notificationsSubscriptionExportServiceApi.StreamSubscriptionExportRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.post?.billingAddress?.region ?? "") },
    });
    const stream3 = this.notificationsSubscriptionExportClient.streamSubscriptionExport(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? notificationsSubscriptionExportServiceApi.StreamSubscriptionExportResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationValidationServiceApi.ValidateModerationResponse.fromPartial({
        moderation: { audit: { etag: (reply1?.post?.audit?.etag ?? "") } },
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
      }),
      communityModerationValidationServiceApi.ValidateModerationResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      communityModerationValidationServiceApi.ValidateModerationResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          subject: (req?.moderation?.subject ?? ""),
        },
      }),
    );
  }
}
