/**
 * Routes moderations through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityBadgeApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityForumApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityForumServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityModerationApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as communityModerationCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityModerationLifecycleServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_lifecycle_service.js";
import * as communityPostWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as merchandisingCollectionQueryServiceApi from "../../../../../.cache/proto/acme/merchandising/v1/collection_query_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary, workflow } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toModerationRecord } from "../../data/records.js";
import { CommunityRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate moderation operations and persist audit data.
 */
@injectable()
export class ModerationApprovalWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.community.v1.ModerationLifecycleService") private readonly communityModerationLifecycleClient: communityModerationLifecycleServiceApi.ModerationLifecycleServiceClient,
    @inject("grpc:acme.community.v1.PostWorkflowService") private readonly communityPostWorkflowClient: communityPostWorkflowServiceApi.PostWorkflowServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobCalculationService") private readonly mediaTranscodeJobCalculationClient: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient,
    @inject("grpc:acme.merchandising.v1.CollectionQueryService") private readonly merchandisingCollectionQueryClient: merchandisingCollectionQueryServiceApi.CollectionQueryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a moderation.
   */
  async approveModeration(req: communityModerationApprovalServiceApi.ApproveModerationRequest): Promise<communityModerationApprovalServiceApi.ApproveModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "ApproveModeration", req);
    this.logger.info("approve_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationCalculationServiceApi.CalculateModerationRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: { email: (req?.details?.approver?.email ?? "") },
        requester: { email: (req?.moderation?.assignee?.email ?? "") },
      },
    });
    const invoke1: Unary<communityModerationCalculationServiceApi.CalculateModerationRequest, communityModerationCalculationServiceApi.CalculateModerationResponse> =
      (input, done) => this.communityModerationCalculationClient.calculateModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ApproveModeration.CalculateModeration", () => call<communityModerationCalculationServiceApi.CalculateModerationRequest, communityModerationCalculationServiceApi.CalculateModerationResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationApprovalServiceApi.ApproveModerationResponse.fromPartial({ moderation: { status: reply1?.moderation?.status } }),
      communityModerationApprovalServiceApi.ApproveModerationResponse.fromPartial({
        moderation: { moderationId: (req?.moderationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Comments a moderation.
   */
  async commentModerationApproval(req: communityModerationApprovalServiceApi.CommentModerationApprovalRequest): Promise<communityModerationApprovalServiceApi.CommentModerationApprovalResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "CommentModerationApproval", req);
    this.logger.info("comment_moderation_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.CalculateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { etag: (req?.moderation?.audit?.etag ?? "") },
        participants: [{
          contact: {
            phone: (req?.moderation?.requester?.phone ?? ""),
            preferredChannel: (req?.moderation?.requester?.preferredChannel ?? ""),
          },
        }],
      },
    });
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.calculateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = communityPostWorkflowServiceApi.AdvancePostWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { phone: (req?.moderation?.requester?.phone ?? "") } },
      post: {
        billingAddress: {
          lines: (reply1?.experiment?.location?.lines ?? []).map((value) => value),
          recipient: (reply1?.experiment?.location?.recipient ?? ""),
          region: (reply1?.experiment?.location?.region ?? ""),
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<communityPostWorkflowServiceApi.AdvancePostWorkflowRequest, communityPostWorkflowServiceApi.AdvancePostWorkflowResponse>(
      "acme.community.v1.ModerationApprovalService/CommentModerationApproval:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationApprovalServiceApi.CommentModerationApprovalResponse.fromPartial({
        moderation: { audit: { updatedBy: (reply1?.experiment?.audit?.updatedBy ?? "") } },
      }),
      communityModerationApprovalServiceApi.CommentModerationApprovalResponse.fromPartial({
        moderation: { comments: [{ createdAt: reply2?.post?.audit?.createdAt }] },
        outcome: { status: (reply2?.outcome?.status ?? "") },
      }),
      communityModerationApprovalServiceApi.CommentModerationApprovalResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          priority: (req?.moderation?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Delegates a moderation.
   */
  async delegateModerationApproval(req: communityModerationApprovalServiceApi.DelegateModerationApprovalRequest): Promise<communityModerationApprovalServiceApi.DelegateModerationApprovalResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "DelegateModerationApproval", req);
    this.logger.info("delegate_moderation_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.moderation?.origin?.$case) {
      case "customer":
        selected1_1 = ((req?.moderation?.origin?.$case === "customer" ? req?.moderation?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = personalizationAffinityCalculationServiceApi.SimulateAffinityRequest.fromPartial({
      affinity: { subject: { displayName: (selected1_1 ?? "") } },
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<personalizationAffinityCalculationServiceApi.SimulateAffinityRequest, personalizationAffinityCalculationServiceApi.SimulateAffinityResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.simulateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityCalculationServiceApi.SimulateAffinityRequest, personalizationAffinityCalculationServiceApi.SimulateAffinityResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      communityModerationApprovalServiceApi.DelegateModerationApprovalResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      communityModerationApprovalServiceApi.DelegateModerationApprovalResponse.fromPartial({
        moderation: { moderationId: (req?.moderationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Escalates a moderation.
   */
  async escalateModeration(req: communityModerationApprovalServiceApi.EscalateModerationRequest): Promise<communityModerationApprovalServiceApi.EscalateModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "EscalateModeration", req);
    this.logger.info("escalate_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: { createdBy: (req?.moderation?.audit?.createdBy ?? "") },
        owner: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
      details: {
        contact: {
          email: (req?.moderation?.assignee?.email ?? ""),
          phone: (req?.moderation?.requester?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse> =
      (input, done) => this.customersCustomerSegmentValidationClient.lintCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = communityBadgeApprovalServiceApi.EscalateBadgeRequest.fromPartial({
      badge: {
        audit: { createdAt: req?.moderation?.audit?.createdAt },
        owner: { email: (req?.details?.approver?.email ?? "") },
        action: { $case: "route", route: {
          weight: ((reply1?.customerSegment?.action?.$case === "route" ? reply1?.customerSegment?.action.route : undefined)?.weight ?? 0),
        } },
      },
      context: req?.context,
      details: { approver: { email: (req?.moderation?.requester?.email ?? "") } },
    });
    const invoke2: Unary<communityBadgeApprovalServiceApi.EscalateBadgeRequest, communityBadgeApprovalServiceApi.EscalateBadgeResponse> =
      (input, done) => this.communityBadgeApprovalClient.escalateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = communityModerationLifecycleServiceApi.GetModerationLifecycleRequest.fromPartial({
      context: req?.context,
      moderationId: (req?.moderation?.moderationId ?? ""),
    });
    const invoke3: Unary<communityModerationLifecycleServiceApi.GetModerationLifecycleRequest, communityModerationLifecycleServiceApi.GetModerationLifecycleResponse> =
      (input, done) => this.communityModerationLifecycleClient.getModerationLifecycle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = merchandisingCollectionQueryServiceApi.FindCollectionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.customerSegment?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: ((reply3?.moderation?.origin?.$case === "customer" ? reply3?.moderation?.origin.customer : undefined)?.customerId ?? ""),
      },
    });
    const method4 = "findCollections" as const;
    const invoke4: Unary<merchandisingCollectionQueryServiceApi.FindCollectionsRequest, merchandisingCollectionQueryServiceApi.FindCollectionsResponse> =
      (input, done) => this.merchandisingCollectionQueryClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<merchandisingCollectionQueryServiceApi.FindCollectionsRequest, merchandisingCollectionQueryServiceApi.FindCollectionsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationApprovalServiceApi.EscalateModerationResponse.fromPartial({
        moderation: { comments: [{ createdAt: reply1?.customerSegment?.audit?.createdAt }] },
      }),
      communityModerationApprovalServiceApi.EscalateModerationResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      communityModerationApprovalServiceApi.EscalateModerationResponse.fromPartial({
        moderation: {
          audit: { updatedAt: reply3?.moderation?.audit?.updatedAt },
          sla: { pausedFor: reply3?.moderation?.sla?.pausedFor },
        },
      }),
      communityModerationApprovalServiceApi.EscalateModerationResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      communityModerationApprovalServiceApi.EscalateModerationResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          requester: req?.moderation?.requester,
        },
      }),
    );
  }

  /**
   * Lists moderations a page at a time.
   */
  async listPendingModerations(req: communityModerationApprovalServiceApi.ListPendingModerationsRequest): Promise<communityModerationApprovalServiceApi.ListPendingModerationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingModerations", req);
    this.logger.info("list_pending_moderations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersHouseholdQueryServiceApi.BrowseHouseholdsRequest.fromPartial({
      context: req?.context,
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const proxy1 = forwarding(this.customersHouseholdQueryClient);
    const invoke1: Unary<customersHouseholdQueryServiceApi.BrowseHouseholdsRequest, customersHouseholdQueryServiceApi.BrowseHouseholdsResponse> =
      (input, done) => proxy1.browseHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersHouseholdQueryServiceApi.BrowseHouseholdsRequest, customersHouseholdQueryServiceApi.BrowseHouseholdsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityModerationApprovalServiceApi.ListPendingModerationsResponse.fromPartial({
      pageInfo: { totalSize: (reply1?.pageInfo?.totalSize ?? 0) },
      result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
    });
  }

  /**
   * Recalls a moderation.
   */
  async recallModeration(req: communityModerationApprovalServiceApi.RecallModerationRequest): Promise<communityModerationApprovalServiceApi.RecallModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "RecallModeration", req);
    this.logger.info("recall_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        origin: { $case: "customer", customer: { email: (req?.moderation?.requester?.email ?? "") } },
        requester: {
          preferredChannel: (req?.moderation?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobCalculationClient.quoteTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.QuoteTranscodeJobResponse>(invoke1, request1);
    const request2 = communityForumApprovalServiceApi.ListPendingForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.moderation?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse> =
      (input, done) => this.communityForumApprovalClient.listPendingForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationApprovalServiceApi.RecallModerationResponse.fromPartial({
        moderation: { assignee: { userId: (reply1?.transcodeJob?.assignee?.userId ?? "") } },
      }),
      communityModerationApprovalServiceApi.RecallModerationResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      communityModerationApprovalServiceApi.RecallModerationResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          requester: req?.moderation?.requester,
        },
      }),
    );
  }

  /**
   * Rejects a moderation.
   */
  async rejectModeration(req: communityModerationApprovalServiceApi.RejectModerationRequest): Promise<communityModerationApprovalServiceApi.RejectModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "RejectModeration", req);
    this.logger.info("reject_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityBadgeCalculationServiceApi.QuoteBadgeRequest.fromPartial({
      badge: {
        audit: { updatedBy: (input1?.moderation?.audit?.updatedBy ?? "") },
        owner: { displayName: (input1?.moderation?.assignee?.displayName ?? "") },
      },
      context: input1?.context,
    });
    const invoke1: Unary<communityBadgeCalculationServiceApi.QuoteBadgeRequest, communityBadgeCalculationServiceApi.QuoteBadgeResponse> =
      (input, done) => this.communityBadgeCalculationClient.quoteBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeCalculationServiceApi.QuoteBadgeRequest, communityBadgeCalculationServiceApi.QuoteBadgeResponse>(invoke1, request1);
    const request2 = communityForumServiceApi.SearchForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.badge?.audit?.updatedAt,
        ownerId: (req?.moderation?.sla?.policyId ?? ""),
      },
    });
    const cloned2: communityForumServiceApi.SearchForumsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<communityForumServiceApi.SearchForumsRequest, communityForumServiceApi.SearchForumsResponse> =
      (input, done) => this.communityForumClient.searchForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumServiceApi.SearchForumsRequest, communityForumServiceApi.SearchForumsResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationApprovalServiceApi.RejectModerationResponse.fromPartial({
        moderation: { assignee: { email: (reply1?.badge?.owner?.email ?? "") } },
      }),
      communityModerationApprovalServiceApi.RejectModerationResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      communityModerationApprovalServiceApi.RejectModerationResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          subject: (req?.moderation?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a moderation.
   */
  async submitModeration(req: communityModerationApprovalServiceApi.SubmitModerationRequest): Promise<communityModerationApprovalServiceApi.SubmitModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "SubmitModeration", req);
    this.logger.info("submit_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: { createdAt: req?.moderation?.audit?.createdAt },
        owner: { email: (req?.moderation?.requester?.email ?? "") },
      },
      details: {
        contact: {
          email: ((req?.moderation?.origin?.$case === "customer" ? req?.moderation?.origin.customer : undefined)?.email ?? ""),
          name: req?.moderation?.requester?.name,
        },
      },
    });
    const decoded1 = customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.fromJSON(
      JSON.parse(JSON.stringify(customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.toJSON(request1))),
    );
    const invoke1: Unary<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse> =
      (input, done) => this.customersCustomerSegmentValidationClient.lintCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse>(invoke1, decoded1);
    const request2 = authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.customerSegment?.parameters ?? {}))),
        period: reply1?.customerSegment?.effective,
      },
      reason: ((reply1?.customerSegment?.action?.$case === "block" ? reply1?.customerSegment?.action.block : undefined)?.reason ?? ""),
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.authorization.v1.SummarizeAccessPoliciesRequest",
      value: Buffer.from(authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest.encode(request2).finish()),
    });
    const unpacked2 = authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest.decode(envelope2.value);
    const invoke2: Unary<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.summarizeAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse>(invoke2, unpacked2);
    const request3 = ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        audit: { updatedBy: (reply1?.customerSegment?.audit?.updatedBy ?? "") },
        contact: {
          preferredChannel: (req?.moderation?.requester?.preferredChannel ?? ""),
        },
        holder: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const client3 = this.clients.get<ledgerLedgerAccountServiceApi.LedgerAccountServiceClient>("acme.ledger.v1.LedgerAccountService");
    const invoke3: Unary<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse> =
      (input, done) => client3.createLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationApprovalServiceApi.SubmitModerationResponse.fromPartial({
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      communityModerationApprovalServiceApi.SubmitModerationResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      communityModerationApprovalServiceApi.SubmitModerationResponse.fromPartial({
        moderation: {
          assignee: {
            displayName: (reply3?.ledgerAccount?.holder?.displayName ?? ""),
            email: (reply3?.ledgerAccount?.contact?.email ?? ""),
          },
        },
      }),
      communityModerationApprovalServiceApi.SubmitModerationResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          subject: (req?.moderation?.subject ?? ""),
        },
      }),
    );
  }
}
