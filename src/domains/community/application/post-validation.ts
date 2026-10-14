/**
 * Checks posts against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as analyticsAnalyticsEventQueryServiceApi from "../../../../.cache/proto/acme/analytics/v1/analytics_event_query_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, retry, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toPostRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate post operations and persist audit data.
 */
@injectable()
export class PostValidationWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.analytics.v1.AnalyticsEventQueryService") private readonly analyticsAnalyticsEventQueryClient: analyticsAnalyticsEventQueryServiceApi.AnalyticsEventQueryServiceClient,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a post.
   */
  async checkPostEligibility(req: communityPostValidationServiceApi.CheckPostEligibilityRequest): Promise<communityPostValidationServiceApi.CheckPostEligibilityResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "CheckPostEligibility", req);
    this.logger.info("check_post_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueValidationServiceApi.ValidateVenueRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.post?.counterparty?.email ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<venuesVenueValidationServiceApi.ValidateVenueRequest, venuesVenueValidationServiceApi.ValidateVenueResponse> =
      (input, done) => this.venuesVenueValidationClient.validateVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<venuesVenueValidationServiceApi.ValidateVenueRequest, venuesVenueValidationServiceApi.ValidateVenueResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostValidationServiceApi.CheckPostEligibilityResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      communityPostValidationServiceApi.CheckPostEligibilityResponse.fromPartial({
        post: {
          metadata: (req?.post?.metadata ?? {}),
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a post.
   */
  async explainPostDecision(req: communityPostValidationServiceApi.ExplainPostDecisionRequest): Promise<communityPostValidationServiceApi.ExplainPostDecisionResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "ExplainPostDecision", req);
    this.logger.info("explain_post_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.post?.billingAddress?.region ?? "") },
      subscriber: {
        email: (req?.post?.counterparty?.email ?? ""),
        preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.notificationsDeliveryAttemptNotificationClient.streamDeliveryAttemptNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesResponse.fromPartial({});
    let selected2_1: string | undefined;
    switch (req?.post?.settlement?.$case) {
      case "bank":
        selected2_1 = ((req?.post?.settlement?.$case === "bank" ? req?.post?.settlement.bank : undefined)?.iban ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_2: string | undefined;
    switch (req?.post?.settlement?.$case) {
      case "bank":
        selected2_2 = ((req?.post?.settlement?.$case === "bank" ? req?.post?.settlement.bank : undefined)?.bic ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = communityPostCalculationServiceApi.QuotePostRequest.fromPartial({
      context: req?.context,
      post: {
        settlement: { $case: "bank", bank: {
          bic: (selected2_2 ?? ""),
          iban: (selected2_1 ?? ""),
        } },
        billingAddress: {
          countryCode: (req?.post?.billingAddress?.countryCode ?? ""),
          postalCode: (req?.post?.billingAddress?.postalCode ?? ""),
        },
      },
    });
    const invoke2: Unary<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse> =
      (input, done) => this.communityPostCalculationClient.quotePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse>(invoke2, request2);
    const request3 = featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        audit: { createdAt: reply2?.post?.audit?.createdAt },
        owner: {
          displayName: (req?.post?.counterparty?.displayName ?? ""),
          email: (req?.details?.contact?.email ?? ""),
        },
      },
    });
    const invoke3: Unary<featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.PreviewFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.previewFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      post: { audit: { updatedAt: reply3?.featureFlag?.audit?.updatedAt } },
    });
    const reply4 = await this.workQueue.enqueue<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>(
      "acme.community.v1.PostValidationService/ExplainPostDecision:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostValidationServiceApi.ExplainPostDecisionResponse.fromPartial({ post: { audit: { updatedAt: reply2?.post?.audit?.updatedAt } } }),
      communityPostValidationServiceApi.ExplainPostDecisionResponse.fromPartial({ result: { status: (reply3?.outcome?.status ?? "") } }),
      communityPostValidationServiceApi.ExplainPostDecisionResponse.fromPartial({
        outcome: { status: (reply4?.result?.status ?? "") },
        result: { status: (reply4?.result?.status ?? "") },
      }),
      communityPostValidationServiceApi.ExplainPostDecisionResponse.fromPartial({
        post: {
          dueAt: req?.post?.dueAt,
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a post.
   */
  async getPostRules(req: communityPostValidationServiceApi.GetPostRulesRequest): Promise<communityPostValidationServiceApi.GetPostRulesResponse> {
    validateContext(req.context);
    if (!req.postId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "post_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetPostRules", req);
    this.logger.info("get_post_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeCalculationServiceApi.EstimateBadgeRequest.fromPartial({
      badge: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<communityBadgeCalculationServiceApi.EstimateBadgeRequest, communityBadgeCalculationServiceApi.EstimateBadgeResponse> =
      (input, done) => this.communityBadgeCalculationClient.estimateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<communityBadgeCalculationServiceApi.EstimateBadgeRequest, communityBadgeCalculationServiceApi.EstimateBadgeResponse>(invoke1, request1));
    const request2 = analyticsAnalyticsEventQueryServiceApi.ResolveAnalyticsEventsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<analyticsAnalyticsEventQueryServiceApi.ResolveAnalyticsEventsRequest, analyticsAnalyticsEventQueryServiceApi.ResolveAnalyticsEventsResponse> =
      (input, done) => this.analyticsAnalyticsEventQueryClient.resolveAnalyticsEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<analyticsAnalyticsEventQueryServiceApi.ResolveAnalyticsEventsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return mergeResponses(
      communityPostValidationServiceApi.GetPostRulesResponse.fromPartial({ post: { audit: { updatedAt: reply1?.badge?.audit?.updatedAt } } }),
      communityPostValidationServiceApi.GetPostRulesResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      communityPostValidationServiceApi.GetPostRulesResponse.fromPartial({ post: { postId: (req?.postId ?? "") } }),
    );
  }

  /**
   * Lints a post.
   */
  async lintPosts(req: communityPostValidationServiceApi.LintPostsRequest): Promise<communityPostValidationServiceApi.LintPostsResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "LintPosts", req);
    this.logger.info("lint_posts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.QuotePostRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.post?.billingAddress?.region ?? "") } },
      post: {
        audit: { createdBy: (req?.post?.audit?.createdBy ?? "") },
        billingAddress: { lines: (req?.post?.billingAddress?.lines ?? []).map((value) => value) },
      },
    });
    const invoke1: Unary<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse> =
      (input, done) => this.communityPostCalculationClient.quotePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostValidationServiceApi.LintPostsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      communityPostValidationServiceApi.LintPostsResponse.fromPartial({
        post: {
          postId: (req?.postId ?? ""),
          status: req?.post?.status,
        },
      }),
    );
  }

  /**
   * Normalizes a post.
   */
  async normalizePost(req: communityPostValidationServiceApi.NormalizePostRequest): Promise<communityPostValidationServiceApi.NormalizePostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "NormalizePost", req);
    this.logger.info("normalize_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        billingAddress: { region: (req?.post?.billingAddress?.region ?? "") },
        counterparty: { displayName: (req?.post?.counterparty?.displayName ?? "") },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateSyncClient.syncNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = communityPostCalculationServiceApi.QuotePostRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: (reply1?.notificationTemplate?.billingAddress?.postalCode ?? ""),
        },
      },
      post: {
        settlement: { $case: "card", card: {
          last4: ((req?.post?.settlement?.$case === "card" ? req?.post?.settlement.card : undefined)?.last4 ?? ""),
        } },
      },
    });
    const method2 = "quotePost" as const;
    const invoke2: Unary<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse> =
      (input, done) => this.communityPostCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostValidationServiceApi.NormalizePostResponse.fromPartial({
        post: {
          billingAddress: {
            countryCode: (reply1?.notificationTemplate?.billingAddress?.countryCode ?? ""),
          },
          issuedAt: reply1?.notificationTemplate?.issuedAt,
        },
      }),
      communityPostValidationServiceApi.NormalizePostResponse.fromPartial({
        post: {
          billingAddress: { recipient: (reply2?.post?.billingAddress?.recipient ?? "") },
        },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      communityPostValidationServiceApi.NormalizePostResponse.fromPartial({
        post: {
          notes: (req?.post?.notes ?? ""),
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a post.
   */
  async previewPost(req: communityPostValidationServiceApi.PreviewPostRequest): Promise<communityPostValidationServiceApi.PreviewPostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "PreviewPost", req);
    this.logger.info("preview_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.LintForumsRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { createdAt: req?.post?.audit?.createdAt },
            location: { countryCode: (req?.post?.billingAddress?.countryCode ?? "") },
            manager: { displayName: (req?.post?.counterparty?.displayName ?? "") },
          }],
        }],
      },
    });
    const proxy1 = forwarding(this.communityForumValidationClient);
    const invoke1: Unary<communityForumValidationServiceApi.LintForumsRequest, communityForumValidationServiceApi.LintForumsResponse> =
      (input, done) => proxy1.lintForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumValidationServiceApi.LintForumsRequest, communityForumValidationServiceApi.LintForumsResponse>(invoke1, request1);
    const request2 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (reply1?.forum?.location?.region ?? "") } },
      post: {
        audit: { updatedAt: reply1?.forum?.audit?.updatedAt },
        billingAddress: { locality: (reply1?.forum?.location?.locality ?? "") },
        counterparty: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const invoke2: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient.simulatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>(invoke2, request2);
    const request3 = notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        billingAddress: { countryCode: (reply1?.forum?.location?.countryCode ?? "") },
        counterparty: { displayName: (req?.post?.counterparty?.displayName ?? "") },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.validateNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostValidationServiceApi.PreviewPostResponse.fromPartial({
        post: {
          billingAddress: { recipient: (reply1?.forum?.location?.recipient ?? "") },
          counterparty: { displayName: (reply1?.forum?.manager?.displayName ?? "") },
        },
      }),
      communityPostValidationServiceApi.PreviewPostResponse.fromPartial({
        post: {
          audit: { createdBy: (reply2?.post?.audit?.createdBy ?? "") },
          counterparty: { email: (reply2?.post?.counterparty?.email ?? "") },
        },
      }),
      communityPostValidationServiceApi.PreviewPostResponse.fromPartial({ outcome: { nextSteps: (reply3?.outcome?.nextSteps ?? []) } }),
      communityPostValidationServiceApi.PreviewPostResponse.fromPartial({
        post: {
          postId: (req?.postId ?? ""),
          status: req?.post?.status,
        },
      }),
    );
  }

  /**
   * Scores a post.
   */
  async scorePost(req: communityPostValidationServiceApi.ScorePostRequest): Promise<communityPostValidationServiceApi.ScorePostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "ScorePost", req);
    this.logger.info("score_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: input1?.context,
      post: {
        settlement: { $case: "bank", bank: {
          iban: ((input1?.post?.settlement?.$case === "bank" ? input1?.post?.settlement.bank : undefined)?.iban ?? ""),
        } },
        billingAddress: { locality: (input1?.post?.billingAddress?.locality ?? "") },
      },
    });
    const invoke1: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient.simulatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>(invoke1, request1);
    const tasks2: Array<() => Promise<communityForumValidationServiceApi.PreviewForumResponse>> = [];
    for (const item of (req?.post?.lines ?? [])) {
      tasks2.push(async () => {
        const request2 = communityForumValidationServiceApi.PreviewForumRequest.fromPartial({
          context: req?.context,
          forum: {
            children: [{
              children: [{
                attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
              }],
            }],
          },
        });
        const invoke2: Unary<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse> =
          (input, done) => this.communityForumValidationClient.previewForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? communityForumValidationServiceApi.PreviewForumResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostValidationServiceApi.ScorePostResponse.fromPartial({ post: { postId: (reply1?.post?.postId ?? "") } }),
      communityPostValidationServiceApi.ScorePostResponse.fromPartial({
        post: {
          issuedAt: req?.post?.issuedAt,
          notes: (req?.post?.notes ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a post.
   */
  async validatePost(req: communityPostValidationServiceApi.ValidatePostRequest): Promise<communityPostValidationServiceApi.ValidatePostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "ValidatePost", req);
    this.logger.info("validate_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesServiceApi.WatchMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.post?.billingAddress?.region ?? "") },
      subscriber: {
        email: (req?.details?.contact?.email ?? ""),
        name: req?.details?.contact?.name,
        phone: (req?.details?.contact?.phone ?? ""),
      },
    });
    const stream1 = this.metricsMetricSeriesClient.watchMetricSerieses(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? metricsMetricSeriesServiceApi.WatchMetricSeriesesResponse.fromPartial({});
    const request2 = communityForumValidationServiceApi.ValidateForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: {
              etag: (req?.post?.audit?.etag ?? ""),
              updatedBy: (req?.post?.audit?.updatedBy ?? ""),
            },
            location: { lines: (req?.post?.billingAddress?.lines ?? []).map((value) => value) },
            manager: { email: (req?.details?.contact?.email ?? "") },
          }],
        }],
      },
    });
    const cloned2: communityForumValidationServiceApi.ValidateForumRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<communityForumValidationServiceApi.ValidateForumRequest, communityForumValidationServiceApi.ValidateForumResponse> =
      (input, done) => this.communityForumValidationClient.validateForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumValidationServiceApi.ValidateForumRequest, communityForumValidationServiceApi.ValidateForumResponse>(invoke2, cloned2);
    const request3 = communityPostCalculationServiceApi.CalculatePostRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: { countryCode: (reply2?.forum?.location?.countryCode ?? "") },
      },
    });
    const decoded3 = communityPostCalculationServiceApi.CalculatePostRequest.fromJSON(
      JSON.parse(JSON.stringify(communityPostCalculationServiceApi.CalculatePostRequest.toJSON(request3))),
    );
    const invoke3: Unary<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse> =
      (input, done) => this.communityPostCalculationClient.calculatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse>(invoke3, decoded3);
    const request4 = communityForumValidationServiceApi.ScoreForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            location: { countryCode: (reply2?.forum?.location?.countryCode ?? "") },
          }],
        }],
      },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.ScoreForumRequest",
      value: Buffer.from(communityForumValidationServiceApi.ScoreForumRequest.encode(request4).finish()),
    });
    const unpacked4 = communityForumValidationServiceApi.ScoreForumRequest.decode(envelope4.value);
    const invoke4: Unary<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse> =
      (input, done) => this.communityForumValidationClient.scoreForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostValidationServiceApi.ValidatePostResponse.fromPartial({
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
        post: { counterparty: { email: (reply2?.forum?.manager?.email ?? "") } },
      }),
      communityPostValidationServiceApi.ValidatePostResponse.fromPartial({ post: { notes: (reply3?.post?.notes ?? "") } }),
      communityPostValidationServiceApi.ValidatePostResponse.fromPartial({
        outcome: { status: (reply4?.result?.status ?? "") },
        result: { details: (reply4?.result?.details ?? {}) },
      }),
      communityPostValidationServiceApi.ValidatePostResponse.fromPartial({
        post: {
          number: (req?.post?.number ?? ""),
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }
}
