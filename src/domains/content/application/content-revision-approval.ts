/**
 * Routes content revisions through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as contentArticleApprovalServiceApi from "../../../../.cache/proto/acme/content/v1/article_approval_service.js";
import * as contentArticleWorkflowServiceApi from "../../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as contentContentBlockApprovalServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_approval_service.js";
import * as contentContentBlockQueryServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_query_service.js";
import * as contentContentRevisionApprovalServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_approval_service.js";
import * as contentContentRevisionCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersCustomerValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as experimentsVariantApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as pipelinesPipelineServiceApi from "../../../../.cache/proto/acme/pipelines/v1/pipeline_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toContentRevisionRecord } from "../data/records.js";
import { ContentRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate content revision operations and persist audit data.
 */
@injectable()
export class ContentRevisionApprovalWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.content.v1.ArticleApprovalService") private readonly contentArticleApprovalClient: contentArticleApprovalServiceApi.ArticleApprovalServiceClient,
    @inject("grpc:acme.content.v1.ArticleWorkflowService") private readonly contentArticleWorkflowClient: contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockApprovalService") private readonly contentContentBlockApprovalClient: contentContentBlockApprovalServiceApi.ContentBlockApprovalServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockQueryService") private readonly contentContentBlockQueryClient: contentContentBlockQueryServiceApi.ContentBlockQueryServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionCalculationService") private readonly contentContentRevisionCalculationClient: contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerValidationService") private readonly customersCustomerValidationClient: customersCustomerValidationServiceApi.CustomerValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantApprovalService") private readonly experimentsVariantApprovalClient: experimentsVariantApprovalServiceApi.VariantApprovalServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetSyncService") private readonly mediaMediaAssetSyncClient: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.pipelines.v1.PipelineService") private readonly pipelinesPipelineClient: pipelinesPipelineServiceApi.PipelineServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyApprovalService") private readonly surveysSurveyApprovalClient: surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a content revision.
   */
  async approveContentRevision(req: contentContentRevisionApprovalServiceApi.ApproveContentRevisionRequest): Promise<contentContentRevisionApprovalServiceApi.ApproveContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "ApproveContentRevision", req);
    this.logger.info("approve_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
      preference: {
        owner: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          email: (req?.contentRevision?.subject?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
    });
    const cloned1: customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest, customersPreferenceValidationServiceApi.ExplainPreferenceDecisionResponse> =
      (input, done) => this.customersPreferenceValidationClient.explainPreferenceDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest, customersPreferenceValidationServiceApi.ExplainPreferenceDecisionResponse>(invoke1, cloned1);
    const request2 = notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: {
          createdAt: reply1?.preference?.audit?.createdAt,
          createdBy: (reply1?.preference?.audit?.createdBy ?? ""),
        },
      },
    });
    const decoded2 = notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest.toJSON(request2))),
    );
    const invoke2: Unary<notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient.recallSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionApprovalServiceApi.RecallSubscriptionRequest, notificationsSubscriptionApprovalServiceApi.RecallSubscriptionResponse>(invoke2, decoded2);
    const settled3 = await Promise.allSettled((req?.contentRevision?.measurements ?? []).map(async (item) => {
      const request3 = surveysSurveyApprovalServiceApi.DelegateSurveyApprovalRequest.fromPartial({
        context: req?.context,
        survey: {
          audit: {
            createdAt: item?.observedAt,
            updatedAt: reply1?.preference?.audit?.updatedAt,
          },
          counterparty: { displayName: (req?.contentRevision?.subject?.displayName ?? "") },
          lines: [{
            tax: {
              amount: (reply2?.subscription?.action?.$case === "discount" ? reply2?.subscription?.action.discount : undefined)?.amount,
            },
          }],
        },
      });
      const invoke3: Unary<surveysSurveyApprovalServiceApi.DelegateSurveyApprovalRequest, surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse> =
        (input, done) => this.surveysSurveyApprovalClient.delegateSurveyApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<surveysSurveyApprovalServiceApi.DelegateSurveyApprovalRequest, surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? surveysSurveyApprovalServiceApi.DelegateSurveyApprovalResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionApprovalServiceApi.ApproveContentRevisionResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      contentContentRevisionApprovalServiceApi.ApproveContentRevisionResponse.fromPartial({ outcome: { effectiveAt: reply2?.outcome?.effectiveAt } }),
      contentContentRevisionApprovalServiceApi.ApproveContentRevisionResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          sequence: (req?.contentRevision?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Comments a content revision.
   */
  async commentContentRevisionApproval(req: contentContentRevisionApprovalServiceApi.CommentContentRevisionApprovalRequest): Promise<contentContentRevisionApprovalServiceApi.CommentContentRevisionApprovalResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "CommentContentRevisionApproval", req);
    this.logger.info("comment_content_revision_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest.fromPartial({
      article: {
        counterparty: {
          displayName: (req?.contentRevision?.subject?.displayName ?? ""),
          kind: (req?.contentRevision?.kind ?? ""),
        },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.contentRevision?.attributes ?? {}))),
        }],
      },
      context: req?.context,
      details: { notify: { email: (req?.contentRevision?.subject?.email ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.content.v1.RetryArticleWorkflowRequest",
      value: Buffer.from(contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest.encode(request1).finish()),
    });
    const unpacked1 = contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest.decode(envelope1.value);
    const invoke1: Unary<contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest, contentArticleWorkflowServiceApi.RetryArticleWorkflowResponse> =
      (input, done) => this.contentArticleWorkflowClient.retryArticleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest, contentArticleWorkflowServiceApi.RetryArticleWorkflowResponse>(invoke1, unpacked1);
    const request2 = customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
    });
    const client2 = this.clients.get<customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient>("acme.customers.v1.CustomerSegmentCalculationService");
    const invoke2: Unary<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse> =
      (input, done) => client2.explainCustomerSegmentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionApprovalServiceApi.CommentContentRevisionApprovalResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      contentContentRevisionApprovalServiceApi.CommentContentRevisionApprovalResponse.fromPartial({
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      contentContentRevisionApprovalServiceApi.CommentContentRevisionApprovalResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          source: (req?.contentRevision?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a content revision.
   */
  async delegateContentRevisionApproval(req: contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalRequest): Promise<contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "DelegateContentRevisionApproval", req);
    this.logger.info("delegate_content_revision_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = pipelinesPipelineServiceApi.SearchPipelinesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const invoke1: Unary<pipelinesPipelineServiceApi.SearchPipelinesRequest, pipelinesPipelineServiceApi.SearchPipelinesResponse> =
      (input, done) => this.pipelinesPipelineClient.searchPipelines(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<pipelinesPipelineServiceApi.SearchPipelinesRequest, pipelinesPipelineServiceApi.SearchPipelinesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = communityForumWorkflowServiceApi.PauseForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            manager: {
              displayName: (req?.contentRevision?.subject?.displayName ?? ""),
              email: (req?.contentRevision?.subject?.email ?? ""),
            },
          }],
        }],
        manager: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const invoke2: Unary<communityForumWorkflowServiceApi.PauseForumWorkflowRequest, communityForumWorkflowServiceApi.PauseForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.pauseForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<communityForumWorkflowServiceApi.PauseForumWorkflowRequest, communityForumWorkflowServiceApi.PauseForumWorkflowResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      contentContentRevisionApprovalServiceApi.DelegateContentRevisionApprovalResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          correlationId: (req?.contentRevision?.correlationId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a content revision.
   */
  async escalateContentRevision(req: contentContentRevisionApprovalServiceApi.EscalateContentRevisionRequest): Promise<contentContentRevisionApprovalServiceApi.EscalateContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "EscalateContentRevision", req);
    this.logger.info("escalate_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockQueryServiceApi.CountContentBlocksRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.contentRevision?.attributes ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
      },
    });
    const invoke1: Unary<contentContentBlockQueryServiceApi.CountContentBlocksRequest, contentContentBlockQueryServiceApi.CountContentBlocksResponse> =
      (input, done) => this.contentContentBlockQueryClient.countContentBlocks(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("EscalateContentRevision.CountContentBlocks", () => call<contentContentBlockQueryServiceApi.CountContentBlocksRequest, contentContentBlockQueryServiceApi.CountContentBlocksResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionApprovalServiceApi.EscalateContentRevisionResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      contentContentRevisionApprovalServiceApi.EscalateContentRevisionResponse.fromPartial({
        contentRevision: {
          attributes: (req?.contentRevision?.attributes ?? {}),
          contentRevisionId: (req?.contentRevisionId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a content revision.
   */
  async getContentRevisionApprovalStatus(req: contentContentRevisionApprovalServiceApi.GetContentRevisionApprovalStatusRequest): Promise<contentContentRevisionApprovalServiceApi.GetContentRevisionApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.contentRevisionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "content_revision_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetContentRevisionApprovalStatus", req);
    this.logger.info("get_content_revision_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantApprovalServiceApi.ListPendingVariantsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.contentRevisionId ?? "") },
    });
    const invoke1: Unary<experimentsVariantApprovalServiceApi.ListPendingVariantsRequest, experimentsVariantApprovalServiceApi.ListPendingVariantsResponse> =
      (input, done) => this.experimentsVariantApprovalClient.listPendingVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return mergeResponses(
      contentContentRevisionApprovalServiceApi.GetContentRevisionApprovalStatusResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      contentContentRevisionApprovalServiceApi.GetContentRevisionApprovalStatusResponse.fromPartial({
        contentRevision: { contentRevisionId: (req?.contentRevisionId ?? "") },
      }),
    );
  }

  /**
   * Lists content revisions a page at a time.
   */
  async listPendingContentRevisions(req: contentContentRevisionApprovalServiceApi.ListPendingContentRevisionsRequest): Promise<contentContentRevisionApprovalServiceApi.ListPendingContentRevisionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingContentRevisions", req);
    this.logger.info("list_pending_content_revisions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetSyncServiceApi.PushMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<mediaMediaAssetSyncServiceApi.PushMediaAssetRequest, mediaMediaAssetSyncServiceApi.PushMediaAssetResponse>(
      "acme.content.v1.ContentRevisionApprovalService/ListPendingContentRevisions:0", request1,
    );
    let selected2_3: string | undefined;
    switch (reply1?.mediaAsset?.locator?.$case) {
      case "address":
        selected2_3 = ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: {
          createdAt: reply1?.mediaAsset?.audit?.createdAt,
          createdBy: (reply1?.mediaAsset?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.mediaAsset?.audit?.updatedBy ?? ""),
        },
      },
      details: { destination: { recipient: (selected2_3 ?? "") } },
    });
    const invoke2: Unary<customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest, customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.recalculateCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest, customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      contentContentRevisionApprovalServiceApi.ListPendingContentRevisionsResponse.fromPartial({
        contentRevisions: [{ correlationId: (reply1?.result?.correlationId ?? "") }],
      }),
      contentContentRevisionApprovalServiceApi.ListPendingContentRevisionsResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
    );
  }

  /**
   * Recalls a content revision.
   */
  async recallContentRevision(req: contentContentRevisionApprovalServiceApi.RecallContentRevisionRequest): Promise<contentContentRevisionApprovalServiceApi.RecallContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "RecallContentRevision", req);
    this.logger.info("recall_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationValidationServiceApi.NormalizeNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { displayName: (req?.details?.approver?.displayName ?? "") },
        origin: { $case: "customer", customer: { displayName: (req?.contentRevision?.subject?.displayName ?? "") } },
      },
    });
    const invoke1: Unary<notificationsNotificationValidationServiceApi.NormalizeNotificationRequest, notificationsNotificationValidationServiceApi.NormalizeNotificationResponse> =
      (input, done) => this.notificationsNotificationValidationClient.normalizeNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsNotificationValidationServiceApi.NormalizeNotificationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = customersCustomerValidationServiceApi.LintCustomersRequest.fromPartial({
      context: req?.context,
      customer: {
        relationshipManager: { displayName: (req?.contentRevision?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse> =
      (input, done) => this.customersCustomerValidationClient.lintCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionApprovalServiceApi.RecallContentRevisionResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      contentContentRevisionApprovalServiceApi.RecallContentRevisionResponse.fromPartial({
        contentRevision: {
          subject: { email: (reply2?.customer?.relationshipManager?.email ?? "") },
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      contentContentRevisionApprovalServiceApi.RecallContentRevisionResponse.fromPartial({
        contentRevision: { contentRevisionId: (req?.contentRevisionId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Rejects a content revision.
   */
  async rejectContentRevision(req: contentContentRevisionApprovalServiceApi.RejectContentRevisionRequest): Promise<contentContentRevisionApprovalServiceApi.RejectContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "RejectContentRevision", req);
    this.logger.info("reject_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerValidationServiceApi.GetCustomerRulesRequest.fromPartial({
      context: req?.context,
      customerId: (req?.contentRevision?.subject?.customerId ?? ""),
    });
    const invoke1: Unary<customersCustomerValidationServiceApi.GetCustomerRulesRequest, customersCustomerValidationServiceApi.GetCustomerRulesResponse> =
      (input, done) => this.customersCustomerValidationClient.getCustomerRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { region: (reply1?.customer?.primaryAddress?.region ?? "") },
      },
    });
    const method2 = "recalculateConsentRecords" as const;
    const invoke2: Unary<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse> =
      (input, done) => this.customersConsentRecordCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse>(invoke2, request2);
    const request3 = contentArticleApprovalServiceApi.DelegateArticleApprovalRequest.fromPartial({
      article: {
        audit: { updatedAt: reply1?.customer?.audit?.updatedAt },
        counterparty: {
          displayName: (reply1?.customer?.relationshipManager?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const proxy3 = forwarding(this.contentArticleApprovalClient);
    const invoke3: Unary<contentArticleApprovalServiceApi.DelegateArticleApprovalRequest, contentArticleApprovalServiceApi.DelegateArticleApprovalResponse> =
      (input, done) => proxy3.delegateArticleApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<contentArticleApprovalServiceApi.DelegateArticleApprovalRequest, contentArticleApprovalServiceApi.DelegateArticleApprovalResponse>(invoke3, request3);
    const request4 = notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      subscription: {
        owner: { userId: (reply1?.customer?.relationshipManager?.userId ?? "") },
      },
    });
    const invoke4: Unary<notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.cancelSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.CancelSubscriptionWorkflowResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionApprovalServiceApi.RejectContentRevisionResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      contentContentRevisionApprovalServiceApi.RejectContentRevisionResponse.fromPartial({
        contentRevision: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      contentContentRevisionApprovalServiceApi.RejectContentRevisionResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (reply3?.article?.counterparty?.contentRevisionId ?? ""),
          correlationId: (reply3?.result?.correlationId ?? ""),
        },
      }),
      contentContentRevisionApprovalServiceApi.RejectContentRevisionResponse.fromPartial({
        contentRevision: {
          subject: { displayName: (reply4?.subscription?.owner?.displayName ?? "") },
        },
        outcome: { effectiveAt: reply4?.outcome?.effectiveAt },
      }),
      contentContentRevisionApprovalServiceApi.RejectContentRevisionResponse.fromPartial({
        contentRevision: { source: (req?.contentRevision?.source ?? "") },
        result: { correlationId: (req?.contentRevision?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Submits a content revision.
   */
  async submitContentRevision(req: contentContentRevisionApprovalServiceApi.SubmitContentRevisionRequest): Promise<contentContentRevisionApprovalServiceApi.SubmitContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "SubmitContentRevision", req);
    this.logger.info("submit_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationRequest.fromPartial({
      contentRevision: {
        subject: {
          customerId: (req?.contentRevision?.subject?.customerId ?? ""),
          displayName: (req?.contentRevision?.subject?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationRequest, contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.explainContentRevisionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationRequest, contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = contentContentBlockApprovalServiceApi.RejectContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            children: [{
              attributes: Object.fromEntries(Object.entries((input2?.contentRevision?.attributes ?? {}))),
            }],
            manager: { email: (input2?.details?.approver?.email ?? "") },
          }],
          manager: { email: (reply1?.contentRevision?.subject?.email ?? "") },
        }],
      },
      context: input2?.context,
    });
    const invoke2: Unary<contentContentBlockApprovalServiceApi.RejectContentBlockRequest, contentContentBlockApprovalServiceApi.RejectContentBlockResponse> =
      (input, done) => this.contentContentBlockApprovalClient.rejectContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentContentBlockApprovalServiceApi.RejectContentBlockRequest, contentContentBlockApprovalServiceApi.RejectContentBlockResponse>(invoke2, request2);
    const tasks3: Array<() => Promise<customersHouseholdQueryServiceApi.FindHouseholdsResponse>> = [];
    for (const item of (req?.contentRevision?.measurements ?? [])) {
      tasks3.push(async () => {
        const request3 = customersHouseholdQueryServiceApi.FindHouseholdsRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: item?.observedAt,
            ownerId: (reply1?.contentRevision?.subject?.customerId ?? ""),
            region: (reply2?.contentBlock?.location?.region ?? ""),
          },
        });
        const invoke3: Unary<customersHouseholdQueryServiceApi.FindHouseholdsRequest, customersHouseholdQueryServiceApi.FindHouseholdsResponse> =
          (input, done) => this.customersHouseholdQueryClient.findHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply3 = await call<customersHouseholdQueryServiceApi.FindHouseholdsRequest, customersHouseholdQueryServiceApi.FindHouseholdsResponse>(invoke3, request3);
        return reply3;
      });
    }
    const results3 = await Promise.all(tasks3.map((task) => task()));
    const reply3 = results3.at(-1) ?? customersHouseholdQueryServiceApi.FindHouseholdsResponse.fromPartial({});
    const request4 = notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        kind: (req?.contentRevision?.kind ?? ""),
        subject: { displayName: (reply1?.contentRevision?.subject?.displayName ?? "") },
      },
      details: { notify: { email: (reply2?.contentBlock?.manager?.email ?? "") } },
    });
    const cloned4: notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.retryDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionApprovalServiceApi.SubmitContentRevisionResponse.fromPartial({
        result: {
          correlationId: (reply1?.contentRevision?.correlationId ?? ""),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      contentContentRevisionApprovalServiceApi.SubmitContentRevisionResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      contentContentRevisionApprovalServiceApi.SubmitContentRevisionResponse.fromPartial({ outcome: { referenceId: (reply4?.outcome?.referenceId ?? "") } }),
      contentContentRevisionApprovalServiceApi.SubmitContentRevisionResponse.fromPartial({
        contentRevision: {
          attributes: (req?.contentRevision?.attributes ?? {}),
          contentRevisionId: (req?.contentRevisionId ?? ""),
        },
      }),
    );
  }
}
