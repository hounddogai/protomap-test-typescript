/**
 * Takes affinities in bulk from partners and legacy systems. Remote work stays behind typed client ports.
 */

import * as communityForumApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as localizationTranslationKeyServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { clientStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary } from "../../../platform/rpc.js";
import { collect, upload, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toAffinityRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate affinity operations and persist audit data.
 */
@injectable()
export class AffinityImportWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyService") private readonly localizationTranslationKeyClient: localizationTranslationKeyServiceApi.TranslationKeyServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Cancels an affinity.
   */
  async cancelAffinityImport(req: personalizationAffinityImportServiceApi.CancelAffinityImportRequest): Promise<personalizationAffinityImportServiceApi.CancelAffinityImportResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "CancelAffinityImport", req);
    this.logger.info("cancel_affinity_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.suggestFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = personalizationAffinityValidationServiceApi.LintAffinitiesRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.newOwner?.email ?? "") } },
    });
    const reply2 = await this.workQueue.enqueue<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse>(
      "acme.personalization.v1.AffinityImportService/CancelAffinityImport:1", request2,
    );
    const request3 = personalizationProfileValidationServiceApi.PreviewProfileRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.notifyContact?.phone ?? "") } },
      profile: {
        contact: { email: (req?.details?.newOwner?.email ?? "") },
        identityDocument: { $case: "passport", passport: { number: (reply2?.affinity?.subject?.number ?? "") } },
        relationshipManager: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const invoke3: Unary<personalizationProfileValidationServiceApi.PreviewProfileRequest, personalizationProfileValidationServiceApi.PreviewProfileResponse> =
      (input, done) => this.personalizationProfileValidationClient.previewProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<personalizationProfileValidationServiceApi.PreviewProfileRequest, personalizationProfileValidationServiceApi.PreviewProfileResponse>(invoke3, request3));
    const request4 = personalizationProfileValidationServiceApi.NormalizeProfileRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (reply3?.profile?.contact?.phone ?? "") } },
    });
    const invoke4: Unary<personalizationProfileValidationServiceApi.NormalizeProfileRequest, personalizationProfileValidationServiceApi.NormalizeProfileResponse> =
      (input, done) => this.personalizationProfileValidationClient.normalizeProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<personalizationProfileValidationServiceApi.NormalizeProfileResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request5 = notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.context?.deadline,
        source: (req?.affinityId ?? ""),
        subject: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      } },
      context: req?.context,
    });
    const stream5 = this.notificationsDeliveryAttemptSyncClient.streamDeliveryAttemptChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityImportServiceApi.CancelAffinityImportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      personalizationAffinityImportServiceApi.CancelAffinityImportResponse.fromPartial({
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      personalizationAffinityImportServiceApi.CancelAffinityImportResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          message: (reply3?.outcome?.message ?? ""),
        },
      }),
      personalizationAffinityImportServiceApi.CancelAffinityImportResponse.fromPartial({
        affinity: {
          subject: {
            displayName: (reply4?.profile?.relationshipManager?.displayName ?? ""),
          },
        },
        outcome: { status: (reply4?.result?.status ?? "") },
      }),
      personalizationAffinityImportServiceApi.CancelAffinityImportResponse.fromPartial({ affinity: { affinityId: (req?.affinityId ?? "") } }),
    );
  }

  /**
   * Returns an affinity.
   */
  async getAffinityImportStatus(req: personalizationAffinityImportServiceApi.GetAffinityImportStatusRequest): Promise<personalizationAffinityImportServiceApi.GetAffinityImportStatusResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAffinityImportStatus", req);
    this.logger.info("get_affinity_import_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    return personalizationAffinityImportServiceApi.GetAffinityImportStatusResponse.fromPartial({ affinity: { affinityId: (req?.affinityId ?? "") } });
  }

  /**
   * Takes a stream of affinities and answers once at the end.
   */
  async importAffinities(req: personalizationAffinityImportServiceApi.ImportAffinitiesRequest): Promise<personalizationAffinityImportServiceApi.ImportAffinitiesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ImportAffinities", req);
    this.logger.info("import_affinities", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexValidationServiceApi.PreviewSearchIndexRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: (req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.name,
          phone: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<searchSearchIndexValidationServiceApi.PreviewSearchIndexRequest, searchSearchIndexValidationServiceApi.PreviewSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.previewSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_1: string | undefined;
    switch (reply1?.searchIndex?.locator?.$case) {
      case "address":
        selected2_1 = ((reply1?.searchIndex?.locator?.$case === "address" ? reply1?.searchIndex?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = personalizationAffinityCalculationServiceApi.EstimateAffinityRequest.fromPartial({
      context: req?.context,
      details: { destination: { postalCode: (selected2_1 ?? "") } },
    });
    const invoke2: Unary<personalizationAffinityCalculationServiceApi.EstimateAffinityRequest, personalizationAffinityCalculationServiceApi.EstimateAffinityResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.estimateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityCalculationServiceApi.EstimateAffinityRequest, personalizationAffinityCalculationServiceApi.EstimateAffinityResponse>(invoke2, request2);
    const request3 = communityPostApprovalServiceApi.DelegatePostApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (reply1?.searchIndex?.owner?.userId ?? "") } },
      post: {
        audit: {
          etag: (reply1?.searchIndex?.audit?.etag ?? ""),
          updatedAt: reply1?.searchIndex?.audit?.updatedAt,
        },
        counterparty: { displayName: (reply2?.affinity?.subject?.displayName ?? "") },
      },
    });
    const method3 = "delegatePostApproval" as const;
    const invoke3: Unary<communityPostApprovalServiceApi.DelegatePostApprovalRequest, communityPostApprovalServiceApi.DelegatePostApprovalResponse> =
      (input, done) => this.communityPostApprovalClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityPostApprovalServiceApi.DelegatePostApprovalRequest, communityPostApprovalServiceApi.DelegatePostApprovalResponse>(invoke3, request3);
    const tasks4: Array<() => Promise<metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionResponse>> = [];
    for (const item of ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.measurements ?? [])) {
      tasks4.push(async () => {
        const request4 = metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionRequest.fromPartial({
          context: req?.context,
          metricSeries: { dimensions: { unit: (item?.unit ?? "") } },
        });
        const invoke4: Unary<metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionRequest, metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionResponse> =
          (input, done) => this.metricsMetricSeriesValidationClient.explainMetricSeriesDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply4 = await call<metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionRequest, metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionResponse>(invoke4, request4);
        return reply4;
      });
    }
    const results4 = await Promise.all(tasks4.map((task) => task()));
    const reply4 = results4.at(-1) ?? metricsMetricSeriesValidationServiceApi.ExplainMetricSeriesDecisionResponse.fromPartial({});
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.correlationId ?? "") });
    return mergeResponses(
      personalizationAffinityImportServiceApi.ImportAffinitiesResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      personalizationAffinityImportServiceApi.ImportAffinitiesResponse.fromPartial({ rejections: [{ sequence: (reply2?.affinity?.sequence ?? 0) }] }),
      personalizationAffinityImportServiceApi.ImportAffinitiesResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
    );
  }

  /**
   * Lists affinities a page at a time.
   */
  async listAffinityImports(req: personalizationAffinityImportServiceApi.ListAffinityImportsRequest): Promise<personalizationAffinityImportServiceApi.ListAffinityImportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListAffinityImports", req);
    this.logger.info("list_affinity_imports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumApprovalServiceApi.ApproveForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { createdAt: req?.filter?.createdAfter },
            location: { region: (req?.filter?.region ?? "") },
          }],
        }],
        manager: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const proxy1 = forwarding(this.communityForumApprovalClient);
    const invoke1: Unary<communityForumApprovalServiceApi.ApproveForumRequest, communityForumApprovalServiceApi.ApproveForumResponse> =
      (input, done) => proxy1.approveForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumApprovalServiceApi.ApproveForumRequest, communityForumApprovalServiceApi.ApproveForumResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        attributes: Object.fromEntries(Object.entries((reply1?.forum?.attributes ?? {}))),
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (reply1?.forum?.manager?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.syncDeliveryAttempts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      personalizationAffinityImportServiceApi.ListAffinityImportsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      personalizationAffinityImportServiceApi.ListAffinityImportsResponse.fromPartial({
        affinities: [{
          attributes: (reply2?.deliveryAttempt?.attributes ?? {}),
          source: (reply2?.deliveryAttempt?.source ?? ""),
        }],
      }),
    );
  }

  /**
   * Maps an affinity.
   */
  async mapAffinityImportColumns(req: personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest): Promise<personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "MapAffinityImportColumns", req);
    this.logger.info("map_affinity_import_columns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileQueryServiceApi.CountProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.affinity?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.affinity?.attributes ?? {}))),
        ownerId: (req?.affinity?.subject?.recommendationId ?? ""),
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<personalizationProfileQueryServiceApi.CountProfilesRequest, personalizationProfileQueryServiceApi.CountProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.countProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileQueryServiceApi.CountProfilesRequest, personalizationProfileQueryServiceApi.CountProfilesResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = communityForumWorkflowServiceApi.AdvanceForumWorkflowRequest.fromPartial({
      context: input2?.context,
      details: { notify: { phone: (input2?.details?.contact?.phone ?? "") } },
      forum: {
        children: [{
          children: [{
            attributes: Object.fromEntries(Object.entries((input2?.affinity?.attributes ?? {}))),
            manager: { email: (input2?.details?.contact?.email ?? "") },
          }],
          manager: { displayName: (input2?.affinity?.subject?.displayName ?? "") },
        }],
      },
    });
    const invoke2: Unary<communityForumWorkflowServiceApi.AdvanceForumWorkflowRequest, communityForumWorkflowServiceApi.AdvanceForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.advanceForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumWorkflowServiceApi.AdvanceForumWorkflowRequest, communityForumWorkflowServiceApi.AdvanceForumWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse.fromPartial({
        outcome: {
          effectiveAt: reply2?.outcome?.effectiveAt,
          message: (reply2?.result?.message ?? ""),
        },
      }),
      personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          attributes: (req?.affinity?.attributes ?? {}),
        },
      }),
    );
  }

  /**
   * Retrys an affinity.
   */
  async retryAffinityImport(req: personalizationAffinityImportServiceApi.RetryAffinityImportRequest): Promise<personalizationAffinityImportServiceApi.RetryAffinityImportResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "RetryAffinityImport", req);
    this.logger.info("retry_affinity_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.notify?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const cloned1: notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesResponse> =
      (input, done) => this.notificationsSubscriptionNotificationClient.unsubscribeSubscriptionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesResponse>(invoke1, cloned1);
    const request2 = communityForumApprovalServiceApi.EscalateForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{ audit: { updatedAt: reply1?.subscription?.audit?.updatedAt } }],
        }],
      },
    });
    const decoded2 = communityForumApprovalServiceApi.EscalateForumRequest.fromJSON(
      JSON.parse(JSON.stringify(communityForumApprovalServiceApi.EscalateForumRequest.toJSON(request2))),
    );
    const invoke2: Unary<communityForumApprovalServiceApi.EscalateForumRequest, communityForumApprovalServiceApi.EscalateForumResponse> =
      (input, done) => this.communityForumApprovalClient.escalateForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumApprovalServiceApi.EscalateForumRequest, communityForumApprovalServiceApi.EscalateForumResponse>(invoke2, decoded2);
    const request3 = personalizationRecommendationQueryServiceApi.PeekRecommendationRequest.fromPartial({
      context: req?.context,
      recommendationId: (req?.affinity?.subject?.recommendationId ?? ""),
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.PeekRecommendationRequest",
      value: Buffer.from(personalizationRecommendationQueryServiceApi.PeekRecommendationRequest.encode(request3).finish()),
    });
    const unpacked3 = personalizationRecommendationQueryServiceApi.PeekRecommendationRequest.decode(envelope3.value);
    const invoke3: Unary<personalizationRecommendationQueryServiceApi.PeekRecommendationRequest, personalizationRecommendationQueryServiceApi.PeekRecommendationResponse> =
      (input, done) => this.personalizationRecommendationQueryClient.peekRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationRecommendationQueryServiceApi.PeekRecommendationRequest, personalizationRecommendationQueryServiceApi.PeekRecommendationResponse>(invoke3, unpacked3);
    const request4 = localizationTranslationKeyServiceApi.BatchCreateTranslationKeysRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.affinity?.source ?? ""),
        submittedBy: req?.details?.notify,
      } },
      sequence: (req?.affinity?.sequence ?? 0),
    });
    const reply4 = await upload<localizationTranslationKeyServiceApi.BatchCreateTranslationKeysRequest, localizationTranslationKeyServiceApi.BatchCreateTranslationKeysResponse>(
      (done) => this.localizationTranslationKeyClient.batchCreateTranslationKeys(metadataFor(request4.context), { deadline: Date.now() + 15_000 }, done), [request4],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityImportServiceApi.RetryAffinityImportResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      personalizationAffinityImportServiceApi.RetryAffinityImportResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      personalizationAffinityImportServiceApi.RetryAffinityImportResponse.fromPartial({
        affinity: {
          subject: { recommendationId: (reply3?.recommendation?.recommendationId ?? "") },
        },
      }),
      personalizationAffinityImportServiceApi.RetryAffinityImportResponse.fromPartial({
        affinity: { affinityId: (req?.affinityId ?? "") },
        result: { correlationId: (req?.affinity?.correlationId ?? "") },
      }),
    );
  }
}

