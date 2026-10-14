/**
 * Runs the long-lived workflow that takes a recommendation from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as communityBadgeApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityForumApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityModerationApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as communityPostWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as contentContentBlockQueryServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_query_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import * as pipelinesPipelineServiceApi from "../../../../.cache/proto/acme/pipelines/v1/pipeline_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
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
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toRecommendationRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate recommendation operations and persist audit data.
 */
@injectable()
export class RecommendationWorkflowWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostWorkflowService") private readonly communityPostWorkflowClient: communityPostWorkflowServiceApi.PostWorkflowServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockQueryService") private readonly contentContentBlockQueryClient: contentContentBlockQueryServiceApi.ContentBlockQueryServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityApprovalService") private readonly personalizationAffinityApprovalClient: personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("grpc:acme.pipelines.v1.PipelineService") private readonly pipelinesPipelineClient: pipelinesPipelineServiceApi.PipelineServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a recommendation.
   */
  async advanceRecommendationWorkflow(req: personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowRequest): Promise<personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "AdvanceRecommendationWorkflow", req);
    this.logger.info("advance_recommendation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.recommendation?.billingAddress?.region ?? "") },
    });
    const invoke1: Unary<notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest, notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.listSubscriptionWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest, notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = communityPostWorkflowServiceApi.StartPostWorkflowRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: { postalCode: (req?.recommendation?.billingAddress?.postalCode ?? "") },
      },
    });
    const invoke2: Unary<communityPostWorkflowServiceApi.StartPostWorkflowRequest, communityPostWorkflowServiceApi.StartPostWorkflowResponse> =
      (input, done) => this.communityPostWorkflowClient.startPostWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<communityPostWorkflowServiceApi.StartPostWorkflowRequest, communityPostWorkflowServiceApi.StartPostWorkflowResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowResponse.fromPartial({
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
        recommendation: { metadata: (reply2?.post?.metadata ?? {}) },
      }),
      personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowResponse.fromPartial({
        recommendation: {
          notes: (req?.recommendation?.notes ?? ""),
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a recommendation.
   */
  async cancelRecommendationWorkflow(req: personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowRequest): Promise<personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "CancelRecommendationWorkflow", req);
    this.logger.info("cancel_recommendation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeApprovalServiceApi.DelegateBadgeApprovalRequest.fromPartial({
      badge: {
        audit: {
          createdBy: (req?.recommendation?.audit?.createdBy ?? ""),
          updatedAt: req?.recommendation?.audit?.updatedAt,
          updatedBy: (req?.recommendation?.audit?.updatedBy ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<communityBadgeApprovalServiceApi.DelegateBadgeApprovalRequest, communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse> =
      (input, done) => this.communityBadgeApprovalClient.delegateBadgeApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("CancelRecommendationWorkflow.DelegateBadgeApproval", () => call<communityBadgeApprovalServiceApi.DelegateBadgeApprovalRequest, communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse>(invoke1, request1));
    const request2 = personalizationAffinityApprovalServiceApi.RejectAffinityRequest.fromPartial({
      affinity: { subject: { number: (req?.recommendation?.number ?? "") } },
      context: req?.context,
      details: {
        approver: {
          email: (req?.recommendation?.counterparty?.email ?? ""),
          userId: (reply1?.badge?.owner?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationAffinityApprovalServiceApi.RejectAffinityRequest, personalizationAffinityApprovalServiceApi.RejectAffinityResponse> =
      (input, done) => this.personalizationAffinityApprovalClient.rejectAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = personalizationProfileReportingServiceApi.FetchProfileReportRequest.fromPartial({
      context: req?.context,
      profileId: (req?.recommendation?.counterparty?.profileId ?? ""),
    });
    const reply3 = await this.workQueue.enqueue<personalizationProfileReportingServiceApi.FetchProfileReportRequest, personalizationProfileReportingServiceApi.FetchProfileReportResponse>(
      "acme.personalization.v1.RecommendationWorkflowService/CancelRecommendationWorkflow:2", request3,
    );
    const request4 = contentContentBlockQueryServiceApi.ExportContentBlocksRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (reply3?.profile?.identityDocument?.$case === "passport" ? reply3?.profile?.identityDocument.passport : undefined)?.expiresAt,
        region: (req?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const stream4 = this.contentContentBlockQueryClient.exportContentBlocks(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const messages4 = await collect(stream4);
    const reply4 = messages4.at(-1) ?? contentContentBlockQueryServiceApi.ExportContentBlocksResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        recommendation: { lines: [{ attributes: (reply2?.affinity?.attributes ?? {}) }] },
      }),
      personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowResponse.fromPartial({
        recommendation: {
          billingAddress: { region: (reply3?.profile?.primaryAddress?.region ?? "") },
        },
      }),
      personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowResponse.fromPartial({
        recommendation: {
          number: (req?.recommendation?.number ?? ""),
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Lists recommendations a page at a time.
   */
  async listRecommendationWorkflows(req: personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest): Promise<personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListRecommendationWorkflows", req);
    this.logger.info("list_recommendation_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a recommendation.
   */
  async pauseRecommendationWorkflow(req: personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowRequest): Promise<personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "PauseRecommendationWorkflow", req);
    this.logger.info("pause_recommendation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.recommendation?.audit?.updatedAt,
        region: (req?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const stream1 = this.notificationsDeliveryAttemptExportClient.streamDeliveryAttemptExport(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportResponse.fromPartial({});
    const request2 = communityBadgeApprovalServiceApi.SubmitBadgeRequest.fromPartial({
      badge: {
        audit: { updatedBy: (req?.recommendation?.audit?.updatedBy ?? "") },
        owner: {
          displayName: (req?.recommendation?.counterparty?.displayName ?? ""),
          email: (req?.recommendation?.counterparty?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse> =
      (input, done) => this.communityBadgeApprovalClient.submitBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse>(invoke2, request2));
    const request3 = communityForumApprovalServiceApi.CommentForumApprovalRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { createdBy: (reply2?.badge?.audit?.createdBy ?? "") },
            location: {
              lines: (req?.recommendation?.billingAddress?.lines ?? []).map((value) => value),
            },
          }],
        }],
      },
    });
    const invoke3: Unary<communityForumApprovalServiceApi.CommentForumApprovalRequest, communityForumApprovalServiceApi.CommentForumApprovalResponse> =
      (input, done) => this.communityForumApprovalClient.commentForumApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<communityForumApprovalServiceApi.CommentForumApprovalResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = personalizationAffinitySyncServiceApi.StreamAffinityChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.context?.deadline,
        source: (req?.context?.actor?.userId ?? ""),
        subject: { recommendationId: (req?.recommendation?.recommendationId ?? "") },
      } },
      context: req?.context,
    });
    const stream4 = this.personalizationAffinitySyncClient.streamAffinityChanges(metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const reading4 = collect(stream4);
    const writing4 = (async () => {
      await write(stream4, request4);
      stream4.end();
    })();
    const [messages4] = await Promise.all([reading4, writing4]);
    const reply4 = messages4.at(-1) ?? personalizationAffinitySyncServiceApi.StreamAffinityChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowResponse.fromPartial({
        recommendation: { billingAddress: { region: (reply3?.forum?.location?.region ?? "") } },
      }),
      personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowResponse.fromPartial({
        recommendation: {
          counterparty: req?.recommendation?.counterparty,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a recommendation.
   */
  async resumeRecommendationWorkflow(req: personalizationRecommendationWorkflowServiceApi.ResumeRecommendationWorkflowRequest): Promise<personalizationRecommendationWorkflowServiceApi.ResumeRecommendationWorkflowResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "ResumeRecommendationWorkflow", req);
    this.logger.info("resume_recommendation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockQueryServiceApi.ExportContentBlocksRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.recommendation?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
        ownerId: (req?.recommendation?.counterparty?.profileId ?? ""),
        region: (req?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const stream1 = this.contentContentBlockQueryClient.exportContentBlocks(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? contentContentBlockQueryServiceApi.ExportContentBlocksResponse.fromPartial({});
    const request2 = personalizationProfileReportingServiceApi.DeleteProfileReportRequest.fromPartial({
      context: req?.context,
      etag: (req?.recommendation?.audit?.etag ?? ""),
      profileId: (req?.recommendation?.counterparty?.profileId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<personalizationProfileReportingServiceApi.DeleteProfileReportRequest, personalizationProfileReportingServiceApi.DeleteProfileReportResponse> =
      (input, done) => this.personalizationProfileReportingClient.deleteProfileReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      personalizationRecommendationWorkflowServiceApi.ResumeRecommendationWorkflowResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      personalizationRecommendationWorkflowServiceApi.ResumeRecommendationWorkflowResponse.fromPartial({
        recommendation: {
          number: (req?.recommendation?.number ?? ""),
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a recommendation.
   */
  async retryRecommendationWorkflow(req: personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowRequest): Promise<personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "RetryRecommendationWorkflow", req);
    this.logger.info("retry_recommendation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumApprovalServiceApi.RejectForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { updatedBy: (req?.recommendation?.audit?.updatedBy ?? "") },
            location: { countryCode: (req?.recommendation?.billingAddress?.countryCode ?? "") },
          }],
          location: { postalCode: (req?.recommendation?.billingAddress?.postalCode ?? "") },
        }],
      },
    });
    const invoke1: Unary<communityForumApprovalServiceApi.RejectForumRequest, communityForumApprovalServiceApi.RejectForumResponse> =
      (input, done) => this.communityForumApprovalClient.rejectForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest.fromPartial({
      affinity: {
        attributes: Object.fromEntries(Object.entries((reply1?.forum?.attributes ?? {}))),
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.recommendation?.counterparty?.email ?? ""),
          name: req?.details?.notify?.name,
        },
      },
    });
    const method2 = "mapAffinityImportColumns" as const;
    const invoke2: Unary<personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest, personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse> =
      (input, done) => this.personalizationAffinityImportClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest, personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        recommendation: { counterparty: { email: (reply1?.forum?.manager?.email ?? "") } },
      }),
      personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowResponse.fromPartial({
        outcome: {
          nextSteps: (reply2?.outcome?.nextSteps ?? []),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowResponse.fromPartial({
        recommendation: {
          issuedAt: req?.recommendation?.issuedAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a recommendation.
   */
  async signalRecommendationWorkflow(req: personalizationRecommendationWorkflowServiceApi.SignalRecommendationWorkflowRequest): Promise<personalizationRecommendationWorkflowServiceApi.SignalRecommendationWorkflowResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "SignalRecommendationWorkflow", req);
    this.logger.info("signal_recommendation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.recommendation?.lines ?? []).map(async (item) => {
      const request1 = pipelinesPipelineServiceApi.SearchPipelinesRequest.fromPartial({
        context: req?.context,
        filter: {
          labels: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
          ownerId: (item?.lineId ?? ""),
          region: (req?.recommendation?.billingAddress?.region ?? ""),
        },
      });
      const invoke1: Unary<pipelinesPipelineServiceApi.SearchPipelinesRequest, pipelinesPipelineServiceApi.SearchPipelinesResponse> =
        (input, done) => this.pipelinesPipelineClient.searchPipelines(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<pipelinesPipelineServiceApi.SearchPipelinesRequest, pipelinesPipelineServiceApi.SearchPipelinesResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: pipelinesPipelineServiceApi.SearchPipelinesResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? pipelinesPipelineServiceApi.SearchPipelinesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return personalizationRecommendationWorkflowServiceApi.SignalRecommendationWorkflowResponse.fromPartial({
      recommendation: {
        issuedAt: req?.recommendation?.issuedAt,
        recommendationId: (req?.recommendationId ?? ""),
      },
    });
  }

  /**
   * Starts a recommendation.
   */
  async startRecommendationWorkflow(req: personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowRequest): Promise<personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "StartRecommendationWorkflow", req);
    this.logger.info("start_recommendation_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountServiceApi.WatchLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.recommendation?.billingAddress?.region ?? "") },
    });
    const stream1 = this.ledgerLedgerAccountClient.watchLedgerAccounts(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? ledgerLedgerAccountServiceApi.WatchLedgerAccountsResponse.fromPartial({});
    const request2 = communityModerationApprovalServiceApi.DelegateModerationApprovalRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: { email: (req?.details?.notify?.email ?? "") },
        audit: {
          etag: (req?.recommendation?.audit?.etag ?? ""),
          updatedAt: req?.recommendation?.audit?.updatedAt,
        },
      },
    });
    const proxy2 = forwarding(this.communityModerationApprovalClient);
    const invoke2: Unary<communityModerationApprovalServiceApi.DelegateModerationApprovalRequest, communityModerationApprovalServiceApi.DelegateModerationApprovalResponse> =
      (input, done) => proxy2.delegateModerationApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationApprovalServiceApi.DelegateModerationApprovalRequest, communityModerationApprovalServiceApi.DelegateModerationApprovalResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (reply2?.moderation?.origin?.$case) {
      case "customer":
        selected3_1 = ((reply2?.moderation?.origin?.$case === "customer" ? reply2?.moderation?.origin.customer : undefined)?.email ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (selected3_1 ?? ""),
          phone: (reply2?.moderation?.requester?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke3: Unary<notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersRequest, notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersResponse> =
      (input, done) => this.notificationsNotificationNotificationClient.notifyNotificationWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersRequest, notificationsNotificationNotificationServiceApi.NotifyNotificationWatchersResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowResponse.fromPartial({
        recommendation: {
          audit: { etag: (reply2?.moderation?.audit?.etag ?? "") },
          counterparty: {
            email: ((reply2?.moderation?.origin?.$case === "customer" ? reply2?.moderation?.origin.customer : undefined)?.email ?? ""),
          },
        },
      }),
      personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowResponse.fromPartial({
        outcome: { effectiveAt: reply3?.outcome?.effectiveAt },
        recommendation: { audit: { updatedBy: (reply3?.notification?.audit?.updatedBy ?? "") } },
      }),
      personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowResponse.fromPartial({
        recommendation: {
          dueAt: req?.recommendation?.dueAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for RecommendationWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class RecommendationWorkflowHandler {
  constructor(@inject(RecommendationWorkflowWorkflow) private readonly workflow: RecommendationWorkflowWorkflow) {}

  /**
   * Advances a recommendation.
   */
  advanceRecommendationWorkflow = unary<personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowResponse>(
    (request) => this.workflow.advanceRecommendationWorkflow(request),
  );

  /**
   * Cancels a recommendation.
   */
  cancelRecommendationWorkflow = unary<personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.CancelRecommendationWorkflowResponse>(
    (request) => this.workflow.cancelRecommendationWorkflow(request),
  );

  /**
   * Lists recommendations a page at a time.
   */
  listRecommendationWorkflows = (call: ServerUnaryCall<personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest, personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsResponse>, done: sendUnaryData<personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsResponse>): void => {
    void this.workflow.listRecommendationWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a recommendation.
   */
  pauseRecommendationWorkflow = unary<personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowResponse>(
    (request) => this.workflow.pauseRecommendationWorkflow(request),
  );

  /**
   * Resumes a recommendation.
   */
  resumeRecommendationWorkflow = unary<personalizationRecommendationWorkflowServiceApi.ResumeRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.ResumeRecommendationWorkflowResponse>(
    (request) => this.workflow.resumeRecommendationWorkflow(request),
  );

  /**
   * Retrys a recommendation.
   */
  retryRecommendationWorkflow = (call: ServerUnaryCall<personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowResponse>, done: sendUnaryData<personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowResponse>): void => {
    void this.workflow.retryRecommendationWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a recommendation.
   */
  signalRecommendationWorkflow = unary<personalizationRecommendationWorkflowServiceApi.SignalRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.SignalRecommendationWorkflowResponse>(
    (request) => this.workflow.signalRecommendationWorkflow(request),
  );

  /**
   * Starts a recommendation.
   */
  startRecommendationWorkflow = unary<personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.StartRecommendationWorkflowResponse>(
    (request) => this.workflow.startRecommendationWorkflow(request),
  );
}

export function implementation(handler: RecommendationWorkflowHandler): personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceServer {
  return {
    advanceRecommendationWorkflow: handler.advanceRecommendationWorkflow,
    cancelRecommendationWorkflow: handler.cancelRecommendationWorkflow,
    listRecommendationWorkflows: handler.listRecommendationWorkflows,
    pauseRecommendationWorkflow: handler.pauseRecommendationWorkflow,
    resumeRecommendationWorkflow: handler.resumeRecommendationWorkflow,
    retryRecommendationWorkflow: handler.retryRecommendationWorkflow,
    signalRecommendationWorkflow: handler.signalRecommendationWorkflow,
    startRecommendationWorkflow: handler.startRecommendationWorkflow,
  };
}
