/**
 * Checks forums against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as fleetVehicleServiceApi from "../../../../.cache/proto/acme/fleet/v1/vehicle_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as keymanagementCryptoKeyServiceApi from "../../../../.cache/proto/acme/keymanagement/v1/crypto_key_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toForumRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate forum operations and persist audit data.
 */
@injectable()
export class ForumValidationWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.fleet.v1.VehicleService") private readonly fleetVehicleClient: fleetVehicleServiceApi.VehicleServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.keymanagement.v1.CryptoKeyService") private readonly keymanagementCryptoKeyClient: keymanagementCryptoKeyServiceApi.CryptoKeyServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a forum.
   */
  async checkForumEligibility(req: communityForumValidationServiceApi.CheckForumEligibilityRequest): Promise<communityForumValidationServiceApi.CheckForumEligibilityResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "CheckForumEligibility", req);
    this.logger.info("check_forum_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest.fromPartial({
      context: req?.context,
      details: { recipient: { name: req?.details?.contact?.name } },
    });
    const invoke1: Unary<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.unsubscribeDeliveryAttemptUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const method2 = "notifySubscriptionWatchers" as const;
    const invoke2: Unary<notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest, notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersResponse> =
      (input, done) => this.notificationsSubscriptionNotificationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest, notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumValidationServiceApi.CheckForumEligibilityResponse.fromPartial({
        forum: {
          manager: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
        },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      communityForumValidationServiceApi.CheckForumEligibilityResponse.fromPartial({
        forum: {
          children: [{ manager: { email: (reply2?.subscription?.owner?.email ?? "") } }],
        },
        outcome: { status: (reply2?.outcome?.status ?? "") },
      }),
      communityForumValidationServiceApi.CheckForumEligibilityResponse.fromPartial({
        forum: {
          attributes: (req?.forum?.attributes ?? {}),
          forumId: (req?.forumId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a forum.
   */
  async explainForumDecision(req: communityForumValidationServiceApi.ExplainForumDecisionRequest): Promise<communityForumValidationServiceApi.ExplainForumDecisionResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "ExplainForumDecision", req);
    this.logger.info("explain_forum_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.WatchUsersRequest.fromPartial({
      context: req?.context,
      subscriber: { email: (req?.details?.contact?.email ?? "") },
    });
    const stream1 = this.identityUserClient.watchUsers(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? identityUserServiceApi.WatchUsersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return communityForumValidationServiceApi.ExplainForumDecisionResponse.fromPartial({
      forum: {
        attributes: (req?.forum?.attributes ?? {}),
        forumId: (req?.forumId ?? ""),
      },
    });
  }

  /**
   * Returns a forum.
   */
  async getForumRules(req: communityForumValidationServiceApi.GetForumRulesRequest): Promise<communityForumValidationServiceApi.GetForumRulesResponse> {
    validateContext(req.context);
    if (!req.forumId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "forum_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetForumRules", req);
    this.logger.info("get_forum_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest.fromPartial({
      context: req?.context,
      metricSeries: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const proxy1 = forwarding(this.metricsMetricSeriesValidationClient);
    const invoke1: Unary<metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest, metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityResponse> =
      (input, done) => proxy1.checkMetricSeriesEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest, metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityResponse>(invoke1, request1);
    return mergeResponses(
      communityForumValidationServiceApi.GetForumRulesResponse.fromPartial({
        forum: {
          children: [{
            children: [{ manager: { email: (reply1?.metricSeries?.owner?.email ?? "") } }],
            location: {
              recipient: ((reply1?.metricSeries?.locator?.$case === "address" ? reply1?.metricSeries?.locator.address : undefined)?.recipient ?? ""),
            },
          }],
        },
      }),
      communityForumValidationServiceApi.GetForumRulesResponse.fromPartial({ forum: { forumId: (req?.forumId ?? "") } }),
    );
  }

  /**
   * Lints a forum.
   */
  async lintForums(req: communityForumValidationServiceApi.LintForumsRequest): Promise<communityForumValidationServiceApi.LintForumsResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "LintForums", req);
    this.logger.info("lint_forums", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      post: { counterparty: { email: (req?.forum?.manager?.email ?? "") } },
    });
    const invoke1: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient.simulatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>(invoke1, request1);
    const request2 = keymanagementCryptoKeyServiceApi.BatchGetCryptoKeysRequest.fromPartial({ context: req?.context });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<keymanagementCryptoKeyServiceApi.BatchGetCryptoKeysRequest, keymanagementCryptoKeyServiceApi.BatchGetCryptoKeysResponse> =
      (input, done) => this.keymanagementCryptoKeyClient.batchGetCryptoKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<keymanagementCryptoKeyServiceApi.BatchGetCryptoKeysRequest, keymanagementCryptoKeyServiceApi.BatchGetCryptoKeysResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumValidationServiceApi.LintForumsResponse.fromPartial({
        forum: {
          children: [{
            location: { countryCode: (reply1?.post?.billingAddress?.countryCode ?? "") },
          }],
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      communityForumValidationServiceApi.LintForumsResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      communityForumValidationServiceApi.LintForumsResponse.fromPartial({
        forum: {
          forumId: (req?.forumId ?? ""),
          parentId: (req?.forum?.parentId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a forum.
   */
  async normalizeForum(req: communityForumValidationServiceApi.NormalizeForumRequest): Promise<communityForumValidationServiceApi.NormalizeForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "NormalizeForum", req);
    this.logger.info("normalize_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromPartial({
      context: input1?.context,
      details: {
        destination: { recipient: (input1?.forum?.location?.recipient ?? "") },
      },
      post: {
        billingAddress: {
          lines: (input1?.forum?.location?.lines ?? []).map((value) => value),
          locality: (input1?.forum?.location?.locality ?? ""),
        },
      },
    });
    const invoke1: Unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse> =
      (input, done) => this.communityPostCalculationClient.comparePostOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(invoke1, request1);
    const request2 = venuesVenueValidationServiceApi.CheckVenueEligibilityRequest.fromPartial({
      context: req?.context,
      venue: {
        locator: { $case: "address", address: { region: (req?.forum?.location?.region ?? "") } },
        audit: {
          createdBy: (reply1?.post?.audit?.createdBy ?? ""),
          etag: (reply1?.post?.audit?.etag ?? ""),
        },
        owner: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const cloned2: venuesVenueValidationServiceApi.CheckVenueEligibilityRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<venuesVenueValidationServiceApi.CheckVenueEligibilityRequest, venuesVenueValidationServiceApi.CheckVenueEligibilityResponse> =
      (input, done) => this.venuesVenueValidationClient.checkVenueEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<venuesVenueValidationServiceApi.CheckVenueEligibilityRequest, venuesVenueValidationServiceApi.CheckVenueEligibilityResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumValidationServiceApi.NormalizeForumResponse.fromPartial({
        forum: {
          location: {
            countryCode: (reply1?.post?.billingAddress?.countryCode ?? ""),
            region: (reply1?.post?.billingAddress?.region ?? ""),
          },
        },
      }),
      communityForumValidationServiceApi.NormalizeForumResponse.fromPartial({ outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) } }),
      communityForumValidationServiceApi.NormalizeForumResponse.fromPartial({
        forum: {
          depth: (req?.forum?.depth ?? 0),
          forumId: (req?.forumId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a forum.
   */
  async previewForum(req: communityForumValidationServiceApi.PreviewForumRequest): Promise<communityForumValidationServiceApi.PreviewForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "PreviewForum", req);
    this.logger.info("preview_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fleetVehicleServiceApi.ListVehiclesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.forum?.location?.region ?? "") },
    });
    const decoded1 = fleetVehicleServiceApi.ListVehiclesRequest.fromJSON(
      JSON.parse(JSON.stringify(fleetVehicleServiceApi.ListVehiclesRequest.toJSON(request1))),
    );
    const invoke1: Unary<fleetVehicleServiceApi.ListVehiclesRequest, fleetVehicleServiceApi.ListVehiclesResponse> =
      (input, done) => this.fleetVehicleClient.listVehicles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<fleetVehicleServiceApi.ListVehiclesRequest, fleetVehicleServiceApi.ListVehiclesResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumValidationServiceApi.PreviewForumResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      communityForumValidationServiceApi.PreviewForumResponse.fromPartial({
        forum: {
          forumId: (req?.forumId ?? ""),
          parentId: (req?.forum?.parentId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a forum.
   */
  async scoreForum(req: communityForumValidationServiceApi.ScoreForumRequest): Promise<communityForumValidationServiceApi.ScoreForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "ScoreForum", req);
    this.logger.info("score_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (req?.forum?.location?.countryCode ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.SimulatePostRequest",
      value: Buffer.from(communityPostCalculationServiceApi.SimulatePostRequest.encode(request1).finish()),
    });
    const unpacked1 = communityPostCalculationServiceApi.SimulatePostRequest.decode(envelope1.value);
    const invoke1: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient.simulatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>(invoke1, unpacked1);
    const request2 = identityUserServiceApi.GetUserRequest.fromPartial({
      context: req?.context,
      userId: (req?.forum?.manager?.userId ?? ""),
    });
    const client2 = this.clients.get<identityUserServiceApi.UserServiceClient>("acme.identity.v1.UserService");
    const invoke2: Unary<identityUserServiceApi.GetUserRequest, identityUserServiceApi.GetUserResponse> =
      (input, done) => client2.getUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserServiceApi.GetUserRequest, identityUserServiceApi.GetUserResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumValidationServiceApi.ScoreForumResponse.fromPartial({
        forum: { audit: { createdBy: (reply1?.post?.audit?.createdBy ?? "") } },
      }),
      communityForumValidationServiceApi.ScoreForumResponse.fromPartial({
        forum: { audit: { updatedAt: reply2?.user?.audit?.updatedAt } },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      communityForumValidationServiceApi.ScoreForumResponse.fromPartial({
        forum: {
          attributes: (req?.forum?.attributes ?? {}),
          forumId: (req?.forumId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a forum.
   */
  async validateForum(req: communityForumValidationServiceApi.ValidateForumRequest): Promise<communityForumValidationServiceApi.ValidateForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "ValidateForum", req);
    this.logger.info("validate_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.QuotePostRequest.fromPartial({
      context: req?.context,
      details: { destination: { recipient: (req?.forum?.location?.recipient ?? "") } },
      post: {
        audit: {
          createdAt: req?.forum?.audit?.createdAt,
          createdBy: (req?.forum?.audit?.createdBy ?? ""),
          etag: (req?.forum?.audit?.etag ?? ""),
        },
      },
    });
    const invoke1: Unary<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse> =
      (input, done) => this.communityPostCalculationClient.quotePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { createdAt: req?.forum?.audit?.createdAt },
        settlement: { $case: "card", card: {
          last4: ((reply1?.post?.settlement?.$case === "card" ? reply1?.post?.settlement.card : undefined)?.last4 ?? ""),
          token: ((reply1?.post?.settlement?.$case === "card" ? reply1?.post?.settlement.card : undefined)?.token ?? ""),
        } },
      },
    });
    const invoke2: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient.simulatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumValidationServiceApi.ValidateForumResponse.fromPartial({
        forum: { audit: { createdBy: (reply1?.post?.audit?.createdBy ?? "") } },
      }),
      communityForumValidationServiceApi.ValidateForumResponse.fromPartial({
        forum: {
          children: [{ children: [{ audit: { createdAt: reply2?.post?.audit?.createdAt } }] }],
        },
      }),
      communityForumValidationServiceApi.ValidateForumResponse.fromPartial({
        forum: {
          depth: (req?.forum?.depth ?? 0),
          forumId: (req?.forumId ?? ""),
        },
      }),
    );
  }
}
