/**
 * Answers read-only questions about forums, for screens and reports. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityBadgeValidationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as communityForumQueryServiceApi from "../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { CommunityRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate forum operations and persist audit data.
 */
@injectable()
export class ForumQueryWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists forums a page at a time.
   */
  async browseForums(req: communityForumQueryServiceApi.BrowseForumsRequest): Promise<communityForumQueryServiceApi.BrowseForumsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseForums", req);
    this.logger.info("browse_forums", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.NormalizePostRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
      post: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>(
      "acme.community.v1.ForumQueryService/BrowseForums:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityForumQueryServiceApi.BrowseForumsResponse.fromPartial({
      forums: [{
        children: [{
          audit: { createdAt: reply1?.post?.audit?.createdAt },
          children: [{
            location: { locality: (reply1?.post?.billingAddress?.locality ?? "") },
          }],
        }],
      }],
    });
  }

  /**
   * Streams every matching forum.
   */
  async exportForums(req: communityForumQueryServiceApi.ExportForumsRequest): Promise<communityForumQueryServiceApi.ExportForumsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportForums", req);
    this.logger.info("export_forums", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.ScoreForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{ manager: { userId: (req?.context?.actor?.userId ?? "") } }],
          location: { region: (req?.filter?.region ?? "") },
        }],
      },
    });
    const invoke1: Unary<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse> =
      (input, done) => this.communityForumValidationClient.scoreForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      communityForumQueryServiceApi.ExportForumsResponse.fromPartial({
        forum: {
          children: [{
            children: [{
              location: { countryCode: (reply1?.forum?.location?.countryCode ?? "") },
            }],
          }],
        },
      }),
      communityForumQueryServiceApi.ExportForumsResponse.fromPartial({ forum: { location: { region: (req?.filter?.region ?? "") } } }),
    );
  }

  /**
   * Lists forums a page at a time.
   */
  async findForums(req: communityForumQueryServiceApi.FindForumsRequest): Promise<communityForumQueryServiceApi.FindForumsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindForums", req);
    this.logger.info("find_forums", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityForumQueryServiceApi.FindForumsResponse.fromPartial({});
  }

  /**
   * Returns a forum.
   */
  async lookupForum(req: communityForumQueryServiceApi.LookupForumRequest): Promise<communityForumQueryServiceApi.LookupForumResponse> {
    validateContext(req.context);
    if (!req.forumId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "forum_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupForum", req);
    this.logger.info("lookup_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.ValidateForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            forumId: (req?.forumId ?? ""),
            manager: {
              email: (req?.context?.actor?.email ?? ""),
              userId: (req?.context?.actor?.userId ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<communityForumValidationServiceApi.ValidateForumRequest, communityForumValidationServiceApi.ValidateForumResponse> =
      (input, done) => this.communityForumValidationClient.validateForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<communityForumValidationServiceApi.ValidateForumResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = communityPostValidationServiceApi.PreviewPostRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: { countryCode: (reply1?.forum?.location?.countryCode ?? "") },
      },
    });
    const invoke2: Unary<communityPostValidationServiceApi.PreviewPostRequest, communityPostValidationServiceApi.PreviewPostResponse> =
      (input, done) => this.communityPostValidationClient.previewPost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    return mergeResponses(
      communityForumQueryServiceApi.LookupForumResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      communityForumQueryServiceApi.LookupForumResponse.fromPartial({
        forum: { audit: { createdBy: (reply2?.post?.audit?.createdBy ?? "") } },
      }),
      communityForumQueryServiceApi.LookupForumResponse.fromPartial({ forum: { forumId: (req?.forumId ?? "") } }),
    );
  }

  /**
   * Returns a forum.
   */
  async peekForum(req: communityForumQueryServiceApi.PeekForumRequest): Promise<communityForumQueryServiceApi.PeekForumResponse> {
    validateContext(req.context);
    if (!req.forumId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "forum_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekForum", req);
    this.logger.info("peek_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    return communityForumQueryServiceApi.PeekForumResponse.fromPartial({ forum: { forumId: (req?.forumId ?? "") } });
  }

  /**
   * Summarizes a forum.
   */
  async summarizeForums(req: communityForumQueryServiceApi.SummarizeForumsRequest): Promise<communityForumQueryServiceApi.SummarizeForumsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeForums", req);
    this.logger.info("summarize_forums", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest.fromPartial({
      badge: { action: { $case: "block", block: { reason: (req?.reason ?? "") } } },
      context: req?.context,
    });
    const invoke1: Unary<communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest, communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse> =
      (input, done) => this.communityBadgeValidationClient.explainBadgeDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: {
          createdAt: reply1?.badge?.audit?.createdAt,
          createdBy: (reply1?.badge?.audit?.createdBy ?? ""),
        },
      },
    });
    const method2 = "simulatePost" as const;
    const invoke2: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>(invoke2, request2);
    const request3 = authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest.fromPartial({
      context: req?.context,
      details: { format: (req?.details?.format ?? "") },
      reason: (req?.reason ?? ""),
    });
    const proxy3 = forwarding(this.authorizationAccessPolicyQueryClient);
    const invoke3: Unary<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse> =
      (input, done) => proxy3.summarizeAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      communityForumQueryServiceApi.SummarizeForumsResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      communityForumQueryServiceApi.SummarizeForumsResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      communityForumQueryServiceApi.SummarizeForumsResponse.fromPartial({ downloadUri: (reply3?.downloadUri ?? "") }),
      communityForumQueryServiceApi.SummarizeForumsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for ForumQueryService; workflows own validation and database transactions.
 */
