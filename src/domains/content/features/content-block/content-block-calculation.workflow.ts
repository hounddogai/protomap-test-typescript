/**
 * Computes the figures of a content block, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as communityPostQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as contentContentBlockCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as forecastingDemandForecastQueryServiceApi from "../../../../../.cache/proto/acme/forecasting/v1/demand_forecast_query_service.js";
import * as labelingLabelingTaskQueryServiceApi from "../../../../../.cache/proto/acme/labeling/v1/labeling_task_query_service.js";
import * as lineageLineageNodeCalculationServiceApi from "../../../../../.cache/proto/acme/lineage/v1/lineage_node_calculation_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as mediaRenditionQueryServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toContentBlockRecord } from "../../data/records.js";
import { ContentRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate content block operations and persist audit data.
 */
@injectable()
export class ContentBlockCalculationWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.PostQueryService") private readonly communityPostQueryClient: communityPostQueryServiceApi.PostQueryServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.forecasting.v1.DemandForecastQueryService") private readonly forecastingDemandForecastQueryClient: forecastingDemandForecastQueryServiceApi.DemandForecastQueryServiceClient,
    @inject("grpc:acme.labeling.v1.LabelingTaskQueryService") private readonly labelingLabelingTaskQueryClient: labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient,
    @inject("grpc:acme.lineage.v1.LineageNodeCalculationService") private readonly lineageLineageNodeCalculationClient: lineageLineageNodeCalculationServiceApi.LineageNodeCalculationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.media.v1.RenditionQueryService") private readonly mediaRenditionQueryClient: mediaRenditionQueryServiceApi.RenditionQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a content block.
   */
  async calculateContentBlock(req: contentContentBlockCalculationServiceApi.CalculateContentBlockRequest): Promise<contentContentBlockCalculationServiceApi.CalculateContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "CalculateContentBlock", req);
    this.logger.info("calculate_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesRequest.fromPartial({
      context: req?.context,
      lineageNode: {
        children: [{
          children: [{
            audit: { updatedAt: req?.contentBlock?.audit?.updatedAt },
            location: { recipient: (req?.details?.destination?.recipient ?? "") },
          }],
        }],
      },
    });
    const invoke1: Unary<lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesRequest, lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesResponse> =
      (input, done) => this.lineageLineageNodeCalculationClient.recalculateLineageNodes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesRequest, lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesResponse>(invoke1, request1);
    const request2 = notificationsNotificationValidationServiceApi.LintNotificationsRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.contentBlock?.manager?.email ?? "") } },
      notification: {
        assignee: { displayName: (reply1?.lineageNode?.manager?.displayName ?? "") },
        audit: { createdAt: req?.contentBlock?.audit?.createdAt },
        requester: { email: (reply1?.lineageNode?.manager?.email ?? "") },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsNotificationValidationServiceApi.LintNotificationsRequest, notificationsNotificationValidationServiceApi.LintNotificationsResponse> =
      (input, done) => this.notificationsNotificationValidationClient.lintNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationValidationServiceApi.LintNotificationsRequest, notificationsNotificationValidationServiceApi.LintNotificationsResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockCalculationServiceApi.CalculateContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{
              audit: { updatedBy: (reply1?.lineageNode?.audit?.updatedBy ?? "") },
              path: (reply1?.lineageNode?.path ?? []),
            }],
          }],
        },
      }),
      contentContentBlockCalculationServiceApi.CalculateContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{ audit: { etag: (reply2?.notification?.audit?.etag ?? "") } }],
          manager: { email: (reply2?.notification?.requester?.email ?? "") },
        },
      }),
      contentContentBlockCalculationServiceApi.CalculateContentBlockResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          parentId: (req?.contentBlock?.parentId ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a content block.
   */
  async compareContentBlockOptions(req: contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest): Promise<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "CompareContentBlockOptions", req);
    this.logger.info("compare_content_block_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = labelingLabelingTaskQueryServiceApi.FindLabelingTasksRequest.fromPartial({
      context: input1?.context,
      filter: { region: (input1?.details?.destination?.region ?? "") },
    });
    const invoke1: Unary<labelingLabelingTaskQueryServiceApi.FindLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.FindLabelingTasksResponse> =
      (input, done) => this.labelingLabelingTaskQueryClient.findLabelingTasks(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<labelingLabelingTaskQueryServiceApi.FindLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.FindLabelingTasksResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        contentBlock: { contentBlockId: (req?.contentBlockId ?? "") },
      }),
    );
  }

  /**
   * Estimates a content block.
   */
  async estimateContentBlock(req: contentContentBlockCalculationServiceApi.EstimateContentBlockRequest): Promise<contentContentBlockCalculationServiceApi.EstimateContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "EstimateContentBlock", req);
    this.logger.info("estimate_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionQueryServiceApi.FindRenditionsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.contentBlock?.location?.region ?? "") },
    });
    const cloned1: mediaRenditionQueryServiceApi.FindRenditionsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<mediaRenditionQueryServiceApi.FindRenditionsRequest, mediaRenditionQueryServiceApi.FindRenditionsResponse> =
      (input, done) => this.mediaRenditionQueryClient.findRenditions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionQueryServiceApi.FindRenditionsRequest, mediaRenditionQueryServiceApi.FindRenditionsResponse>(invoke1, cloned1);
    const request2 = featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.contentBlock?.audit?.updatedAt,
        ownerId: (req?.contentBlock?.manager?.userId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const decoded2 = featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest.fromJSON(
      JSON.parse(JSON.stringify(featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest.toJSON(request2))),
    );
    const invoke2: Unary<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.suggestFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockCalculationServiceApi.EstimateContentBlockResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      contentContentBlockCalculationServiceApi.EstimateContentBlockResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      contentContentBlockCalculationServiceApi.EstimateContentBlockResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          depth: (req?.contentBlock?.depth ?? 0),
        },
      }),
    );
  }

  /**
   * Explains a content block.
   */
  async explainContentBlockCalculation(req: contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest): Promise<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "ExplainContentBlockCalculation", req);
    this.logger.info("explain_content_block_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.contentBlock?.manager?.email ?? ""),
          name: req?.details?.contact?.name,
          phone: (req?.details?.contact?.phone ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.SendDeliveryAttemptTestNoticeRequest",
      value: Buffer.from(notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest, notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.sendDeliveryAttemptTestNotice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeRequest, notificationsDeliveryAttemptNotificationServiceApi.SendDeliveryAttemptTestNoticeResponse>(invoke1, unpacked1);
    const request2 = notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.contentBlock?.manager?.email ?? ""),
          name: req?.details?.contact?.name,
          phone: (req?.details?.contact?.phone ?? ""),
        },
      },
    });
    const client2 = this.clients.get<notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient>("acme.notifications.v1.NotificationNotificationService");
    const invoke2: Unary<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse> =
      (input, done) => client2.subscribeNotificationUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{ attributes: (reply1?.deliveryAttempt?.attributes ?? {}) }],
          }],
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          parentId: (req?.contentBlock?.parentId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a content block.
   */
  async getContentBlockRates(req: contentContentBlockCalculationServiceApi.GetContentBlockRatesRequest): Promise<contentContentBlockCalculationServiceApi.GetContentBlockRatesResponse> {
    validateContext(req.context);
    if (!req.contentBlockId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "content_block_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetContentBlockRates", req);
    this.logger.info("get_content_block_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const invoke1: Unary<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.checkAffinityEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    return mergeResponses(
      contentContentBlockCalculationServiceApi.GetContentBlockRatesResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      contentContentBlockCalculationServiceApi.GetContentBlockRatesResponse.fromPartial({ contentBlock: { contentBlockId: (req?.contentBlockId ?? "") } }),
    );
  }

  /**
   * Quotes a content block.
   */
  async quoteContentBlock(req: contentContentBlockCalculationServiceApi.QuoteContentBlockRequest): Promise<contentContentBlockCalculationServiceApi.QuoteContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "QuoteContentBlock", req);
    this.logger.info("quote_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostQueryServiceApi.ResolvePostsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<communityPostQueryServiceApi.ResolvePostsRequest, communityPostQueryServiceApi.ResolvePostsResponse> =
      (input, done) => this.communityPostQueryClient.resolvePosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<communityPostQueryServiceApi.ResolvePostsRequest, communityPostQueryServiceApi.ResolvePostsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockCalculationServiceApi.QuoteContentBlockResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      contentContentBlockCalculationServiceApi.QuoteContentBlockResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          name: (req?.contentBlock?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a content block.
   */
  async recalculateContentBlocks(req: contentContentBlockCalculationServiceApi.RecalculateContentBlocksRequest): Promise<contentContentBlockCalculationServiceApi.RecalculateContentBlocksResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "RecalculateContentBlocks", req);
    this.logger.info("recalculate_content_blocks", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileValidationServiceApi.ScoreProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        audit: { updatedAt: req?.contentBlock?.audit?.updatedAt },
        primaryAddress: { countryCode: (req?.contentBlock?.location?.countryCode ?? "") },
      },
    });
    const invoke1: Unary<personalizationProfileValidationServiceApi.ScoreProfileRequest, personalizationProfileValidationServiceApi.ScoreProfileResponse> =
      (input, done) => this.personalizationProfileValidationClient.scoreProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("RecalculateContentBlocks.ScoreProfile", () => call<personalizationProfileValidationServiceApi.ScoreProfileRequest, personalizationProfileValidationServiceApi.ScoreProfileResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockCalculationServiceApi.RecalculateContentBlocksResponse.fromPartial({
        contentBlock: {
          audit: { updatedBy: (reply1?.profile?.audit?.updatedBy ?? "") },
          location: { recipient: (reply1?.profile?.primaryAddress?.recipient ?? "") },
        },
      }),
      contentContentBlockCalculationServiceApi.RecalculateContentBlocksResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          status: req?.contentBlock?.status,
        },
      }),
    );
  }

  /**
   * Simulates a content block.
   */
  async simulateContentBlock(req: contentContentBlockCalculationServiceApi.SimulateContentBlockRequest): Promise<contentContentBlockCalculationServiceApi.SimulateContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "SimulateContentBlock", req);
    this.logger.info("simulate_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = forecastingDemandForecastQueryServiceApi.FindDemandForecastsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
    });
    const invoke1: Unary<forecastingDemandForecastQueryServiceApi.FindDemandForecastsRequest, forecastingDemandForecastQueryServiceApi.FindDemandForecastsResponse> =
      (input, done) => this.forecastingDemandForecastQueryClient.findDemandForecasts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = localizationLocaleValidationServiceApi.ValidateLocaleRequest.fromPartial({
      context: req?.context,
      locale: {
        audit: {
          createdAt: req?.contentBlock?.audit?.createdAt,
          updatedBy: (req?.contentBlock?.audit?.updatedBy ?? ""),
        },
        owner: { displayName: (req?.contentBlock?.manager?.displayName ?? "") },
      },
    });
    const reply2 = await this.workQueue.enqueue<localizationLocaleValidationServiceApi.ValidateLocaleRequest, localizationLocaleValidationServiceApi.ValidateLocaleResponse>(
      "acme.content.v1.ContentBlockCalculationService/SimulateContentBlock:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockCalculationServiceApi.SimulateContentBlockResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      contentContentBlockCalculationServiceApi.SimulateContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{
            audit: {
              createdAt: reply2?.locale?.audit?.createdAt,
              etag: (reply2?.locale?.audit?.etag ?? ""),
            },
          }],
        },
      }),
      contentContentBlockCalculationServiceApi.SimulateContentBlockResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          status: req?.contentBlock?.status,
        },
      }),
    );
  }
}
