/**
 * Manages forums: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as communityBadgeCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityForumQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityForumServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityForumValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as identityUserQueryServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as seatingSeatMapQueryServiceApi from "../../../../../.cache/proto/acme/seating/v1/seat_map_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
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
import { toForumRecord } from "../../data/records.js";
import { CommunityRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate forum operations and persist audit data.
 */
@injectable()
export class ForumWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostQueryService") private readonly communityPostQueryClient: communityPostQueryServiceApi.PostQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.seating.v1.SeatMapQueryService") private readonly seatingSeatMapQueryClient: seatingSeatMapQueryServiceApi.SeatMapQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of forums and answers once at the end.
   */
  async batchCreateForums(req: communityForumServiceApi.BatchCreateForumsRequest): Promise<communityForumServiceApi.BatchCreateForumsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateForums", req);
    this.logger.info("batch_create_forums", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_1 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.location?.recipient ?? "");
        break;
      default:
        selected1_1 = "";
    }
    let selected1_2: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_2 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.manager?.displayName ?? "");
        break;
      default:
        selected1_2 = "";
    }
    let selected1_3: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected1_3 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromPartial({
      context: req?.context,
      details: { destination: { recipient: (selected1_1 ?? "") } },
      post: {
        counterparty: {
          displayName: (selected1_2 ?? ""),
          email: (selected1_3 ?? ""),
        },
      },
    });
    const invoke1: Unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse> =
      (input, done) => this.communityPostCalculationClient.comparePostOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(invoke1, request1);
    const request2 = notificationsNotificationCalculationServiceApi.SimulateNotificationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (reply1?.post?.billingAddress?.lines ?? []).map((value) => value),
        },
      },
      notification: {
        assignee: { displayName: (reply1?.post?.counterparty?.displayName ?? "") },
        requester: {
          phone: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.phone ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsNotificationCalculationServiceApi.SimulateNotificationRequest, notificationsNotificationCalculationServiceApi.SimulateNotificationResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.simulateNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationCalculationServiceApi.SimulateNotificationRequest, notificationsNotificationCalculationServiceApi.SimulateNotificationResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      communityForumServiceApi.BatchCreateForumsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      communityForumServiceApi.BatchCreateForumsResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
    );
  }

  /**
   * Creates a forum.
   */
  async cloneForum(req: communityForumServiceApi.CloneForumRequest): Promise<communityForumServiceApi.CloneForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "CloneForum", req);
    this.logger.info("clone_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsRequest.fromPartial({
      context: input1?.context,
      details: {
        destination: { countryCode: (input1?.forum?.location?.countryCode ?? "") },
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsRequest, notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.recalculateDeliveryAttempts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsRequest, notificationsDeliveryAttemptCalculationServiceApi.RecalculateDeliveryAttemptsResponse>(invoke1, request1);
    const request2 = communityForumValidationServiceApi.ScoreForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            location: {
              countryCode: (req?.forum?.location?.countryCode ?? ""),
              recipient: (req?.forum?.location?.recipient ?? ""),
            },
          }],
          manager: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
        }],
      },
    });
    const cloned2: communityForumValidationServiceApi.ScoreForumRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse> =
      (input, done) => this.communityForumValidationClient.scoreForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse>(invoke2, cloned2);
    const request3 = identityUserQueryServiceApi.BrowseUsersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.forum?.audit?.createdAt,
        ownerId: (reply2?.forum?.parentId ?? ""),
        region: (req?.forum?.location?.region ?? ""),
      },
    });
    const decoded3 = identityUserQueryServiceApi.BrowseUsersRequest.fromJSON(
      JSON.parse(JSON.stringify(identityUserQueryServiceApi.BrowseUsersRequest.toJSON(request3))),
    );
    const invoke3: Unary<identityUserQueryServiceApi.BrowseUsersRequest, identityUserQueryServiceApi.BrowseUsersResponse> =
      (input, done) => this.identityUserQueryClient.browseUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<identityUserQueryServiceApi.BrowseUsersRequest, identityUserQueryServiceApi.BrowseUsersResponse>(invoke3, decoded3);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      communityForumServiceApi.CloneForumResponse.fromPartial({
        forum: {
          children: [{
            manager: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
          }],
        },
      }),
      communityForumServiceApi.CloneForumResponse.fromPartial({ forum: { audit: { updatedAt: reply2?.forum?.audit?.updatedAt } } }),
      communityForumServiceApi.CloneForumResponse.fromPartial({
        result: {
          referenceIds: (reply3?.result?.referenceIds ?? []),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      communityForumServiceApi.CloneForumResponse.fromPartial({
        forum: {
          depth: (req?.forum?.depth ?? 0),
          manager: req?.forum?.manager,
        },
      }),
    );
  }

  /**
   * Creates a forum.
   */
  async createForum(req: communityForumServiceApi.CreateForumRequest): Promise<communityForumServiceApi.CreateForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "CreateForum", req);
    this.logger.info("create_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostQueryServiceApi.ResolvePostsRequest.fromPartial({ context: req?.context });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.ResolvePostsRequest",
      value: Buffer.from(communityPostQueryServiceApi.ResolvePostsRequest.encode(request1).finish()),
    });
    const unpacked1 = communityPostQueryServiceApi.ResolvePostsRequest.decode(envelope1.value);
    const invoke1: Unary<communityPostQueryServiceApi.ResolvePostsRequest, communityPostQueryServiceApi.ResolvePostsResponse> =
      (input, done) => this.communityPostQueryClient.resolvePosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostQueryServiceApi.ResolvePostsRequest, communityPostQueryServiceApi.ResolvePostsResponse>(invoke1, unpacked1);
    const request2 = communityPostCalculationServiceApi.CalculatePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: {
          createdBy: (req?.forum?.audit?.createdBy ?? ""),
          updatedBy: (req?.forum?.audit?.updatedBy ?? ""),
        },
        billingAddress: { locality: (req?.forum?.location?.locality ?? "") },
        counterparty: { email: (req?.forum?.manager?.email ?? "") },
      },
    });
    const client2 = this.clients.get<communityPostCalculationServiceApi.PostCalculationServiceClient>("acme.community.v1.PostCalculationService");
    const invoke2: Unary<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse> =
      (input, done) => client2.calculatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      communityForumServiceApi.CreateForumResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      communityForumServiceApi.CreateForumResponse.fromPartial({
        forum: {
          children: [{ audit: { createdBy: (reply2?.post?.audit?.createdBy ?? "") } }],
        },
      }),
      communityForumServiceApi.CreateForumResponse.fromPartial({
        forum: {
          forumId: (req?.forum?.forumId ?? ""),
          manager: req?.forum?.manager,
        },
      }),
    );
  }

  /**
   * Deletes a forum.
   */
  async deleteForum(req: communityForumServiceApi.DeleteForumRequest): Promise<communityForumServiceApi.DeleteForumResponse> {
    validateContext(req.context);
    if (!req.forumId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "forum_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteForum", req);
    this.logger.info("delete_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeCalculationServiceApi.RecalculateBadgesRequest.fromPartial({
      badge: { audit: { etag: (req?.etag ?? "") } },
      context: req?.context,
    });
    const invoke1: Unary<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse> =
      (input, done) => this.communityBadgeCalculationClient.recalculateBadges(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = communityForumValidationServiceApi.LintForumsRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          audit: { createdBy: (reply1?.badge?.audit?.createdBy ?? "") },
          children: [{
            audit: {
              etag: (reply1?.badge?.audit?.etag ?? ""),
              updatedAt: reply1?.badge?.audit?.updatedAt,
            },
          }],
        }],
      },
    });
    const invoke2: Unary<communityForumValidationServiceApi.LintForumsRequest, communityForumValidationServiceApi.LintForumsResponse> =
      (input, done) => this.communityForumValidationClient.lintForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<communityForumValidationServiceApi.LintForumsRequest, communityForumValidationServiceApi.LintForumsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumServiceApi.DeleteForumResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      communityForumServiceApi.DeleteForumResponse.fromPartial({ effectiveAt: reply2?.outcome?.effectiveAt }),
    );
  }

  /**
   * Returns a forum.
   */
  async getForum(req: communityForumServiceApi.GetForumRequest): Promise<communityForumServiceApi.GetForumResponse> {
    validateContext(req.context);
    if (!req.forumId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "forum_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetForum", req);
    this.logger.info("get_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    return communityForumServiceApi.GetForumResponse.fromPartial({ forum: { forumId: (req?.forumId ?? "") } });
  }

  /**
   * Lists forums a page at a time.
   */
  async listForums(req: communityForumServiceApi.ListForumsRequest): Promise<communityForumServiceApi.ListForumsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListForums", req);
    this.logger.info("list_forums", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.CheckForumEligibilityRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{ children: [{ location: { region: (req?.filter?.region ?? "") } }] }],
      },
    });
    const invoke1: Unary<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse> =
      (input, done) => this.communityForumValidationClient.checkForumEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ListForums.CheckForumEligibility", () => call<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityForumServiceApi.ListForumsResponse.fromPartial({
      forums: [{
        children: [{ location: { lines: (reply1?.forum?.location?.lines ?? []) } }],
        depth: (reply1?.forum?.depth ?? 0),
      }],
    });
  }

  /**
   * Lists forums a page at a time.
   */
  async searchForums(req: communityForumServiceApi.SearchForumsRequest): Promise<communityForumServiceApi.SearchForumsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchForums", req);
    this.logger.info("search_forums", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityForumServiceApi.SearchForumsResponse.fromPartial({});
  }

  /**
   * Changes a forum.
   */
  async updateForum(req: communityForumServiceApi.UpdateForumRequest): Promise<communityForumServiceApi.UpdateForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "UpdateForum", req);
    this.logger.info("update_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumQueryServiceApi.ExportForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.forum?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.forum?.attributes ?? {}))),
        region: (req?.forum?.location?.region ?? ""),
      },
    });
    const stream1 = this.communityForumQueryClient.exportForums(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? communityForumQueryServiceApi.ExportForumsResponse.fromPartial({});
    const request2 = seatingSeatMapQueryServiceApi.SuggestSeatMapsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.forum?.audit?.createdAt,
        ownerId: (req?.forum?.manager?.userId ?? ""),
        region: (req?.forum?.location?.region ?? ""),
      },
    });
    const invoke2: Unary<seatingSeatMapQueryServiceApi.SuggestSeatMapsRequest, seatingSeatMapQueryServiceApi.SuggestSeatMapsResponse> =
      (input, done) => this.seatingSeatMapQueryClient.suggestSeatMaps(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.forum?.audit?.etag ?? "") });
    return mergeResponses(
      communityForumServiceApi.UpdateForumResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      communityForumServiceApi.UpdateForumResponse.fromPartial({
        forum: {
          name: (req?.forum?.name ?? ""),
          status: req?.forum?.status,
        },
      }),
    );
  }

  /**
   * Streams the changes of forums as they happen.
   */
  async watchForums(req: communityForumServiceApi.WatchForumsRequest): Promise<communityForumServiceApi.WatchForumsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchForums", req);
    this.logger.info("watch_forums", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      notification: {
        assignee: { email: (req?.subscriber?.email ?? "") },
        requester: {
          phone: (req?.subscriber?.phone ?? ""),
          preferredChannel: (req?.subscriber?.preferredChannel ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse>(
      "acme.community.v1.ForumService/WatchForums:0", request1,
    );
    const request2 = communityPostCalculationServiceApi.EstimatePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { updatedBy: (reply1?.notification?.audit?.updatedBy ?? "") },
        counterparty: { email: (reply1?.notification?.assignee?.email ?? "") },
      },
    });
    const invoke2: Unary<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse> =
      (input, done) => this.communityPostCalculationClient.estimatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse>(invoke2, request2));
    const request3 = communityPostCalculationServiceApi.CalculatePostRequest.fromPartial({
      context: req?.context,
      post: {
        settlement: { $case: "bank", bank: {
          iban: ((reply2?.post?.settlement?.$case === "bank" ? reply2?.post?.settlement.bank : undefined)?.iban ?? ""),
        } },
        counterparty: { displayName: (reply1?.notification?.assignee?.displayName ?? "") },
      },
    });
    const invoke3: Unary<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse> =
      (input, done) => this.communityPostCalculationClient.calculatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<communityPostCalculationServiceApi.CalculatePostResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = communityBadgeCalculationServiceApi.RecalculateBadgesRequest.fromPartial({
      badge: { owner: { email: (reply1?.notification?.assignee?.email ?? "") } },
      context: req?.context,
      details: {
        destination: { countryCode: (reply2?.post?.billingAddress?.countryCode ?? "") },
      },
    });
    const invoke4: Unary<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse> =
      (input, done) => this.communityBadgeCalculationClient.recalculateBadges(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.filter?.ownerId ?? "") });
    return mergeResponses(
      communityForumServiceApi.WatchForumsResponse.fromPartial({
        forum: {
          children: [{
            manager: {
              displayName: ((reply1?.notification?.origin?.$case === "customer" ? reply1?.notification?.origin.customer : undefined)?.displayName ?? ""),
            },
          }],
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      communityForumServiceApi.WatchForumsResponse.fromPartial({
        forum: {
          children: [{ audit: { createdBy: (reply2?.post?.audit?.createdBy ?? "") } }],
        },
      }),
      communityForumServiceApi.WatchForumsResponse.fromPartial({
        forum: {
          children: [{ audit: { createdBy: (reply3?.post?.audit?.createdBy ?? "") } }],
        },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      communityForumServiceApi.WatchForumsResponse.fromPartial({
        forum: {
          children: [{ children: [{ audit: { etag: (reply4?.badge?.audit?.etag ?? "") } }] }],
        },
      }),
      communityForumServiceApi.WatchForumsResponse.fromPartial({
        forum: {
          location: { region: (req?.filter?.region ?? "") },
          manager: { email: (req?.subscriber?.email ?? "") },
        },
      }),
    );
  }
}
