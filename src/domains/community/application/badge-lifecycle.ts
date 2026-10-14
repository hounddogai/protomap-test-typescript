/**
 * Moves a badge between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as communityBadgeLifecycleServiceApi from "../../../../.cache/proto/acme/community/v1/badge_lifecycle_service.js";
import * as communityBadgeValidationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as communityForumQueryServiceApi from "../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostQueryServiceApi from "../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as contentContentRevisionCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as contentTaxonomyValidationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as mediaMediaAssetServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as mediaRenditionQueryServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as merchandisingCollectionQueryServiceApi from "../../../../.cache/proto/acme/merchandising/v1/collection_query_service.js";
import * as messagingChatMessageQueryServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_query_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toBadgeRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate badge operations and persist audit data.
 */
@injectable()
export class BadgeLifecycleWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostQueryService") private readonly communityPostQueryClient: communityPostQueryServiceApi.PostQueryServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionCalculationService") private readonly contentContentRevisionCalculationClient: contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyValidationService") private readonly contentTaxonomyValidationClient: contentTaxonomyValidationServiceApi.TaxonomyValidationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.media.v1.RenditionQueryService") private readonly mediaRenditionQueryClient: mediaRenditionQueryServiceApi.RenditionQueryServiceClient,
    @inject("grpc:acme.merchandising.v1.CollectionQueryService") private readonly merchandisingCollectionQueryClient: merchandisingCollectionQueryServiceApi.CollectionQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageQueryService") private readonly messagingChatMessageQueryClient: messagingChatMessageQueryServiceApi.ChatMessageQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a badge.
   */
  async activateBadge(req: communityBadgeLifecycleServiceApi.ActivateBadgeRequest): Promise<communityBadgeLifecycleServiceApi.ActivateBadgeResponse> {
    validateContext(req.context);
    if (!req.badgeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "badge_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateBadge", req);
    this.logger.info("activate_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageQueryServiceApi.SummarizeChatMessagesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const cloned1: messagingChatMessageQueryServiceApi.SummarizeChatMessagesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<messagingChatMessageQueryServiceApi.SummarizeChatMessagesRequest, messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse> =
      (input, done) => this.messagingChatMessageQueryClient.summarizeChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageQueryServiceApi.SummarizeChatMessagesRequest, messagingChatMessageQueryServiceApi.SummarizeChatMessagesResponse>(invoke1, cloned1);
    const request2 = contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest.fromPartial({
      contentRevision: {
        subject: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const decoded2 = contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest.fromJSON(
      JSON.parse(JSON.stringify(contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest.toJSON(request2))),
    );
    const invoke2: Unary<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.compareContentRevisionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      communityBadgeLifecycleServiceApi.ActivateBadgeResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      communityBadgeLifecycleServiceApi.ActivateBadgeResponse.fromPartial({
        result: { correlationId: (reply2?.contentRevision?.correlationId ?? "") },
      }),
      communityBadgeLifecycleServiceApi.ActivateBadgeResponse.fromPartial({
        badge: { badgeId: (req?.badgeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a badge.
   */
  async expireBadge(req: communityBadgeLifecycleServiceApi.ExpireBadgeRequest): Promise<communityBadgeLifecycleServiceApi.ExpireBadgeResponse> {
    validateContext(req.context);
    if (!req.badgeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "badge_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireBadge", req);
    this.logger.info("expire_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = merchandisingCollectionQueryServiceApi.CountCollectionsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.merchandising.v1.CountCollectionsRequest",
      value: Buffer.from(merchandisingCollectionQueryServiceApi.CountCollectionsRequest.encode(request1).finish()),
    });
    const unpacked1 = merchandisingCollectionQueryServiceApi.CountCollectionsRequest.decode(envelope1.value);
    const invoke1: Unary<merchandisingCollectionQueryServiceApi.CountCollectionsRequest, merchandisingCollectionQueryServiceApi.CountCollectionsResponse> =
      (input, done) => this.merchandisingCollectionQueryClient.countCollections(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<merchandisingCollectionQueryServiceApi.CountCollectionsRequest, merchandisingCollectionQueryServiceApi.CountCollectionsResponse>(invoke1, unpacked1);
    const request2 = customersCustomerQueryServiceApi.SuggestCustomersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
    });
    const client2 = this.clients.get<customersCustomerQueryServiceApi.CustomerQueryServiceClient>("acme.customers.v1.CustomerQueryService");
    const invoke2: Unary<customersCustomerQueryServiceApi.SuggestCustomersRequest, customersCustomerQueryServiceApi.SuggestCustomersResponse> =
      (input, done) => client2.suggestCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersCustomerQueryServiceApi.SuggestCustomersRequest, customersCustomerQueryServiceApi.SuggestCustomersResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeLifecycleServiceApi.ExpireBadgeResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      communityBadgeLifecycleServiceApi.ExpireBadgeResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      communityBadgeLifecycleServiceApi.ExpireBadgeResponse.fromPartial({
        badge: { badgeId: (req?.badgeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a badge.
   */
  async getBadgeLifecycle(req: communityBadgeLifecycleServiceApi.GetBadgeLifecycleRequest): Promise<communityBadgeLifecycleServiceApi.GetBadgeLifecycleResponse> {
    validateContext(req.context);
    if (!req.badgeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "badge_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetBadgeLifecycle", req);
    this.logger.info("get_badge_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    return communityBadgeLifecycleServiceApi.GetBadgeLifecycleResponse.fromPartial({ badge: { badgeId: (req?.badgeId ?? "") } });
  }

  /**
   * Reinstates a badge.
   */
  async reinstateBadge(req: communityBadgeLifecycleServiceApi.ReinstateBadgeRequest): Promise<communityBadgeLifecycleServiceApi.ReinstateBadgeResponse> {
    validateContext(req.context);
    if (!req.badgeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "badge_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateBadge", req);
    this.logger.info("reinstate_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.scheduleNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      communityBadgeLifecycleServiceApi.ReinstateBadgeResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      communityBadgeLifecycleServiceApi.ReinstateBadgeResponse.fromPartial({
        badge: { badgeId: (req?.badgeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews a badge.
   */
  async renewBadge(req: communityBadgeLifecycleServiceApi.RenewBadgeRequest): Promise<communityBadgeLifecycleServiceApi.RenewBadgeResponse> {
    validateContext(req.context);
    if (!req.badgeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "badge_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewBadge", req);
    this.logger.info("renew_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest, mediaMediaAssetServiceApi.BatchGetMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetClient.batchGetMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest, mediaMediaAssetServiceApi.BatchGetMediaAssetsResponse>(invoke1, request1));
    const request2 = communityForumQueryServiceApi.BrowseForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.badgeId ?? ""),
      },
    });
    const invoke2: Unary<communityForumQueryServiceApi.BrowseForumsRequest, communityForumQueryServiceApi.BrowseForumsResponse> =
      (input, done) => this.communityForumQueryClient.browseForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("RenewBadge.BrowseForums", () => call<communityForumQueryServiceApi.BrowseForumsRequest, communityForumQueryServiceApi.BrowseForumsResponse>(invoke2, request2));
    const request3 = contentTaxonomyValidationServiceApi.LintTaxonomiesRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{ manager: { email: (req?.details?.newOwner?.email ?? "") } }],
          manager: {
            email: (req?.details?.notifyContact?.email ?? ""),
            userId: (req?.details?.newOwner?.userId ?? ""),
          },
        }],
      },
    });
    const invoke3: Unary<contentTaxonomyValidationServiceApi.LintTaxonomiesRequest, contentTaxonomyValidationServiceApi.LintTaxonomiesResponse> =
      (input, done) => this.contentTaxonomyValidationClient.lintTaxonomies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeLifecycleServiceApi.RenewBadgeResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      communityBadgeLifecycleServiceApi.RenewBadgeResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      communityBadgeLifecycleServiceApi.RenewBadgeResponse.fromPartial({
        badge: {
          owner: { displayName: (reply3?.taxonomy?.manager?.displayName ?? "") },
        },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      communityBadgeLifecycleServiceApi.RenewBadgeResponse.fromPartial({
        badge: { badgeId: (req?.badgeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules a badge.
   */
  async scheduleBadgeExpiry(req: communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest): Promise<communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "ScheduleBadgeExpiry", req);
    this.logger.info("schedule_badge_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      consentRecord: { subject: { displayName: (req?.badge?.owner?.displayName ?? "") } },
      context: req?.context,
      details: {
        budget: (req?.badge?.action?.$case === "discount" ? req?.badge?.action.discount : undefined)?.amount,
      },
      reason: (req?.reason ?? ""),
    });
    const reply1 = await this.workQueue.enqueue<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse>(
      "acme.community.v1.BadgeLifecycleService/ScheduleBadgeExpiry:0", request1,
    );
    const request2 = personalizationProfileValidationServiceApi.PreviewProfileRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
      profile: {
        audit: {
          createdBy: (req?.badge?.audit?.createdBy ?? ""),
          updatedBy: (req?.badge?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationProfileValidationServiceApi.PreviewProfileRequest, personalizationProfileValidationServiceApi.PreviewProfileResponse> =
      (input, done) => this.personalizationProfileValidationClient.previewProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<personalizationProfileValidationServiceApi.PreviewProfileRequest, personalizationProfileValidationServiceApi.PreviewProfileResponse>(invoke2, request2));
    const request3 = communityForumQueryServiceApi.ExportForumsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply2?.profile?.primaryAddress?.region ?? "") },
    });
    const stream3 = this.communityForumQueryClient.exportForums(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? communityForumQueryServiceApi.ExportForumsResponse.fromPartial({});
    const request4 = customersHouseholdValidationServiceApi.PreviewHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: { createdBy: (req?.badge?.audit?.createdBy ?? "") },
            manager: { email: (reply2?.profile?.relationshipManager?.email ?? "") },
          }],
        }],
      },
    });
    const invoke4: Unary<customersHouseholdValidationServiceApi.PreviewHouseholdRequest, customersHouseholdValidationServiceApi.PreviewHouseholdResponse> =
      (input, done) => this.customersHouseholdValidationClient.previewHousehold(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<customersHouseholdValidationServiceApi.PreviewHouseholdResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.notify?.phone ?? "") });
    return mergeResponses(
      communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse.fromPartial({
        badge: { audit: { updatedBy: (reply2?.profile?.audit?.updatedBy ?? "") } },
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
      }),
      communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse.fromPartial({
        badge: {
          name: (reply4?.household?.name ?? ""),
          owner: { displayName: (reply4?.household?.manager?.displayName ?? "") },
        },
      }),
      communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          parameters: (req?.details?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Suspends a badge.
   */
  async suspendBadge(req: communityBadgeLifecycleServiceApi.SuspendBadgeRequest): Promise<communityBadgeLifecycleServiceApi.SuspendBadgeResponse> {
    validateContext(req.context);
    if (!req.badgeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "badge_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendBadge", req);
    this.logger.info("suspend_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostQueryServiceApi.FindPostsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const invoke1: Unary<communityPostQueryServiceApi.FindPostsRequest, communityPostQueryServiceApi.FindPostsResponse> =
      (input, done) => this.communityPostQueryClient.findPosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = communityPostCalculationServiceApi.CalculatePostRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      post: {
        counterparty: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse> =
      (input, done) => this.communityPostCalculationClient.calculatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = mediaRenditionQueryServiceApi.SummarizeRenditionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const method3 = "summarizeRenditions" as const;
    const invoke3: Unary<mediaRenditionQueryServiceApi.SummarizeRenditionsRequest, mediaRenditionQueryServiceApi.SummarizeRenditionsResponse> =
      (input, done) => this.mediaRenditionQueryClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaRenditionQueryServiceApi.SummarizeRenditionsRequest, mediaRenditionQueryServiceApi.SummarizeRenditionsResponse>(invoke3, request3);
    const request4 = communityBadgeValidationServiceApi.PreviewBadgeRequest.fromPartial({
      badge: { owner: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      context: req?.context,
    });
    const proxy4 = forwarding(this.communityBadgeValidationClient);
    const invoke4: Unary<communityBadgeValidationServiceApi.PreviewBadgeRequest, communityBadgeValidationServiceApi.PreviewBadgeResponse> =
      (input, done) => proxy4.previewBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<communityBadgeValidationServiceApi.PreviewBadgeRequest, communityBadgeValidationServiceApi.PreviewBadgeResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      communityBadgeLifecycleServiceApi.SuspendBadgeResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      communityBadgeLifecycleServiceApi.SuspendBadgeResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      communityBadgeLifecycleServiceApi.SuspendBadgeResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          details: (reply3?.result?.details ?? {}),
        },
      }),
      communityBadgeLifecycleServiceApi.SuspendBadgeResponse.fromPartial({ badge: { audit: { updatedAt: reply4?.badge?.audit?.updatedAt } } }),
      communityBadgeLifecycleServiceApi.SuspendBadgeResponse.fromPartial({
        badge: { badgeId: (req?.badgeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}
