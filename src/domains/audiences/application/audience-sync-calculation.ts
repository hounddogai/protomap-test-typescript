/**
 * Computes the figures of an audience sync, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as audiencesAudienceMemberCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as chatChatRoomServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
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
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toAudienceSyncRecord } from "../data/records.js";
import { AudiencesRepository } from "../data/repository.js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience sync operations and persist audit data.
 */
@injectable()
export class AudienceSyncCalculationWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberCalculationService") private readonly audiencesAudienceMemberCalculationClient: audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceValidationService") private readonly audiencesAudienceValidationClient: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates an audience sync.
   */
  async calculateAudienceSync(req: audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncRequest): Promise<audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "CalculateAudienceSync", req);
    this.logger.info("calculate_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = audiencesAudienceValidationServiceApi.ValidateAudienceRequest.fromPartial({
      audience: {
        owner: {
          displayName: (input1?.audienceSync?.subject?.displayName ?? ""),
          userId: (input1?.context?.actor?.userId ?? ""),
        },
      },
      context: input1?.context,
      details: { contact: { email: (input1?.audienceSync?.subject?.email ?? "") } },
      reason: (input1?.reason ?? ""),
    });
    const invoke1: Unary<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.validateAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (reply1?.audience?.action?.$case) {
      case "block":
        selected2_1 = ((reply1?.audience?.action?.$case === "block" ? reply1?.audience?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest.fromPartial({
      audience: {
        audit: { createdBy: (reply1?.audience?.audit?.createdBy ?? "") },
        action: { $case: "block", block: { reason: (selected2_1 ?? "") } },
        owner: { displayName: (req?.audienceSync?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest, audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse> =
      (input, done) => this.audiencesAudienceValidationClient.explainAudienceDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest, audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse>(invoke2, request2);
    const request3 = chatChatRoomServiceApi.ListChatRoomsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.audience?.audit?.updatedAt,
        ownerId: (req?.audienceSync?.subject?.audienceMemberId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const decoded3 = chatChatRoomServiceApi.ListChatRoomsRequest.fromJSON(
      JSON.parse(JSON.stringify(chatChatRoomServiceApi.ListChatRoomsRequest.toJSON(request3))),
    );
    const invoke3: Unary<chatChatRoomServiceApi.ListChatRoomsRequest, chatChatRoomServiceApi.ListChatRoomsResponse> =
      (input, done) => this.chatChatRoomClient.listChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatRoomServiceApi.ListChatRoomsRequest, chatChatRoomServiceApi.ListChatRoomsResponse>(invoke3, decoded3);
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncResponse.fromPartial({
        audienceSync: {
          subject: { displayName: (reply1?.audience?.owner?.displayName ?? "") },
        },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncResponse.fromPartial({
        audienceSync: {
          subject: { displayName: (reply2?.audience?.owner?.displayName ?? "") },
        },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          occurredAt: req?.audienceSync?.occurredAt,
        },
      }),
    );
  }

  /**
   * Compares an audience sync.
   */
  async compareAudienceSyncOptions(req: audiencesAudienceSyncCalculationServiceApi.CompareAudienceSyncOptionsRequest): Promise<audiencesAudienceSyncCalculationServiceApi.CompareAudienceSyncOptionsResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "CompareAudienceSyncOptions", req);
    this.logger.info("compare_audience_sync_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceValidationServiceApi.PreviewAudienceRequest.fromPartial({
      audience: {
        owner: { displayName: (req?.audienceSync?.subject?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.audienceSync?.subject?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.audiences.v1.PreviewAudienceRequest",
      value: Buffer.from(audiencesAudienceValidationServiceApi.PreviewAudienceRequest.encode(request1).finish()),
    });
    const unpacked1 = audiencesAudienceValidationServiceApi.PreviewAudienceRequest.decode(envelope1.value);
    const invoke1: Unary<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.previewAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse>(invoke1, unpacked1);
    let selected2_2: string | undefined;
    switch (reply1?.audience?.action?.$case) {
      case "block":
        selected2_2 = ((reply1?.audience?.action?.$case === "block" ? reply1?.audience?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { recipient: { email: (reply1?.audience?.owner?.email ?? "") } },
      reason: (selected2_2 ?? ""),
    });
    const invoke2: Unary<notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse> =
      (input, done) => this.notificationsSubscriptionNotificationClient.subscribeSubscriptionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse>(invoke2, request2);
    const request3 = audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest.fromPartial({
      audience: {
        audit: { createdBy: (reply2?.subscription?.audit?.createdBy ?? "") },
        owner: {
          displayName: (reply2?.subscription?.owner?.displayName ?? ""),
          email: (reply2?.subscription?.owner?.email ?? ""),
          userId: (reply2?.subscription?.owner?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke3: Unary<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse> =
      (input, done) => this.audiencesAudienceValidationClient.checkAudienceEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    const request4 = audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest.fromPartial({
      audienceMember: {
        audit: { updatedBy: (reply3?.audience?.audit?.updatedBy ?? "") },
        relationshipManager: { email: (reply3?.audience?.owner?.email ?? "") },
      },
      context: req?.context,
      details: {
        destination: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
    });
    const invoke4: Unary<audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient.estimateAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      audiencesAudienceSyncCalculationServiceApi.CompareAudienceSyncOptionsResponse.fromPartial({
        breakdown: {
          lines: [{
            amount: (reply1?.audience?.action?.$case === "discount" ? reply1?.audience?.action.discount : undefined)?.amount,
          }],
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      audiencesAudienceSyncCalculationServiceApi.CompareAudienceSyncOptionsResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      audiencesAudienceSyncCalculationServiceApi.CompareAudienceSyncOptionsResponse.fromPartial({
        result: {
          referenceIds: (reply3?.result?.referenceIds ?? []),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      audiencesAudienceSyncCalculationServiceApi.CompareAudienceSyncOptionsResponse.fromPartial({
        audienceSync: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      audiencesAudienceSyncCalculationServiceApi.CompareAudienceSyncOptionsResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          sequence: (req?.audienceSync?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Estimates an audience sync.
   */
  async estimateAudienceSync(req: audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncRequest): Promise<audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "EstimateAudienceSync", req);
    this.logger.info("estimate_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceSync?.occurredAt,
        ownerId: (req?.audienceSync?.subject?.audienceMemberId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest, notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse> =
      (input, done) => this.notificationsNotificationNotificationClient.listNotificationSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("EstimateAudienceSync.ListNotificationSubscriptions", () => call<notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest, notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse>(invoke1, request1));
    const request2 = audiencesAudienceValidationServiceApi.NormalizeAudienceRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      audience: {
        owner: {
          displayName: (req?.audienceSync?.subject?.displayName ?? ""),
          email: (req?.audienceSync?.subject?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.normalizeAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncResponse.fromPartial({
        audienceSync: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncResponse.fromPartial({
        audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") },
        result: { correlationId: (req?.audienceSync?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Explains an audience sync.
   */
  async explainAudienceSyncCalculation(req: audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationRequest): Promise<audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "ExplainAudienceSyncCalculation", req);
    this.logger.info("explain_audience_sync_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesValidationServiceApi.ScoreMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: {
        owner: {
          displayName: (req?.audienceSync?.subject?.displayName ?? ""),
          email: (req?.details?.contact?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<metricsMetricSeriesValidationServiceApi.ScoreMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.ScoreMetricSeriesResponse>(
      "acme.audiences.v1.AudienceSyncCalculationService/ExplainAudienceSyncCalculation:0", request1,
    );
    const settled2 = await Promise.allSettled((req?.audienceSync?.measurements ?? []).map(async (item) => {
      const request2 = audiencesAudienceValidationServiceApi.NormalizeAudienceRequest.fromPartial({
        audience: {
          audit: {
            createdAt: reply1?.metricSeries?.audit?.createdAt,
            updatedAt: item?.observedAt,
          },
        },
        context: req?.context,
        details: { contact: { email: (reply1?.metricSeries?.owner?.email ?? "") } },
      });
      const invoke2: Unary<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse> =
        (input, done) => this.audiencesAudienceValidationClient.normalizeAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: audiencesAudienceValidationServiceApi.NormalizeAudienceResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? audiencesAudienceValidationServiceApi.NormalizeAudienceResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          source: (req?.audienceSync?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Quotes an audience sync.
   */
  async quoteAudienceSync(req: audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncRequest): Promise<audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "QuoteAudienceSync", req);
    this.logger.info("quote_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse>> = [];
    for (const item of (req?.audienceSync?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest.fromPartial({
          audience: {
            audit: { updatedAt: item?.observedAt },
            action: { $case: "block", block: { reason: (req?.reason ?? "") } },
            owner: {
              displayName: (req?.audienceSync?.subject?.displayName ?? ""),
              email: (req?.audienceSync?.subject?.email ?? ""),
            },
          },
          context: req?.context,
        });
        const invoke1: Unary<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse> =
          (input, done) => this.audiencesAudienceValidationClient.checkAudienceEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse.fromPartial({});
    const request2 = searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        locator: { $case: "address", address: { region: (req?.details?.destination?.region ?? "") } },
      },
    });
    const invoke2: Unary<searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionRequest, searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionResponse> =
      (input, done) => this.searchSearchIndexValidationClient.explainSearchIndexDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionRequest, searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncResponse.fromPartial({
        audienceSync: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { message: (reply2?.outcome?.message ?? "") },
      }),
      audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncResponse.fromPartial({
        audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") },
        result: { correlationId: (req?.audienceSync?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Recalculates an audience sync.
   */
  async recalculateAudienceSyncs(req: audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsRequest): Promise<audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "RecalculateAudienceSyncs", req);
    this.logger.info("recalculate_audience_syncs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserValidationServiceApi.PreviewUserRequest.fromPartial({
      context: req?.context,
      user: { primaryAddress: { region: (req?.details?.destination?.region ?? "") } },
    });
    const invoke1: Unary<identityUserValidationServiceApi.PreviewUserRequest, identityUserValidationServiceApi.PreviewUserResponse> =
      (input, done) => this.identityUserValidationClient.previewUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<identityUserValidationServiceApi.PreviewUserResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = audiencesAudienceValidationServiceApi.NormalizeAudienceRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: reply1?.user?.contact?.name,
          phone: (reply1?.user?.contact?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.normalizeAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          kind: (req?.audienceSync?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates an audience sync.
   */
  async simulateAudienceSync(req: audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest): Promise<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "SimulateAudienceSync", req);
    this.logger.info("simulate_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.audienceSync?.measurements ?? []).map(async (item) => {
      const request1 = audiencesAudienceValidationServiceApi.ValidateAudienceRequest.fromPartial({
        audience: {
          audit: { updatedAt: item?.observedAt },
          owner: {
            displayName: (req?.audienceSync?.subject?.displayName ?? ""),
            email: (req?.audienceSync?.subject?.email ?? ""),
          },
        },
        context: req?.context,
      });
      const invoke1: Unary<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse> =
        (input, done) => this.audiencesAudienceValidationClient.validateAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? audiencesAudienceValidationServiceApi.ValidateAudienceResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse.fromPartial({
      audienceSync: {
        audienceSyncId: (req?.audienceSyncId ?? ""),
        correlationId: (req?.audienceSync?.correlationId ?? ""),
      },
    });
  }
}
