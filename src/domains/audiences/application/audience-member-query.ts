/**
 * Answers read-only questions about audience members, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as audiencesAudienceMemberQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_query_service.js";
import * as audiencesAudienceMemberValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as audiencesAudienceQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as communityModerationValidationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as contentArticleServiceApi from "../../../../.cache/proto/acme/content/v1/article_service.js";
import * as documentsDocumentQueryServiceApi from "../../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as formsFormCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
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
import { AudiencesRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience member operations and persist audit data.
 */
@injectable()
export class AudienceMemberQueryWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberValidationService") private readonly audiencesAudienceMemberValidationClient: audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceQueryService") private readonly audiencesAudienceQueryClient: audiencesAudienceQueryServiceApi.AudienceQueryServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncCalculationService") private readonly audiencesAudienceSyncCalculationClient: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceValidationService") private readonly audiencesAudienceValidationClient: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.content.v1.ArticleService") private readonly contentArticleClient: contentArticleServiceApi.ArticleServiceClient,
    @inject("grpc:acme.documents.v1.DocumentQueryService") private readonly documentsDocumentQueryClient: documentsDocumentQueryServiceApi.DocumentQueryServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists audience members a page at a time.
   */
  async browseAudienceMembers(req: audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersRequest): Promise<audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseAudienceMembers", req);
    this.logger.info("browse_audience_members", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersResponse.fromPartial({});
  }

  /**
   * Counts audience members by status.
   */
  async countAudienceMembers(req: audiencesAudienceMemberQueryServiceApi.CountAudienceMembersRequest): Promise<audiencesAudienceMemberQueryServiceApi.CountAudienceMembersResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountAudienceMembers", req);
    this.logger.info("count_audience_members", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentQueryServiceApi.CountDocumentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
      page: {
        pageSize: (req?.page?.pageSize ?? 0),
        pageToken: (req?.page?.pageToken ?? ""),
      },
    });
    const invoke1: Unary<documentsDocumentQueryServiceApi.CountDocumentsRequest, documentsDocumentQueryServiceApi.CountDocumentsResponse> =
      (input, done) => this.documentsDocumentQueryClient.countDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<documentsDocumentQueryServiceApi.CountDocumentsRequest, documentsDocumentQueryServiceApi.CountDocumentsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = audiencesAudienceQueryServiceApi.ExportAudiencesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
    });
    const stream2 = this.audiencesAudienceQueryClient.exportAudiences(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? audiencesAudienceQueryServiceApi.ExportAudiencesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceMemberQueryServiceApi.CountAudienceMembersResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } });
  }

  /**
   * Streams every matching audience member.
   */
  async exportAudienceMembers(req: audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersRequest): Promise<audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportAudienceMembers", req);
    this.logger.info("export_audience_members", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.advanceDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse>(invoke1, request1));
    const request2 = featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.batchGetFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ExportAudienceMembers.BatchGetFeatureFlags", () => call<featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsResponse>(invoke2, request2));
    const request3 = formsFormCalculationServiceApi.EstimateFormRequest.fromPartial({
      context: req?.context,
      form: {
        counterparty: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((reply1?.deliveryAttempt?.attributes ?? {}))),
        }],
        number: (reply1?.deliveryAttempt?.subject?.number ?? ""),
      },
    });
    const invoke3: Unary<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse> =
      (input, done) => this.formsFormCalculationClient.estimateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = communityModerationValidationServiceApi.ScoreModerationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { postalCode: (reply3?.form?.billingAddress?.postalCode ?? "") },
      },
      moderation: {
        origin: { $case: "customer", customer: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") } },
      },
    });
    const reply4 = await this.workQueue.enqueue<communityModerationValidationServiceApi.ScoreModerationRequest, communityModerationValidationServiceApi.ScoreModerationResponse>(
      "acme.audiences.v1.AudienceMemberQueryService/ExportAudienceMembers:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse.fromPartial({
        audienceMember: {
          relationshipManager: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
        },
      }),
      audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse.fromPartial({
        audienceMember: {
          primaryAddress: { lines: (reply3?.form?.billingAddress?.lines ?? []) },
        },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse.fromPartial({
        audienceMember: {
          contact: {
            preferredChannel: (reply4?.moderation?.requester?.preferredChannel ?? ""),
          },
          relationshipManager: {
            displayName: ((reply4?.moderation?.origin?.$case === "customer" ? reply4?.moderation?.origin.customer : undefined)?.displayName ?? ""),
          },
        },
      }),
      audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse.fromPartial({
        audienceMember: { primaryAddress: { region: (req?.filter?.region ?? "") } },
      }),
    );
  }

  /**
   * Lists audience members a page at a time.
   */
  async findAudienceMembers(req: audiencesAudienceMemberQueryServiceApi.FindAudienceMembersRequest): Promise<audiencesAudienceMemberQueryServiceApi.FindAudienceMembersResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindAudienceMembers", req);
    this.logger.info("find_audience_members", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleServiceApi.SearchArticlesRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.filter?.ownerId ?? "") },
    });
    const invoke1: Unary<contentArticleServiceApi.SearchArticlesRequest, contentArticleServiceApi.SearchArticlesResponse> =
      (input, done) => this.contentArticleClient.searchArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<contentArticleServiceApi.SearchArticlesRequest, contentArticleServiceApi.SearchArticlesResponse>(invoke1, request1));
    const request2 = notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      subscription: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const invoke2: Unary<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.pauseSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<notificationsSubscriptionWorkflowServiceApi.PauseSubscriptionWorkflowResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      audiencesAudienceMemberQueryServiceApi.FindAudienceMembersResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      audiencesAudienceMemberQueryServiceApi.FindAudienceMembersResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
    );
  }

  /**
   * Returns an audience member.
   */
  async lookupAudienceMember(req: audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberRequest): Promise<audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberResponse> {
    validateContext(req.context);
    if (!req.audienceMemberId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_member_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupAudienceMember", req);
    this.logger.info("lookup_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.QuoteFormRequest.fromPartial({
      context: req?.context,
      form: { counterparty: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse> =
      (input, done) => this.formsFormCalculationClient.quoteForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = identityUserQueryServiceApi.BrowseUsersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.form?.audit?.createdAt,
        ownerId: (reply1?.result?.correlationId ?? ""),
        region: (reply1?.form?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<identityUserQueryServiceApi.BrowseUsersRequest, identityUserQueryServiceApi.BrowseUsersResponse> =
      (input, done) => this.identityUserQueryClient.browseUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    return mergeResponses(
      audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberResponse.fromPartial({
        audienceMember: { audit: { createdBy: (reply1?.form?.audit?.createdBy ?? "") } },
      }),
      audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberResponse.fromPartial({ audienceMember: { audienceMemberId: (req?.audienceMemberId ?? "") } }),
    );
  }

  /**
   * Returns an audience member.
   */
  async peekAudienceMember(req: audiencesAudienceMemberQueryServiceApi.PeekAudienceMemberRequest): Promise<audiencesAudienceMemberQueryServiceApi.PeekAudienceMemberResponse> {
    validateContext(req.context);
    if (!req.audienceMemberId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_member_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekAudienceMember", req);
    this.logger.info("peek_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceQueryServiceApi.ExportAudiencesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.audienceMemberId ?? ""),
      },
    });
    const stream1 = this.audiencesAudienceQueryClient.exportAudiences(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? audiencesAudienceQueryServiceApi.ExportAudiencesResponse.fromPartial({});
    const request2 = audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest.fromPartial({
      audienceMember: { relationshipManager: { userId: (req?.context?.actor?.userId ?? "") } },
      audienceMemberId: (req?.audienceMemberId ?? ""),
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const method2 = "lintAudienceMembers" as const;
    const invoke2: Unary<audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest, audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest, audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse>(invoke2, request2);
    return mergeResponses(
      audiencesAudienceMemberQueryServiceApi.PeekAudienceMemberResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      audiencesAudienceMemberQueryServiceApi.PeekAudienceMemberResponse.fromPartial({ audienceMember: { audienceMemberId: (req?.audienceMemberId ?? "") } }),
    );
  }

  /**
   * Returns several audience members at once.
   */
  async resolveAudienceMembers(req: audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest): Promise<audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveAudienceMembers", req);
    this.logger.info("resolve_audience_members", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationRequest.fromPartial({
      audienceSync: { subject: { email: (req?.context?.actor?.email ?? "") } },
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
    });
    const proxy1 = forwarding(this.audiencesAudienceSyncCalculationClient);
    const invoke1: Unary<audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationRequest, audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationResponse> =
      (input, done) => proxy1.explainAudienceSyncCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationRequest, audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationResponse>(invoke1, request1);
    const request2 = audiencesAudienceValidationServiceApi.PreviewAudienceRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.audienceSync?.subject?.email ?? "") } },
    });
    const invoke2: Unary<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.previewAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse>(invoke2, request2);
    return mergeResponses(
      audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse.fromPartial({
        audienceMembers: [{
          relationshipManager: { displayName: (reply2?.audience?.owner?.displayName ?? "") },
        }],
        result: { message: (reply2?.result?.message ?? "") },
      }),
    );
  }

  /**
   * Lists audience members a page at a time.
   */
  async suggestAudienceMembers(req: audiencesAudienceMemberQueryServiceApi.SuggestAudienceMembersRequest): Promise<audiencesAudienceMemberQueryServiceApi.SuggestAudienceMembersResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestAudienceMembers", req);
    this.logger.info("suggest_audience_members", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceMemberQueryServiceApi.SuggestAudienceMembersResponse.fromPartial({});
  }

  /**
   * Summarizes an audience member.
   */
  async summarizeAudienceMembers(req: audiencesAudienceMemberQueryServiceApi.SummarizeAudienceMembersRequest): Promise<audiencesAudienceMemberQueryServiceApi.SummarizeAudienceMembersResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeAudienceMembers", req);
    this.logger.info("summarize_audience_members", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest.fromPartial({
      context: req?.context,
      details: {
        cron: (req?.details?.cron ?? ""),
        recipientEmails: (req?.details?.recipientEmails ?? []).map((value) => value),
      },
      reason: (req?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.summarizeFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input2?.annotations ?? {}))),
      context: input2?.context,
    });
    const invoke2: Unary<localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest, localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.compareTranslationJobOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest, localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.format ?? "") });
    return mergeResponses(
      audiencesAudienceMemberQueryServiceApi.SummarizeAudienceMembersResponse.fromPartial({ summary: (reply1?.summary ?? {}) }),
      audiencesAudienceMemberQueryServiceApi.SummarizeAudienceMembersResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      audiencesAudienceMemberQueryServiceApi.SummarizeAudienceMembersResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