/**
 * The gRPC boundary for AffinityImportService; workflows own validation and database transactions.
 */
@injectable()
export class AffinityImportHandler {
  constructor(@inject(AffinityImportWorkflow) private readonly workflow: AffinityImportWorkflow) {}

  /**
   * Cancels an affinity.
   */
  cancelAffinityImport = unary<personalizationAffinityImportServiceApi.CancelAffinityImportRequest, personalizationAffinityImportServiceApi.CancelAffinityImportResponse>(
    (request) => this.workflow.cancelAffinityImport(request),
  );

  /**
   * Returns an affinity.
   */
  getAffinityImportStatus = unary<personalizationAffinityImportServiceApi.GetAffinityImportStatusRequest, personalizationAffinityImportServiceApi.GetAffinityImportStatusResponse>(
    (request) => this.workflow.getAffinityImportStatus(request),
  );

  /**
   * Takes a stream of affinities and answers once at the end.
   */
  importAffinities = clientStream<personalizationAffinityImportServiceApi.ImportAffinitiesRequest, personalizationAffinityImportServiceApi.ImportAffinitiesResponse>(
    (request) => this.workflow.importAffinities(request), () => personalizationAffinityImportServiceApi.ImportAffinitiesResponse.fromPartial({}),
  );

  /**
   * Lists affinities a page at a time.
   */
  listAffinityImports = unary<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>(
    (request) => this.workflow.listAffinityImports(request),
  );

  /**
   * Maps an affinity.
   */
  mapAffinityImportColumns = unary<personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest, personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse>(
    (request) => this.workflow.mapAffinityImportColumns(request),
  );

  /**
   * Retrys an affinity.
   */
  retryAffinityImport = (call: ServerUnaryCall<personalizationAffinityImportServiceApi.RetryAffinityImportRequest, personalizationAffinityImportServiceApi.RetryAffinityImportResponse>, done: sendUnaryData<personalizationAffinityImportServiceApi.RetryAffinityImportResponse>): void => {
    void this.workflow.retryAffinityImport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: AffinityImportHandler): personalizationAffinityImportServiceApi.AffinityImportServiceServer {
  return {
    cancelAffinityImport: handler.cancelAffinityImport,
    getAffinityImportStatus: handler.getAffinityImportStatus,
    importAffinities: handler.importAffinities,
    listAffinityImports: handler.listAffinityImports,
    mapAffinityImportColumns: handler.mapAffinityImportColumns,
    retryAffinityImport: handler.retryAffinityImport,
  };
}
