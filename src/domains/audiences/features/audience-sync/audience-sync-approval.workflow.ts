/**
 * Routes audience syncs through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as audiencesAudienceApprovalServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import * as audiencesAudienceMemberApprovalServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as audiencesAudienceMemberQueryServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_query_service.js";
import * as audiencesAudienceQueryServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import * as audiencesAudienceServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as audiencesAudienceSyncApprovalServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_sync_approval_service.js";
import * as audiencesAudienceSyncLifecycleServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_sync_lifecycle_service.js";
import * as audiencesAudienceWorkflowServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_workflow_service.js";
import * as contentArticleWorkflowServiceApi from "../../../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as contentTaxonomyApprovalServiceApi from "../../../../../.cache/proto/acme/content/v1/taxonomy_approval_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as labelingLabelingTaskQueryServiceApi from "../../../../../.cache/proto/acme/labeling/v1/labeling_task_query_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
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
} from "../../../../platform/rpc.js";
import { collect, upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toAudienceSyncRecord } from "../../data/records.js";
import { AudiencesRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience sync operations and persist audit data.
 */
@injectable()
export class AudienceSyncApprovalWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceApprovalService") private readonly audiencesAudienceApprovalClient: audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberApprovalService") private readonly audiencesAudienceMemberApprovalClient: audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberQueryService") private readonly audiencesAudienceMemberQueryClient: audiencesAudienceMemberQueryServiceApi.AudienceMemberQueryServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceQueryService") private readonly audiencesAudienceQueryClient: audiencesAudienceQueryServiceApi.AudienceQueryServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceService") private readonly audiencesAudienceClient: audiencesAudienceServiceApi.AudienceServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncLifecycleService") private readonly audiencesAudienceSyncLifecycleClient: audiencesAudienceSyncLifecycleServiceApi.AudienceSyncLifecycleServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceWorkflowService") private readonly audiencesAudienceWorkflowClient: audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient,
    @inject("grpc:acme.content.v1.ArticleWorkflowService") private readonly contentArticleWorkflowClient: contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyApprovalService") private readonly contentTaxonomyApprovalClient: contentTaxonomyApprovalServiceApi.TaxonomyApprovalServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.labeling.v1.LabelingTaskQueryService") private readonly labelingLabelingTaskQueryClient: labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves an audience sync.
   */
  async approveAudienceSync(req: audiencesAudienceSyncApprovalServiceApi.ApproveAudienceSyncRequest): Promise<audiencesAudienceSyncApprovalServiceApi.ApproveAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "ApproveAudienceSync", req);
    this.logger.info("approve_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.ExportFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (req?.audienceSync?.subject?.audienceMemberId ?? ""),
      },
    });
    const stream1 = this.featureflagsFeatureFlagQueryClient.exportFeatureFlags(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? featureflagsFeatureFlagQueryServiceApi.ExportFeatureFlagsResponse.fromPartial({});
    const request2 = ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      ledgerAccount: {
        contact: { email: (req?.details?.approver?.email ?? "") },
        holder: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.scoreLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.details?.approver?.userId ?? "") });
    return mergeResponses(
      audiencesAudienceSyncApprovalServiceApi.ApproveAudienceSyncResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      audiencesAudienceSyncApprovalServiceApi.ApproveAudienceSyncResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          occurredAt: req?.audienceSync?.occurredAt,
        },
      }),
    );
  }

  /**
   * Comments an audience sync.
   */
  async commentAudienceSyncApproval(req: audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalRequest): Promise<audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "CommentAudienceSyncApproval", req);
    this.logger.info("comment_audience_sync_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleApprovalServiceApi.SubmitLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.audienceSync?.subject?.displayName ?? ""),
          email: (req?.audienceSync?.subject?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<localizationLocaleApprovalServiceApi.SubmitLocaleRequest, localizationLocaleApprovalServiceApi.SubmitLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient.submitLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<localizationLocaleApprovalServiceApi.SubmitLocaleRequest, localizationLocaleApprovalServiceApi.SubmitLocaleResponse>(invoke1, request1));
    const request2 = audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse> =
      (input, done) => this.audiencesAudienceMemberQueryClient.resolveAudienceMembers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("CommentAudienceSyncApproval.ResolveAudienceMembers", () => call<audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse>(invoke2, request2));
    const request3 = audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncRequest.fromPartial({
      audienceSyncId: (req?.audienceSync?.audienceSyncId ?? ""),
      context: req?.context,
      details: {
        newOwner: {
          displayName: (reply1?.locale?.owner?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
          userId: (reply1?.locale?.owner?.userId ?? ""),
        },
        notifyContact: { email: (reply1?.locale?.owner?.email ?? "") },
      },
    });
    const invoke3: Unary<audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncLifecycleClient.activateAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.outcome?.message ?? ""),
        },
      }),
      audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalResponse.fromPartial({
        audienceSync: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalResponse.fromPartial({
        audienceSync: { subject: { email: (reply3?.audienceSync?.subject?.email ?? "") } },
        result: { message: (reply3?.outcome?.message ?? "") },
      }),
      audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          source: (req?.audienceSync?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates an audience sync.
   */
  async delegateAudienceSyncApproval(req: audiencesAudienceSyncApprovalServiceApi.DelegateAudienceSyncApprovalRequest): Promise<audiencesAudienceSyncApprovalServiceApi.DelegateAudienceSyncApprovalResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "DelegateAudienceSyncApproval", req);
    this.logger.info("delegate_audience_sync_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.audienceSync?.subject?.audienceMemberId ?? "") },
    });
    const reply1 = await this.workQueue.enqueue<audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsRequest, audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsResponse>(
      "acme.audiences.v1.AudienceSyncApprovalService/DelegateAudienceSyncApproval:0", request1,
    );
    const request2 = notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        correlationId: (req?.audienceSync?.correlationId ?? ""),
        occurredAt: req?.audienceSync?.occurredAt,
        subject: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.compareDeliveryAttemptVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncApprovalServiceApi.DelegateAudienceSyncApprovalResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      audiencesAudienceSyncApprovalServiceApi.DelegateAudienceSyncApprovalResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      audiencesAudienceSyncApprovalServiceApi.DelegateAudienceSyncApprovalResponse.fromPartial({
        audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") },
        result: { correlationId: (req?.audienceSync?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Escalates an audience sync.
   */
  async escalateAudienceSync(req: audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncRequest): Promise<audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "EscalateAudienceSync", req);
    this.logger.info("escalate_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = labelingLabelingTaskQueryServiceApi.ExportLabelingTasksRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.audienceSync?.attributes ?? {}))),
        ownerId: (req?.audienceSync?.correlationId ?? ""),
      },
    });
    const stream1 = this.labelingLabelingTaskQueryClient.exportLabelingTasks(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? labelingLabelingTaskQueryServiceApi.ExportLabelingTasksResponse.fromPartial({});
    const request2 = notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: {
          email: (req?.audienceSync?.subject?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
        requester: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const invoke2: Unary<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.annotateNotificationVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.notification?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply2?.notification?.customFields ?? {}))),
        ownerId: (reply2?.notification?.sla?.policyId ?? ""),
      },
    });
    const invoke3: Unary<audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest, audiencesAudienceApprovalServiceApi.ListPendingAudiencesResponse> =
      (input, done) => this.audiencesAudienceApprovalClient.listPendingAudiences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncResponse.fromPartial({
        audienceSync: { subject: { email: (reply2?.notification?.assignee?.email ?? "") } },
        outcome: { status: (reply2?.result?.status ?? "") },
      }),
      audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      audiencesAudienceSyncApprovalServiceApi.EscalateAudienceSyncResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          kind: (req?.audienceSync?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Returns an audience sync.
   */
  async getAudienceSyncApprovalStatus(req: audiencesAudienceSyncApprovalServiceApi.GetAudienceSyncApprovalStatusRequest): Promise<audiencesAudienceSyncApprovalServiceApi.GetAudienceSyncApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.audienceSyncId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_sync_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAudienceSyncApprovalStatus", req);
    this.logger.info("get_audience_sync_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberRequest.fromPartial({
      audienceMember: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        identityDocument: { $case: "passport", passport: { expiresAt: req?.context?.deadline } },
      },
      context: req?.context,
      details: { approver: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const invoke1: Unary<audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberApprovalClient.submitAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    return mergeResponses(
      audiencesAudienceSyncApprovalServiceApi.GetAudienceSyncApprovalStatusResponse.fromPartial({
        audienceSync: {
          subject: { audienceMemberId: (reply1?.audienceMember?.audienceMemberId ?? "") },
        },
      }),
      audiencesAudienceSyncApprovalServiceApi.GetAudienceSyncApprovalStatusResponse.fromPartial({ audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") } }),
    );
  }

  /**
   * Lists audience syncs a page at a time.
   */
  async listPendingAudienceSyncs(req: audiencesAudienceSyncApprovalServiceApi.ListPendingAudienceSyncsRequest): Promise<audiencesAudienceSyncApprovalServiceApi.ListPendingAudienceSyncsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingAudienceSyncs", req);
    this.logger.info("list_pending_audience_syncs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceApprovalServiceApi.ApproveAudienceRequest.fromPartial({
      audience: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
      context: req?.context,
    });
    const method1 = "approveAudience" as const;
    const invoke1: Unary<audiencesAudienceApprovalServiceApi.ApproveAudienceRequest, audiencesAudienceApprovalServiceApi.ApproveAudienceResponse> =
      (input, done) => this.audiencesAudienceApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceApprovalServiceApi.ApproveAudienceRequest, audiencesAudienceApprovalServiceApi.ApproveAudienceResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceSyncApprovalServiceApi.ListPendingAudienceSyncsResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } });
  }

  /**
   * Recalls an audience sync.
   */
  async recallAudienceSync(req: audiencesAudienceSyncApprovalServiceApi.RecallAudienceSyncRequest): Promise<audiencesAudienceSyncApprovalServiceApi.RecallAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "RecallAudienceSync", req);
    this.logger.info("recall_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.audienceSync?.measurements ?? []).map(async (item) => {
      const request1 = audiencesAudienceQueryServiceApi.ExportAudiencesRequest.fromPartial({
        context: req?.context,
        filter: { createdAfter: item?.observedAt },
      });
      const stream1 = this.audiencesAudienceQueryClient.exportAudiences(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
      const messages1 = await collect(stream1);
      const reply1 = messages1.at(-1) ?? audiencesAudienceQueryServiceApi.ExportAudiencesResponse.fromPartial({});
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? audiencesAudienceQueryServiceApi.ExportAudiencesResponse.fromPartial({});
    const request2 = audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberRequest.fromPartial({
      audienceMemberId: (req?.audienceSync?.subject?.audienceMemberId ?? ""),
      context: req?.context,
    });
    const proxy2 = forwarding(this.audiencesAudienceMemberQueryClient);
    const invoke2: Unary<audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberRequest, audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberResponse> =
      (input, done) => proxy2.lookupAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberRequest, audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncApprovalServiceApi.RecallAudienceSyncResponse.fromPartial({
        audienceSync: {
          subject: { audienceMemberId: (reply2?.audienceMember?.audienceMemberId ?? "") },
        },
      }),
      audiencesAudienceSyncApprovalServiceApi.RecallAudienceSyncResponse.fromPartial({
        audienceSync: {
          attributes: (req?.audienceSync?.attributes ?? {}),
          audienceSyncId: (req?.audienceSyncId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects an audience sync.
   */
  async rejectAudienceSync(req: audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncRequest): Promise<audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "RejectAudienceSync", req);
    this.logger.info("reject_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleWorkflowServiceApi.PauseArticleWorkflowRequest.fromPartial({
      article: { counterparty: { kind: (req?.audienceSync?.kind ?? "") } },
      context: req?.context,
      details: { notify: { email: (req?.audienceSync?.subject?.email ?? "") } },
    });
    const invoke1: Unary<contentArticleWorkflowServiceApi.PauseArticleWorkflowRequest, contentArticleWorkflowServiceApi.PauseArticleWorkflowResponse> =
      (input, done) => this.contentArticleWorkflowClient.pauseArticleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentArticleWorkflowServiceApi.PauseArticleWorkflowRequest, contentArticleWorkflowServiceApi.PauseArticleWorkflowResponse>(invoke1, request1);
    const request2 = contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceSync?.occurredAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (reply1?.article?.billingAddress?.region ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesRequest, contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesResponse> =
      (input, done) => this.contentTaxonomyApprovalClient.listPendingTaxonomies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesRequest, contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesResponse>(invoke2, spread2);
    const request3 = audiencesAudienceServiceApi.BatchCreateAudiencesRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.audienceSync?.source ?? ""),
        submittedBy: { email: (req?.audienceSync?.subject?.email ?? "") },
      } },
      sequence: (req?.audienceSync?.sequence ?? 0),
    });
    const reply3 = await upload<audiencesAudienceServiceApi.BatchCreateAudiencesRequest, audiencesAudienceServiceApi.BatchCreateAudiencesResponse>(
      (done) => this.audiencesAudienceClient.batchCreateAudiences(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncResponse.fromPartial({
        audienceSync: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          source: (req?.audienceSync?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Submits an audience sync.
   */
  async submitAudienceSync(req: audiencesAudienceSyncApprovalServiceApi.SubmitAudienceSyncRequest): Promise<audiencesAudienceSyncApprovalServiceApi.SubmitAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "SubmitAudienceSync", req);
    this.logger.info("submit_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.audienceSync?.measurements ?? []).map(async (item) => {
      const request1 = audiencesAudienceServiceApi.WatchAudiencesRequest.fromPartial({
        context: req?.context,
        filter: { createdAfter: item?.observedAt },
        subscriber: { email: (req?.audienceSync?.subject?.email ?? "") },
      });
      const stream1 = this.audiencesAudienceClient.watchAudiences(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
      const messages1 = await collect(stream1);
      const reply1 = messages1.at(-1) ?? audiencesAudienceServiceApi.WatchAudiencesResponse.fromPartial({});
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? audiencesAudienceServiceApi.WatchAudiencesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return audiencesAudienceSyncApprovalServiceApi.SubmitAudienceSyncResponse.fromPartial({
      audienceSync: {
        attributes: (req?.audienceSync?.attributes ?? {}),
        audienceSyncId: (req?.audienceSyncId ?? ""),
      },
    });
  }
}