@injectable()
export class ForumQueryHandler {
  constructor(@inject(ForumQueryWorkflow) private readonly workflow: ForumQueryWorkflow) {}

  /**
   * Lists forums a page at a time.
   */
  browseForums = unary<communityForumQueryServiceApi.BrowseForumsRequest, communityForumQueryServiceApi.BrowseForumsResponse>(
    (request) => this.workflow.browseForums(request),
  );

  /**
   * Streams every matching forum.
   */
  exportForums = serverStream<communityForumQueryServiceApi.ExportForumsRequest, communityForumQueryServiceApi.ExportForumsResponse>(
    (request) => this.workflow.exportForums(request),
  );

  /**
   * Lists forums a page at a time.
   */
  findForums = (call: ServerUnaryCall<communityForumQueryServiceApi.FindForumsRequest, communityForumQueryServiceApi.FindForumsResponse>, done: sendUnaryData<communityForumQueryServiceApi.FindForumsResponse>): void => {
    void this.workflow.findForums(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a forum.
   */
  lookupForum = unary<communityForumQueryServiceApi.LookupForumRequest, communityForumQueryServiceApi.LookupForumResponse>(
    (request) => this.workflow.lookupForum(request),
  );

  /**
   * Returns a forum.
   */
  peekForum = unary<communityForumQueryServiceApi.PeekForumRequest, communityForumQueryServiceApi.PeekForumResponse>(
    (request) => this.workflow.peekForum(request),
  );

  /**
   * Summarizes a forum.
   */
  summarizeForums = (call: ServerUnaryCall<communityForumQueryServiceApi.SummarizeForumsRequest, communityForumQueryServiceApi.SummarizeForumsResponse>, done: sendUnaryData<communityForumQueryServiceApi.SummarizeForumsResponse>): void => {
    void this.workflow.summarizeForums(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ForumQueryHandler): communityForumQueryServiceApi.ForumQueryServiceServer {
  return {
    browseForums: handler.browseForums,
    exportForums: handler.exportForums,
    findForums: handler.findForums,
    lookupForum: handler.lookupForum,
    peekForum: handler.peekForum,
    summarizeForums: handler.summarizeForums,
  };
}
