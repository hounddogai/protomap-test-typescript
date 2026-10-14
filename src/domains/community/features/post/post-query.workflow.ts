/**
 * Answers read-only questions about posts, for screens and reports. Remote work stays behind typed client ports.
 */

import * as communityBadgeCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityBadgeValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as communityForumQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityModerationCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityPostCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as communityPostValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { GrpcAdapter, call, forwarding, metadataFor, type RequestPort, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { CommunityRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate post operations and persist audit data.
 */
@injectable()
export class PostQueryWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists posts a page at a time.
   */
  async browsePosts(req: communityPostQueryServiceApi.BrowsePostsRequest): Promise<communityPostQueryServiceApi.BrowsePostsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowsePosts", req);
    this.logger.info("browse_posts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.NormalizePostRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      post: {
        audit: { createdAt: req?.filter?.createdAfter },
        billingAddress: { region: (req?.filter?.region ?? "") },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const method1 = "normalizePost" as const;
    const invoke1: Unary<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse> =
      (input, done) => this.communityPostValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityPostQueryServiceApi.BrowsePostsResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } });
  }

  /**
   * Counts posts by status.
   */
  async countPosts(req: communityPostQueryServiceApi.CountPostsRequest): Promise<communityPostQueryServiceApi.CountPostsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountPosts", req);
    this.logger.info("count_posts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityPostQueryServiceApi.CountPostsResponse.fromPartial({});
  }

  /**
   * Lists posts a page at a time.
   */
  async findPosts(req: communityPostQueryServiceApi.FindPostsRequest): Promise<communityPostQueryServiceApi.FindPostsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindPosts", req);
    this.logger.info("find_posts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeCalculationServiceApi.SimulateBadgeRequest.fromPartial({
      badge: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const proxy1 = forwarding(this.communityBadgeCalculationClient);
    const invoke1: Unary<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse> =
      (input, done) => proxy1.simulateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeCalculationServiceApi.SimulateBadgeRequest, communityBadgeCalculationServiceApi.SimulateBadgeResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (reply1?.badge?.action?.$case) {
      case "block":
        selected2_1 = ((reply1?.badge?.action?.$case === "block" ? reply1?.badge?.action.block : undefined)?.notifyEmail ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_3: string | undefined;
    switch (reply1?.badge?.action?.$case) {
      case "block":
        selected2_3 = ((reply1?.badge?.action?.$case === "block" ? reply1?.badge?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: { updatedBy: (reply1?.badge?.audit?.updatedBy ?? "") },
        action: { $case: "block", block: {
          notifyEmail: (selected2_1 ?? ""),
          reason: (selected2_3 ?? ""),
        } },
      },
    });
    const invoke2: Unary<notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest, notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient.pushSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionSyncServiceApi.PushSubscriptionRequest, notificationsSubscriptionSyncServiceApi.PushSubscriptionResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      communityPostQueryServiceApi.FindPostsResponse.fromPartial({
        posts: [{ lines: [{ description: (reply1?.badge?.description ?? "") }] }],
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      communityPostQueryServiceApi.FindPostsResponse.fromPartial({
        posts: [{
          audit: { etag: (reply2?.subscription?.audit?.etag ?? "") },
          counterparty: { displayName: (reply2?.subscription?.owner?.displayName ?? "") },
        }],
      }),
    );
  }

  /**
   * Returns a post.
   */
  async lookupPost(req: communityPostQueryServiceApi.LookupPostRequest): Promise<communityPostQueryServiceApi.LookupPostResponse> {
    validateContext(req.context);
    if (!req.postId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "post_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupPost", req);
    this.logger.info("lookup_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationCalculationServiceApi.ExplainModerationCalculationRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      moderation: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<communityModerationCalculationServiceApi.ExplainModerationCalculationRequest, communityModerationCalculationServiceApi.ExplainModerationCalculationResponse> =
      (input, done) => this.communityModerationCalculationClient.explainModerationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationCalculationServiceApi.ExplainModerationCalculationRequest, communityModerationCalculationServiceApi.ExplainModerationCalculationResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = communityBadgeValidationServiceApi.ValidateBadgeRequest.fromPartial({
      badge: {
        audit: { createdBy: (reply1?.moderation?.audit?.createdBy ?? "") },
        owner: {
          email: ((reply1?.moderation?.origin?.$case === "customer" ? reply1?.moderation?.origin.customer : undefined)?.email ?? ""),
        },
      },
      context: input2?.context,
      details: { contact: { email: (reply1?.moderation?.assignee?.email ?? "") } },
    });
    const invoke2: Unary<communityBadgeValidationServiceApi.ValidateBadgeRequest, communityBadgeValidationServiceApi.ValidateBadgeResponse> =
      (input, done) => this.communityBadgeValidationClient.validateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityBadgeValidationServiceApi.ValidateBadgeRequest, communityBadgeValidationServiceApi.ValidateBadgeResponse>(invoke2, request2);
    return mergeResponses(
      communityPostQueryServiceApi.LookupPostResponse.fromPartial({
        post: {
          audit: { etag: (reply1?.moderation?.audit?.etag ?? "") },
          counterparty: {
            email: ((reply1?.moderation?.origin?.$case === "customer" ? reply1?.moderation?.origin.customer : undefined)?.email ?? ""),
          },
        },
      }),
      communityPostQueryServiceApi.LookupPostResponse.fromPartial({
        post: {
          lines: [{
            tax: {
              amount: (reply2?.badge?.action?.$case === "discount" ? reply2?.badge?.action.discount : undefined)?.amount,
            },
          }],
        },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      communityPostQueryServiceApi.LookupPostResponse.fromPartial({ post: { postId: (req?.postId ?? "") } }),
    );
  }

  /**
   * Returns several posts at once.
   */
  async resolvePosts(req: communityPostQueryServiceApi.ResolvePostsRequest): Promise<communityPostQueryServiceApi.ResolvePostsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolvePosts", req);
    this.logger.info("resolve_posts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromPartial({
      context: req?.context,
      post: { counterparty: { email: (req?.context?.actor?.email ?? "") } },
    });
    const cloned1: communityPostCalculationServiceApi.ComparePostOptionsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse> =
      (input, done) => this.communityPostCalculationClient.comparePostOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(invoke1, cloned1);
    return communityPostQueryServiceApi.ResolvePostsResponse.fromPartial({
      posts: [{
        audit: { updatedAt: reply1?.post?.audit?.updatedAt },
        billingAddress: reply1?.post?.billingAddress,
      }],
    });
  }

  /**
   * Summarizes a post.
   */
  async summarizePosts(req: communityPostQueryServiceApi.SummarizePostsRequest): Promise<communityPostQueryServiceApi.SummarizePostsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizePosts", req);
    this.logger.info("summarize_posts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationCalculationServiceApi.CompareModerationOptionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      moderation: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        origin: { $case: "customer", customer: { email: (req?.context?.actor?.email ?? "") } },
      },
      reason: (req?.reason ?? ""),
    });
    const decoded1 = communityModerationCalculationServiceApi.CompareModerationOptionsRequest.fromJSON(
      JSON.parse(JSON.stringify(communityModerationCalculationServiceApi.CompareModerationOptionsRequest.toJSON(request1))),
    );
    const invoke1: Unary<communityModerationCalculationServiceApi.CompareModerationOptionsRequest, communityModerationCalculationServiceApi.CompareModerationOptionsResponse> =
      (input, done) => this.communityModerationCalculationClient.compareModerationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationCalculationServiceApi.CompareModerationOptionsRequest, communityModerationCalculationServiceApi.CompareModerationOptionsResponse>(invoke1, decoded1);
    const request2 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      post: { audit: { createdAt: reply1?.moderation?.audit?.createdAt } },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.SimulatePostRequest",
      value: Buffer.from(communityPostCalculationServiceApi.SimulatePostRequest.encode(request2).finish()),
    });
    const unpacked2 = communityPostCalculationServiceApi.SimulatePostRequest.decode(envelope2.value);
    const invoke2: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient.simulatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>(invoke2, unpacked2);
    const request3 = communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest.fromPartial({
      badge: {
        audit: {
          createdAt: reply1?.moderation?.audit?.createdAt,
          updatedBy: (reply1?.moderation?.audit?.updatedBy ?? ""),
        },
      },
      context: req?.context,
    });
    const client3 = this.clients.get<communityBadgeValidationServiceApi.BadgeValidationServiceClient>("acme.community.v1.BadgeValidationService");
    const invoke3: Unary<communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest, communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse> =
      (input, done) => client3.explainBadgeDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest, communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse>(invoke3, request3);
    const request4 = communityForumQueryServiceApi.FindForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.post?.audit?.updatedAt,
        region: (reply2?.post?.billingAddress?.region ?? ""),
      },
    });
    const invoke4: Unary<communityForumQueryServiceApi.FindForumsRequest, communityForumQueryServiceApi.FindForumsResponse> =
      (input, done) => this.communityForumQueryClient.findForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<communityForumQueryServiceApi.FindForumsRequest, communityForumQueryServiceApi.FindForumsResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      communityPostQueryServiceApi.SummarizePostsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      communityPostQueryServiceApi.SummarizePostsResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      communityPostQueryServiceApi.SummarizePostsResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      communityPostQueryServiceApi.SummarizePostsResponse.fromPartial({ result: { status: (reply4?.result?.status ?? "") } }),
      communityPostQueryServiceApi.SummarizePostsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
