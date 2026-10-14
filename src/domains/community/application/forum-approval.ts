/**
 * Routes forums through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as communityBadgeCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityForumApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityForumQueryServiceApi from "../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityModerationCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityModerationLifecycleServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_lifecycle_service.js";
import * as communityPostQueryServiceApi from "../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as contentContentRevisionValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as localizationTranslationKeyServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
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
  operation,
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
export class ForumApprovalWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.community.v1.ModerationLifecycleService") private readonly communityModerationLifecycleClient: communityModerationLifecycleServiceApi.ModerationLifecycleServiceClient,
    @inject("grpc:acme.community.v1.PostQueryService") private readonly communityPostQueryClient: communityPostQueryServiceApi.PostQueryServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionValidationService") private readonly contentContentRevisionValidationClient: contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyService") private readonly localizationTranslationKeyClient: localizationTranslationKeyServiceApi.TranslationKeyServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a forum.
   */
  async approveForum(req: communityForumApprovalServiceApi.ApproveForumRequest): Promise<communityForumApprovalServiceApi.ApproveForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "ApproveForum", req);
    this.logger.info("approve_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyServiceApi.SearchTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.forum?.location?.region ?? "") },
    });
    const invoke1: Unary<localizationTranslationKeyServiceApi.SearchTranslationKeysRequest, localizationTranslationKeyServiceApi.SearchTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyClient.searchTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.forum?.location?.region ?? "") } },
      ledgerAccount: {
        audit: {
          etag: (req?.forum?.audit?.etag ?? ""),
          updatedAt: req?.forum?.audit?.updatedAt,
        },
        contact: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const method2 = "scoreLedgerAccount" as const;
    const invoke2: Unary<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumApprovalServiceApi.ApproveForumResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      communityForumApprovalServiceApi.ApproveForumResponse.fromPartial({
        forum: {
          children: [{
            children: [{ audit: { createdAt: reply2?.ledgerAccount?.audit?.createdAt } }],
          }],
          manager: { displayName: (reply2?.ledgerAccount?.holder?.displayName ?? "") },
        },
      }),
      communityForumApprovalServiceApi.ApproveForumResponse.fromPartial({
        forum: {
          forumId: (req?.forumId ?? ""),
          location: req?.forum?.location,
        },
      }),
    );
  }

  /**
   * Comments a forum.
   */
  async commentForumApproval(req: communityForumApprovalServiceApi.CommentForumApprovalRequest): Promise<communityForumApprovalServiceApi.CommentForumApprovalResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "CommentForumApproval", req);
    this.logger.info("comment_forum_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumQueryServiceApi.ExportForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (req?.forum?.location?.region ?? ""),
      },
    });
    const stream1 = this.communityForumQueryClient.exportForums(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? communityForumQueryServiceApi.ExportForumsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return communityForumApprovalServiceApi.CommentForumApprovalResponse.fromPartial({
      forum: { forumId: (req?.forumId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Delegates a forum.
   */
  async delegateForumApproval(req: communityForumApprovalServiceApi.DelegateForumApprovalRequest): Promise<communityForumApprovalServiceApi.DelegateForumApprovalResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "DelegateForumApproval", req);
    this.logger.info("delegate_forum_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeCalculationServiceApi.EstimateBadgeRequest.fromPartial({
      context: req?.context,
      details: { destination: { postalCode: (req?.forum?.location?.postalCode ?? "") } },
    });
    const proxy1 = forwarding(this.communityBadgeCalculationClient);
    const invoke1: Unary<communityBadgeCalculationServiceApi.EstimateBadgeRequest, communityBadgeCalculationServiceApi.EstimateBadgeResponse> =
      (input, done) => proxy1.estimateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeCalculationServiceApi.EstimateBadgeRequest, communityBadgeCalculationServiceApi.EstimateBadgeResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumApprovalServiceApi.DelegateForumApprovalResponse.fromPartial({
        forum: {
          children: [{
            children: [{ audit: { createdBy: (reply1?.badge?.audit?.createdBy ?? "") } }],
          }],
        },
      }),
      communityForumApprovalServiceApi.DelegateForumApprovalResponse.fromPartial({
        forum: {
          forumId: (req?.forumId ?? ""),
          status: req?.forum?.status,
        },
      }),
    );
  }

  /**
   * Escalates a forum.
   */
  async escalateForum(req: communityForumApprovalServiceApi.EscalateForumRequest): Promise<communityForumApprovalServiceApi.EscalateForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "EscalateForum", req);
    this.logger.info("escalate_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.forum?.audit?.updatedAt,
        ownerId: (req?.forum?.parentId ?? ""),
        region: (req?.forum?.location?.region ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest, notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsResponse> =
      (input, done) => this.notificationsNotificationTemplateNotificationClient.listNotificationTemplateSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest, notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsResponse>(invoke1, request1);
    const request2 = customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest.fromPartial({
      consentRecord: { subject: { displayName: (req?.details?.approver?.displayName ?? "") } },
      context: req?.context,
      details: {
        destination: {
          locality: (req?.forum?.location?.locality ?? ""),
          postalCode: (req?.forum?.location?.postalCode ?? ""),
          region: (req?.forum?.location?.region ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.compareConsentRecordOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumApprovalServiceApi.EscalateForumResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      communityForumApprovalServiceApi.EscalateForumResponse.fromPartial({
        forum: {
          children: [{
            attributes: (reply2?.consentRecord?.attributes ?? {}),
            children: [{
              manager: { displayName: (reply2?.consentRecord?.subject?.displayName ?? "") },
            }],
          }],
        },
      }),
      communityForumApprovalServiceApi.EscalateForumResponse.fromPartial({
        forum: {
          forumId: (req?.forumId ?? ""),
          location: req?.forum?.location,
        },
      }),
    );
  }

  /**
   * Returns a forum.
   */
  async getForumApprovalStatus(req: communityForumApprovalServiceApi.GetForumApprovalStatusRequest): Promise<communityForumApprovalServiceApi.GetForumApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.forumId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "forum_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetForumApprovalStatus", req);
    this.logger.info("get_forum_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = personalizationProfileQueryServiceApi.SummarizeProfilesRequest.fromPartial({
      context: input1?.context,
      details: {
        filters: Object.fromEntries(Object.entries((input1?.context?.baggage ?? {}))),
      },
    });
    const invoke1: Unary<personalizationProfileQueryServiceApi.SummarizeProfilesRequest, personalizationProfileQueryServiceApi.SummarizeProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.summarizeProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileQueryServiceApi.SummarizeProfilesRequest, personalizationProfileQueryServiceApi.SummarizeProfilesResponse>(invoke1, request1);
    return mergeResponses(
      communityForumApprovalServiceApi.GetForumApprovalStatusResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      communityForumApprovalServiceApi.GetForumApprovalStatusResponse.fromPartial({ forum: { forumId: (req?.forumId ?? "") } }),
    );
  }

  /**
   * Lists forums a page at a time.
   */
  async listPendingForums(req: communityForumApprovalServiceApi.ListPendingForumsRequest): Promise<communityForumApprovalServiceApi.ListPendingForumsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingForums", req);
    this.logger.info("list_pending_forums", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionValidationServiceApi.ScoreContentRevisionRequest.fromPartial({
      contentRevision: {
        occurredAt: req?.filter?.createdAfter,
        subject: { email: (req?.context?.actor?.email ?? "") },
      },
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const cloned1: contentContentRevisionValidationServiceApi.ScoreContentRevisionRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<contentContentRevisionValidationServiceApi.ScoreContentRevisionRequest, contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse> =
      (input, done) => this.contentContentRevisionValidationClient.scoreContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentRevisionValidationServiceApi.ScoreContentRevisionRequest, contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityForumApprovalServiceApi.ListPendingForumsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } });
  }

  /**
   * Recalls a forum.
   */
  async recallForum(req: communityForumApprovalServiceApi.RecallForumRequest): Promise<communityForumApprovalServiceApi.RecallForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "RecallForum", req);
    this.logger.info("recall_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest.fromPartial({
      contentRevision: { subject: { email: (req?.details?.approver?.email ?? "") } },
      context: req?.context,
    });
    const decoded1 = contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest.fromJSON(
      JSON.parse(JSON.stringify(contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest.toJSON(request1))),
    );
    const invoke1: Unary<contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest, contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse> =
      (input, done) => this.contentContentRevisionValidationClient.normalizeContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest, contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse>(invoke1, decoded1);
    const request2 = communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: { displayName: (req?.forum?.manager?.displayName ?? "") },
        audit: { etag: (req?.forum?.audit?.etag ?? "") },
        origin: { $case: "customer", customer: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
        } },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.ScheduleModerationExpiryRequest",
      value: Buffer.from(communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest.encode(request2).finish()),
    });
    const unpacked2 = communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest.decode(envelope2.value);
    const invoke2: Unary<communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest, communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse> =
      (input, done) => this.communityModerationLifecycleClient.scheduleModerationExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest, communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumApprovalServiceApi.RecallForumResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      communityForumApprovalServiceApi.RecallForumResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      communityForumApprovalServiceApi.RecallForumResponse.fromPartial({
        forum: {
          forumId: (req?.forumId ?? ""),
          name: (req?.forum?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a forum.
   */
  async rejectForum(req: communityForumApprovalServiceApi.RejectForumRequest): Promise<communityForumApprovalServiceApi.RejectForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "RejectForum", req);
    this.logger.info("reject_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest.fromPartial({
      context: req?.context,
      subscription: { audit: { updatedBy: (req?.forum?.audit?.updatedBy ?? "") } },
    });
    const client1 = this.clients.get<notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient>("acme.notifications.v1.SubscriptionCalculationService");
    const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest, notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse> =
      (input, done) => client1.compareSubscriptionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest, notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse>(invoke1, request1);
    const request2 = communityModerationCalculationServiceApi.CalculateModerationRequest.fromPartial({
      context: req?.context,
      moderation: { audit: { etag: (reply1?.subscription?.audit?.etag ?? "") } },
    });
    const invoke2: Unary<communityModerationCalculationServiceApi.CalculateModerationRequest, communityModerationCalculationServiceApi.CalculateModerationResponse> =
      (input, done) => this.communityModerationCalculationClient.calculateModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<communityModerationCalculationServiceApi.CalculateModerationRequest, communityModerationCalculationServiceApi.CalculateModerationResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = communityForumServiceApi.CreateForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: {
              etag: (req?.forum?.audit?.etag ?? ""),
              updatedBy: (req?.forum?.audit?.updatedBy ?? ""),
            },
            location: { recipient: (req?.forum?.location?.recipient ?? "") },
            manager: { userId: (req?.details?.approver?.userId ?? "") },
          }],
        }],
      },
    });
    const invoke3: Unary<communityForumServiceApi.CreateForumRequest, communityForumServiceApi.CreateForumResponse> =
      (input, done) => this.communityForumClient.createForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<communityForumServiceApi.CreateForumRequest, communityForumServiceApi.CreateForumResponse>(invoke3, request3));
    let selected4_2: string | undefined;
    switch (reply2?.moderation?.origin?.$case) {
      case "customer":
        selected4_2 = ((reply2?.moderation?.origin?.$case === "customer" ? reply2?.moderation?.origin.customer : undefined)?.email ?? "");
        break;
      default:
        selected4_2 = "";
    }
    const request4 = customersCustomerCalculationServiceApi.QuoteCustomerRequest.fromPartial({
      context: req?.context,
      customer: {
        contact: { email: (selected4_2 ?? "") },
        relationshipManager: {
          email: (reply3?.forum?.manager?.email ?? ""),
          userId: (reply2?.moderation?.assignee?.userId ?? ""),
        },
      },
    });
    const invoke4: Unary<customersCustomerCalculationServiceApi.QuoteCustomerRequest, customersCustomerCalculationServiceApi.QuoteCustomerResponse> =
      (input, done) => this.customersCustomerCalculationClient.quoteCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersCustomerCalculationServiceApi.QuoteCustomerRequest, customersCustomerCalculationServiceApi.QuoteCustomerResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumApprovalServiceApi.RejectForumResponse.fromPartial({
        forum: { manager: { email: (reply1?.subscription?.owner?.email ?? "") } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      communityForumApprovalServiceApi.RejectForumResponse.fromPartial({
        forum: {
          audit: { createdBy: (reply2?.moderation?.audit?.createdBy ?? "") },
          children: [{
            children: [{ audit: { etag: (reply2?.moderation?.audit?.etag ?? "") } }],
          }],
        },
      }),
      communityForumApprovalServiceApi.RejectForumResponse.fromPartial({
        forum: {
          children: [{ children: [{ audit: { updatedAt: reply3?.forum?.audit?.updatedAt } }] }],
        },
      }),
      communityForumApprovalServiceApi.RejectForumResponse.fromPartial({
        forum: {
          children: [{
            location: { countryCode: (reply4?.customer?.primaryAddress?.countryCode ?? "") },
            manager: { email: (reply4?.customer?.contact?.email ?? "") },
          }],
        },
      }),
      communityForumApprovalServiceApi.RejectForumResponse.fromPartial({
        forum: {
          forumId: (req?.forumId ?? ""),
          name: (req?.forum?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a forum.
   */
  async submitForum(req: communityForumApprovalServiceApi.SubmitForumRequest): Promise<communityForumApprovalServiceApi.SubmitForumResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "SubmitForum", req);
    this.logger.info("submit_forum", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostQueryServiceApi.SummarizePostsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.forum?.attributes ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<communityPostQueryServiceApi.SummarizePostsRequest, communityPostQueryServiceApi.SummarizePostsResponse> =
      (input, done) => this.communityPostQueryClient.summarizePosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      communityForumApprovalServiceApi.SubmitForumResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      communityForumApprovalServiceApi.SubmitForumResponse.fromPartial({
        forum: {
          depth: (req?.forum?.depth ?? 0),
          forumId: (req?.forumId ?? ""),
        },
      }),
    );
  }
}
