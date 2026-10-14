/**
 * Runs the long-lived workflow that takes a post from start to finish. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceSyncCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as authorizationAccessPolicyServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as boxofficeBoxOfficeSaleQueryServiceApi from "../../../../.cache/proto/acme/boxoffice/v1/box_office_sale_query_service.js";
import * as budgetingBudgetServiceApi from "../../../../.cache/proto/acme/budgeting/v1/budget_service.js";
import * as chatChatRoomQueryServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as communityPostWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as formsFormFieldValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as mediaMediaAssetServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
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
} from "../../../platform/rpc.js";
import { collect, upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toPostRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate post operations and persist audit data.
 */
@injectable()
export class PostWorkflowWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceSyncCalculationService") private readonly audiencesAudienceSyncCalculationClient: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.boxoffice.v1.BoxOfficeSaleQueryService") private readonly boxofficeBoxOfficeSaleQueryClient: boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient,
    @inject("grpc:acme.budgeting.v1.BudgetService") private readonly budgetingBudgetClient: budgetingBudgetServiceApi.BudgetServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomQueryService") private readonly chatChatRoomQueryClient: chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldValidationService") private readonly formsFormFieldValidationClient: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryQueryService") private readonly webhooksWebhookDeliveryQueryClient: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a post.
   */
  async advancePostWorkflow(req: communityPostWorkflowServiceApi.AdvancePostWorkflowRequest): Promise<communityPostWorkflowServiceApi.AdvancePostWorkflowResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "AdvancePostWorkflow", req);
    this.logger.info("advance_post_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomQueryServiceApi.FindChatRoomsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.post?.billingAddress?.region ?? "") },
    });
    const client1 = this.clients.get<chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient>("acme.chat.v1.ChatRoomQueryService");
    const invoke1: Unary<chatChatRoomQueryServiceApi.FindChatRoomsRequest, chatChatRoomQueryServiceApi.FindChatRoomsResponse> =
      (input, done) => client1.findChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomQueryServiceApi.FindChatRoomsRequest, chatChatRoomQueryServiceApi.FindChatRoomsResponse>(invoke1, request1);
    const request2 = personalizationRecommendationQueryServiceApi.ResolveRecommendationsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<personalizationRecommendationQueryServiceApi.ResolveRecommendationsRequest, personalizationRecommendationQueryServiceApi.ResolveRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationQueryClient.resolveRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<personalizationRecommendationQueryServiceApi.ResolveRecommendationsRequest, personalizationRecommendationQueryServiceApi.ResolveRecommendationsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.post?.billingAddress?.region ?? "") },
    });
    const invoke3: Unary<boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest, boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesResponse> =
      (input, done) => this.boxofficeBoxOfficeSaleQueryClient.suggestBoxOfficeSales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest, boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesResponse>(invoke3, request3));
    let selected4_2: string | undefined;
    switch (req?.post?.settlement?.$case) {
      case "bank":
        selected4_2 = ((req?.post?.settlement?.$case === "bank" ? req?.post?.settlement.bank : undefined)?.accountHolder ?? "");
        break;
      default:
        selected4_2 = "";
    }
    const request4 = communityPostApprovalServiceApi.RecallPostRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.notify?.email ?? "") } },
      post: {
        settlement: { $case: "bank", bank: { accountHolder: (selected4_2 ?? "") } },
        billingAddress: { postalCode: (req?.post?.billingAddress?.postalCode ?? "") },
        counterparty: { email: (req?.post?.counterparty?.email ?? "") },
      },
    });
    const invoke4: Unary<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse> =
      (input, done) => this.communityPostApprovalClient.recallPost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostWorkflowServiceApi.AdvancePostWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      communityPostWorkflowServiceApi.AdvancePostWorkflowResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      communityPostWorkflowServiceApi.AdvancePostWorkflowResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      communityPostWorkflowServiceApi.AdvancePostWorkflowResponse.fromPartial({
        post: { audit: { createdBy: (reply4?.post?.audit?.createdBy ?? "") } },
      }),
      communityPostWorkflowServiceApi.AdvancePostWorkflowResponse.fromPartial({
        post: {
          number: (req?.post?.number ?? ""),
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a post.
   */
  async cancelPostWorkflow(req: communityPostWorkflowServiceApi.CancelPostWorkflowRequest): Promise<communityPostWorkflowServiceApi.CancelPostWorkflowResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "CancelPostWorkflow", req);
    this.logger.info("cancel_post_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.post?.lines ?? []).map(async (item) => {
      const request1 = authorizationAccessPolicyServiceApi.UpdateAccessPolicyRequest.fromPartial({
        accessPolicy: {
          action: { $case: "discount", discount: { amount: item?.tax?.amount } },
        },
        context: req?.context,
      });
      const invoke1: Unary<authorizationAccessPolicyServiceApi.UpdateAccessPolicyRequest, authorizationAccessPolicyServiceApi.UpdateAccessPolicyResponse> =
        (input, done) => this.authorizationAccessPolicyClient.updateAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<authorizationAccessPolicyServiceApi.UpdateAccessPolicyRequest, authorizationAccessPolicyServiceApi.UpdateAccessPolicyResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? authorizationAccessPolicyServiceApi.UpdateAccessPolicyResponse.fromPartial({});
    const request2 = boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.accessPolicy?.audit?.createdAt,
        ownerId: (reply1?.accessPolicy?.owner?.userId ?? ""),
        region: (req?.post?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest, boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesResponse> =
      (input, done) => this.boxofficeBoxOfficeSaleQueryClient.suggestBoxOfficeSales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = communityPostValidationServiceApi.ValidatePostRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.notify?.name } },
      post: {
        billingAddress: { countryCode: (req?.post?.billingAddress?.countryCode ?? "") },
        counterparty: { email: (reply1?.accessPolicy?.owner?.email ?? "") },
      },
    });
    const reply3 = await this.workQueue.enqueue<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse>(
      "acme.community.v1.PostWorkflowService/CancelPostWorkflow:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostWorkflowServiceApi.CancelPostWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      communityPostWorkflowServiceApi.CancelPostWorkflowResponse.fromPartial({
        post: {
          billingAddress: { countryCode: (reply3?.post?.billingAddress?.countryCode ?? "") },
        },
        result: { status: (reply3?.outcome?.status ?? "") },
      }),
      communityPostWorkflowServiceApi.CancelPostWorkflowResponse.fromPartial({
        post: {
          dueAt: req?.post?.dueAt,
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a post.
   */
  async inspectPostWorkflow(req: communityPostWorkflowServiceApi.InspectPostWorkflowRequest): Promise<communityPostWorkflowServiceApi.InspectPostWorkflowResponse> {
    validateContext(req.context);
    if (!req.postId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "post_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectPostWorkflow", req);
    this.logger.info("inspect_post_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldValidationServiceApi.LintFormFieldsRequest.fromPartial({
      context: req?.context,
      formField: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse> =
      (input, done) => this.formsFormFieldValidationClient.lintFormFields(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse>(invoke1, request1));
    const request2 = personalizationRecommendationQueryServiceApi.ResolveRecommendationsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<personalizationRecommendationQueryServiceApi.ResolveRecommendationsRequest, personalizationRecommendationQueryServiceApi.ResolveRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationQueryClient.resolveRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<personalizationRecommendationQueryServiceApi.ResolveRecommendationsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = mediaMediaAssetServiceApi.BatchCreateMediaAssetsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply3 = await upload<mediaMediaAssetServiceApi.BatchCreateMediaAssetsRequest, mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse>(
      (done) => this.mediaMediaAssetClient.batchCreateMediaAssets(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    return mergeResponses(
      communityPostWorkflowServiceApi.InspectPostWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      communityPostWorkflowServiceApi.InspectPostWorkflowResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      communityPostWorkflowServiceApi.InspectPostWorkflowResponse.fromPartial({ post: { postId: (req?.postId ?? "") } }),
    );
  }

  /**
   * Lists posts a page at a time.
   */
  async listPostWorkflows(req: communityPostWorkflowServiceApi.ListPostWorkflowsRequest): Promise<communityPostWorkflowServiceApi.ListPostWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPostWorkflows", req);
    this.logger.info("list_post_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateQueryServiceApi.ExportNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        query: (req?.filter?.query ?? ""),
      },
    });
    const stream1 = this.notificationsNotificationTemplateQueryClient.exportNotificationTemplates(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationTemplateQueryServiceApi.ExportNotificationTemplatesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityPostWorkflowServiceApi.ListPostWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a post.
   */
  async pausePostWorkflow(req: communityPostWorkflowServiceApi.PausePostWorkflowRequest): Promise<communityPostWorkflowServiceApi.PausePostWorkflowResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "PausePostWorkflow", req);
    this.logger.info("pause_post_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleValidationServiceApi.ValidateLocaleRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.notify?.email ?? "") } },
    });
    const invoke1: Unary<localizationLocaleValidationServiceApi.ValidateLocaleRequest, localizationLocaleValidationServiceApi.ValidateLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.validateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const settled2 = await Promise.allSettled((req?.post?.lines ?? []).map(async (item) => {
      const request2 = communityPostApprovalServiceApi.ApprovePostRequest.fromPartial({
        context: req?.context,
        post: {
          lines: [{
            amount: item?.amount,
            tax: {
              amount: item?.tax?.amount,
              jurisdiction: (item?.tax?.jurisdiction ?? ""),
              rate: (item?.tax?.rate ?? 0),
            },
          }],
        },
      });
      const invoke2: Unary<communityPostApprovalServiceApi.ApprovePostRequest, communityPostApprovalServiceApi.ApprovePostResponse> =
        (input, done) => this.communityPostApprovalClient.approvePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<communityPostApprovalServiceApi.ApprovePostRequest, communityPostApprovalServiceApi.ApprovePostResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: communityPostApprovalServiceApi.ApprovePostResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? communityPostApprovalServiceApi.ApprovePostResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostWorkflowServiceApi.PausePostWorkflowResponse.fromPartial({
        post: {
          counterparty: { displayName: (reply1?.locale?.owner?.displayName ?? "") },
        },
      }),
      communityPostWorkflowServiceApi.PausePostWorkflowResponse.fromPartial({
        post: {
          postId: (req?.postId ?? ""),
          total: req?.post?.total,
        },
      }),
    );
  }

  /**
   * Resumes a post.
   */
  async resumePostWorkflow(req: communityPostWorkflowServiceApi.ResumePostWorkflowRequest): Promise<communityPostWorkflowServiceApi.ResumePostWorkflowResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "ResumePostWorkflow", req);
    this.logger.info("resume_post_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.post?.billingAddress?.region ?? "") },
    });
    const invoke1: Unary<webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse> =
      (input, done) => this.webhooksWebhookDeliveryQueryClient.suggestWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = budgetingBudgetServiceApi.ListBudgetsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.post?.billingAddress?.region ?? "") },
    });
    const method2 = "listBudgets" as const;
    const invoke2: Unary<budgetingBudgetServiceApi.ListBudgetsRequest, budgetingBudgetServiceApi.ListBudgetsResponse> =
      (input, done) => this.budgetingBudgetClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<budgetingBudgetServiceApi.ListBudgetsRequest, budgetingBudgetServiceApi.ListBudgetsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostWorkflowServiceApi.ResumePostWorkflowResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      communityPostWorkflowServiceApi.ResumePostWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      communityPostWorkflowServiceApi.ResumePostWorkflowResponse.fromPartial({
        post: {
          notes: (req?.post?.notes ?? ""),
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a post.
   */
  async retryPostWorkflow(req: communityPostWorkflowServiceApi.RetryPostWorkflowRequest): Promise<communityPostWorkflowServiceApi.RetryPostWorkflowResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "RetryPostWorkflow", req);
    this.logger.info("retry_post_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.post?.billingAddress?.region ?? "") },
    });
    const proxy1 = forwarding(this.webhooksWebhookDeliveryQueryClient);
    const invoke1: Unary<webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesResponse> =
      (input, done) => proxy1.browseWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.BrowseWebhookDeliveriesResponse>(invoke1, request1);
    const request2 = localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: { recipient: (req?.post?.billingAddress?.recipient ?? "") } },
      },
    });
    const invoke2: Unary<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.explainTranslationKeyCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostWorkflowServiceApi.RetryPostWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      communityPostWorkflowServiceApi.RetryPostWorkflowResponse.fromPartial({
        post: {
          counterparty: { displayName: (reply2?.translationKey?.owner?.displayName ?? "") },
        },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      communityPostWorkflowServiceApi.RetryPostWorkflowResponse.fromPartial({
        post: {
          number: (req?.post?.number ?? ""),
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a post.
   */
  async startPostWorkflow(req: communityPostWorkflowServiceApi.StartPostWorkflowRequest): Promise<communityPostWorkflowServiceApi.StartPostWorkflowResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "StartPostWorkflow", req);
    this.logger.info("start_post_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse>> = [];
    for (const item of (req?.post?.lines ?? [])) {
      tasks1.push(async () => {
        const request1 = audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest.fromPartial({
          audienceSync: {
            attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
          },
          context: req?.context,
        });
        const invoke1: Unary<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse> =
          (input, done) => this.audiencesAudienceSyncCalculationClient.simulateAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse.fromPartial({});
    const request2 = personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.post?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.audienceSync?.attributes ?? {}))),
        ownerId: (reply1?.audienceSync?.subject?.audienceMemberId ?? ""),
        region: (req?.post?.billingAddress?.region ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest, personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationQueryClient.browseRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest, personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input3?.annotations ?? {}))),
      context: input3?.context,
      reason: (input3?.reason ?? ""),
    });
    const invoke3: Unary<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.summarizeAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse>(invoke3, request3);
    const results4 = await Promise.all((req?.post?.lines ?? []).map(async (item) => {
      const request4 = communityForumWorkflowServiceApi.StartForumWorkflowRequest.fromPartial({
        context: req?.context,
        forum: {
          children: [{
            children: [{
              attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
              location: {
                lines: (req?.post?.billingAddress?.lines ?? []).map((value) => value),
                locality: (req?.post?.billingAddress?.locality ?? ""),
              },
            }],
          }],
        },
      });
      const invoke4: Unary<communityForumWorkflowServiceApi.StartForumWorkflowRequest, communityForumWorkflowServiceApi.StartForumWorkflowResponse> =
        (input, done) => this.communityForumWorkflowClient.startForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply4 = await call<communityForumWorkflowServiceApi.StartForumWorkflowRequest, communityForumWorkflowServiceApi.StartForumWorkflowResponse>(invoke4, request4);
      return reply4;
    }));
    const reply4 = results4.at(-1) ?? communityForumWorkflowServiceApi.StartForumWorkflowResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      communityPostWorkflowServiceApi.StartPostWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      communityPostWorkflowServiceApi.StartPostWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          details: (reply3?.result?.details ?? {}),
        },
      }),
      communityPostWorkflowServiceApi.StartPostWorkflowResponse.fromPartial({
        post: {
          notes: (req?.post?.notes ?? ""),
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for PostWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class PostWorkflowHandler {
  constructor(@inject(PostWorkflowWorkflow) private readonly workflow: PostWorkflowWorkflow) {}

  /**
   * Advances a post.
   */
  advancePostWorkflow = unary<communityPostWorkflowServiceApi.AdvancePostWorkflowRequest, communityPostWorkflowServiceApi.AdvancePostWorkflowResponse>(
    (request) => this.workflow.advancePostWorkflow(request),
  );

  /**
   * Cancels a post.
   */
  cancelPostWorkflow = unary<communityPostWorkflowServiceApi.CancelPostWorkflowRequest, communityPostWorkflowServiceApi.CancelPostWorkflowResponse>(
    (request) => this.workflow.cancelPostWorkflow(request),
  );

  /**
   * Returns a post.
   */
  inspectPostWorkflow = (call: ServerUnaryCall<communityPostWorkflowServiceApi.InspectPostWorkflowRequest, communityPostWorkflowServiceApi.InspectPostWorkflowResponse>, done: sendUnaryData<communityPostWorkflowServiceApi.InspectPostWorkflowResponse>): void => {
    void this.workflow.inspectPostWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists posts a page at a time.
   */
  listPostWorkflows = unary<communityPostWorkflowServiceApi.ListPostWorkflowsRequest, communityPostWorkflowServiceApi.ListPostWorkflowsResponse>(
    (request) => this.workflow.listPostWorkflows(request),
  );

  /**
   * Pauses a post.
   */
  pausePostWorkflow = unary<communityPostWorkflowServiceApi.PausePostWorkflowRequest, communityPostWorkflowServiceApi.PausePostWorkflowResponse>(
    (request) => this.workflow.pausePostWorkflow(request),
  );

  /**
   * Resumes a post.
   */
  resumePostWorkflow = (call: ServerUnaryCall<communityPostWorkflowServiceApi.ResumePostWorkflowRequest, communityPostWorkflowServiceApi.ResumePostWorkflowResponse>, done: sendUnaryData<communityPostWorkflowServiceApi.ResumePostWorkflowResponse>): void => {
    void this.workflow.resumePostWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a post.
   */
  retryPostWorkflow = unary<communityPostWorkflowServiceApi.RetryPostWorkflowRequest, communityPostWorkflowServiceApi.RetryPostWorkflowResponse>(
    (request) => this.workflow.retryPostWorkflow(request),
  );

  /**
   * Starts a post.
   */
  startPostWorkflow = unary<communityPostWorkflowServiceApi.StartPostWorkflowRequest, communityPostWorkflowServiceApi.StartPostWorkflowResponse>(
    (request) => this.workflow.startPostWorkflow(request),
  );
}

export function implementation(handler: PostWorkflowHandler): communityPostWorkflowServiceApi.PostWorkflowServiceServer {
  return {
    advancePostWorkflow: handler.advancePostWorkflow,
    cancelPostWorkflow: handler.cancelPostWorkflow,
    inspectPostWorkflow: handler.inspectPostWorkflow,
    listPostWorkflows: handler.listPostWorkflows,
    pausePostWorkflow: handler.pausePostWorkflow,
    resumePostWorkflow: handler.resumePostWorkflow,
    retryPostWorkflow: handler.retryPostWorkflow,
    startPostWorkflow: handler.startPostWorkflow,
  };
}
