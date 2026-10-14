/**
 * Routes taxonomies through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as cartCartCalculationServiceApi from "../../../../.cache/proto/acme/cart/v1/cart_calculation_service.js";
import * as chatChatRoomWorkflowServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_workflow_service.js";
import * as contentArticleWorkflowServiceApi from "../../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as contentContentBlockCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as contentContentBlockValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as contentContentBlockWorkflowServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_workflow_service.js";
import * as contentContentRevisionValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as contentTaxonomyApprovalServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_approval_service.js";
import * as contentTaxonomyCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as formsFormWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_workflow_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as mediaMediaAssetServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
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
import { upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTaxonomyRecord } from "../data/records.js";
import { ContentRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate taxonomy operations and persist audit data.
 */
@injectable()
export class TaxonomyApprovalWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.cart.v1.CartCalculationService") private readonly cartCartCalculationClient: cartCartCalculationServiceApi.CartCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomWorkflowService") private readonly chatChatRoomWorkflowClient: chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceClient,
    @inject("grpc:acme.content.v1.ArticleWorkflowService") private readonly contentArticleWorkflowClient: contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockCalculationService") private readonly contentContentBlockCalculationClient: contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockValidationService") private readonly contentContentBlockValidationClient: contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockWorkflowService") private readonly contentContentBlockWorkflowClient: contentContentBlockWorkflowServiceApi.ContentBlockWorkflowServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionValidationService") private readonly contentContentRevisionValidationClient: contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyCalculationService") private readonly contentTaxonomyCalculationClient: contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerValidationService") private readonly customersCustomerValidationClient: customersCustomerValidationServiceApi.CustomerValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormWorkflowService") private readonly formsFormWorkflowClient: formsFormWorkflowServiceApi.FormWorkflowServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseApprovalService") private readonly surveysSurveyResponseApprovalClient: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointApprovalService") private readonly webhooksWebhookEndpointApprovalClient: webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a taxonomy.
   */
  async approveTaxonomy(req: contentTaxonomyApprovalServiceApi.ApproveTaxonomyRequest): Promise<contentTaxonomyApprovalServiceApi.ApproveTaxonomyResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "ApproveTaxonomy", req);
    this.logger.info("approve_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = contentArticleWorkflowServiceApi.ResumeArticleWorkflowRequest.fromPartial({
      article: {
        billingAddress: { recipient: (input1?.taxonomy?.location?.recipient ?? "") },
      },
      context: input1?.context,
      details: { notify: { email: (input1?.details?.approver?.email ?? "") } },
    });
    const invoke1: Unary<contentArticleWorkflowServiceApi.ResumeArticleWorkflowRequest, contentArticleWorkflowServiceApi.ResumeArticleWorkflowResponse> =
      (input, done) => this.contentArticleWorkflowClient.resumeArticleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentArticleWorkflowServiceApi.ResumeArticleWorkflowRequest, contentArticleWorkflowServiceApi.ResumeArticleWorkflowResponse>(invoke1, request1);
    const request2 = identityUserQueryServiceApi.SuggestUsersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.article?.audit?.updatedAt,
        ownerId: (reply1?.article?.counterparty?.contentRevisionId ?? ""),
        region: (req?.taxonomy?.location?.region ?? ""),
      },
    });
    const cloned2: identityUserQueryServiceApi.SuggestUsersRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<identityUserQueryServiceApi.SuggestUsersRequest, identityUserQueryServiceApi.SuggestUsersResponse> =
      (input, done) => this.identityUserQueryClient.suggestUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserQueryServiceApi.SuggestUsersRequest, identityUserQueryServiceApi.SuggestUsersResponse>(invoke2, cloned2);
    const request3 = identityUserQueryServiceApi.PeekUserRequest.fromPartial({
      context: req?.context,
      userId: (req?.taxonomy?.manager?.userId ?? ""),
    });
    const decoded3 = identityUserQueryServiceApi.PeekUserRequest.fromJSON(
      JSON.parse(JSON.stringify(identityUserQueryServiceApi.PeekUserRequest.toJSON(request3))),
    );
    const invoke3: Unary<identityUserQueryServiceApi.PeekUserRequest, identityUserQueryServiceApi.PeekUserResponse> =
      (input, done) => this.identityUserQueryClient.peekUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<identityUserQueryServiceApi.PeekUserRequest, identityUserQueryServiceApi.PeekUserResponse>(invoke3, decoded3);
    const request4 = customersCustomerValidationServiceApi.LintCustomersRequest.fromPartial({
      context: req?.context,
      customer: {
        preferences: { marketingOptIn: (reply3?.user?.preferences?.marketingOptIn ?? false) },
        primaryAddress: { recipient: (req?.taxonomy?.location?.recipient ?? "") },
      },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.LintCustomersRequest",
      value: Buffer.from(customersCustomerValidationServiceApi.LintCustomersRequest.encode(request4).finish()),
    });
    const unpacked4 = customersCustomerValidationServiceApi.LintCustomersRequest.decode(envelope4.value);
    const invoke4: Unary<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse> =
      (input, done) => this.customersCustomerValidationClient.lintCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyApprovalServiceApi.ApproveTaxonomyResponse.fromPartial({
        taxonomy: { audit: { createdBy: (reply1?.article?.audit?.createdBy ?? "") } },
      }),
      contentTaxonomyApprovalServiceApi.ApproveTaxonomyResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      contentTaxonomyApprovalServiceApi.ApproveTaxonomyResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        taxonomy: {
          children: [{
            children: [{ audit: { createdBy: (reply3?.user?.audit?.createdBy ?? "") } }],
          }],
        },
      }),
      contentTaxonomyApprovalServiceApi.ApproveTaxonomyResponse.fromPartial({
        taxonomy: {
          location: { countryCode: (reply4?.customer?.primaryAddress?.countryCode ?? "") },
        },
      }),
      contentTaxonomyApprovalServiceApi.ApproveTaxonomyResponse.fromPartial({
        taxonomy: {
          manager: req?.taxonomy?.manager,
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a taxonomy.
   */
  async commentTaxonomyApproval(req: contentTaxonomyApprovalServiceApi.CommentTaxonomyApprovalRequest): Promise<contentTaxonomyApprovalServiceApi.CommentTaxonomyApprovalResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "CommentTaxonomyApproval", req);
    this.logger.info("comment_taxonomy_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentTaxonomyCalculationServiceApi.GetTaxonomyRatesRequest.fromPartial({
      context: req?.context,
      taxonomyId: (req?.taxonomy?.taxonomyId ?? ""),
    });
    const client1 = this.clients.get<contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceClient>("acme.content.v1.TaxonomyCalculationService");
    const invoke1: Unary<contentTaxonomyCalculationServiceApi.GetTaxonomyRatesRequest, contentTaxonomyCalculationServiceApi.GetTaxonomyRatesResponse> =
      (input, done) => client1.getTaxonomyRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentTaxonomyCalculationServiceApi.GetTaxonomyRatesRequest, contentTaxonomyCalculationServiceApi.GetTaxonomyRatesResponse>(invoke1, request1);
    const request2 = cartCartCalculationServiceApi.QuoteCartRequest.fromPartial({
      cart: {
        audit: { etag: (reply1?.taxonomy?.audit?.etag ?? "") },
        billingAddress: { recipient: (req?.taxonomy?.location?.recipient ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<cartCartCalculationServiceApi.QuoteCartRequest, cartCartCalculationServiceApi.QuoteCartResponse> =
      (input, done) => this.cartCartCalculationClient.quoteCart(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<cartCartCalculationServiceApi.QuoteCartRequest, cartCartCalculationServiceApi.QuoteCartResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyApprovalServiceApi.CommentTaxonomyApprovalResponse.fromPartial({
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
        taxonomy: {
          children: [{ manager: { email: (reply1?.taxonomy?.manager?.email ?? "") } }],
        },
      }),
      contentTaxonomyApprovalServiceApi.CommentTaxonomyApprovalResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{
              location: { locality: (reply2?.cart?.billingAddress?.locality ?? "") },
            }],
          }],
        },
      }),
      contentTaxonomyApprovalServiceApi.CommentTaxonomyApprovalResponse.fromPartial({
        taxonomy: {
          manager: req?.taxonomy?.manager,
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a taxonomy.
   */
  async delegateTaxonomyApproval(req: contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalRequest): Promise<contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "DelegateTaxonomyApproval", req);
    this.logger.info("delegate_taxonomy_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { locality: (req?.taxonomy?.location?.locality ?? "") } },
        audit: { updatedBy: (req?.taxonomy?.audit?.updatedBy ?? "") },
        owner: { userId: (req?.details?.approver?.userId ?? "") },
      },
      context: req?.context,
      details: { notify: { email: (req?.details?.approver?.email ?? "") } },
    });
    const invoke1: Unary<chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowResponse> =
      (input, done) => this.chatChatRoomWorkflowClient.advanceChatRoomWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.AdvanceChatRoomWorkflowResponse>(invoke1, request1));
    const request2 = notificationsNotificationValidationServiceApi.ExplainNotificationDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.chatRoom?.owner?.email ?? "") } },
      notification: {
        assignee: { email: (req?.details?.approver?.email ?? "") },
        audit: { updatedBy: (req?.taxonomy?.audit?.updatedBy ?? "") },
        comments: [{ createdAt: req?.taxonomy?.audit?.createdAt }],
      },
    });
    const invoke2: Unary<notificationsNotificationValidationServiceApi.ExplainNotificationDecisionRequest, notificationsNotificationValidationServiceApi.ExplainNotificationDecisionResponse> =
      (input, done) => this.notificationsNotificationValidationClient.explainNotificationDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("DelegateTaxonomyApproval.ExplainNotificationDecision", () => call<notificationsNotificationValidationServiceApi.ExplainNotificationDecisionRequest, notificationsNotificationValidationServiceApi.ExplainNotificationDecisionResponse>(invoke2, request2));
    const request3 = customersCustomerValidationServiceApi.LintCustomersRequest.fromPartial({
      context: req?.context,
      customer: {
        audit: { createdAt: req?.taxonomy?.audit?.createdAt },
        contact: {
          preferredChannel: (reply2?.notification?.requester?.preferredChannel ?? ""),
        },
        primaryAddress: {
          recipient: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.recipient ?? ""),
        },
        relationshipManager: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const invoke3: Unary<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse> =
      (input, done) => this.customersCustomerValidationClient.lintCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalResponse.fromPartial({
        taxonomy: {
          children: [{
            audit: { updatedBy: (reply1?.chatRoom?.audit?.updatedBy ?? "") },
            children: [{
              location: {
                postalCode: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.postalCode ?? ""),
              },
            }],
          }],
        },
      }),
      contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalResponse.fromPartial({
        taxonomy: {
          children: [{ audit: { etag: (reply2?.notification?.audit?.etag ?? "") } }],
        },
      }),
      contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalResponse.fromPartial({
        taxonomy: {
          audit: { updatedBy: (reply3?.customer?.audit?.updatedBy ?? "") },
          children: [{
            children: [{
              location: { postalCode: (reply3?.customer?.primaryAddress?.postalCode ?? "") },
            }],
          }],
        },
      }),
      contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        taxonomy: { taxonomyId: (req?.taxonomyId ?? "") },
      }),
    );
  }

  /**
   * Escalates a taxonomy.
   */
  async escalateTaxonomy(req: contentTaxonomyApprovalServiceApi.EscalateTaxonomyRequest): Promise<contentTaxonomyApprovalServiceApi.EscalateTaxonomyResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "EscalateTaxonomy", req);
    this.logger.info("escalate_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            location: {
              locality: (req?.taxonomy?.location?.locality ?? ""),
              region: (req?.taxonomy?.location?.region ?? ""),
            },
            manager: { displayName: (req?.details?.approver?.displayName ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const reply1 = await this.workQueue.enqueue<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse>(
      "acme.content.v1.TaxonomyApprovalService/EscalateTaxonomy:0", request1,
    );
    const request2 = customersCustomerValidationServiceApi.LintCustomersRequest.fromPartial({
      context: req?.context,
      customer: { contact: { email: (req?.taxonomy?.manager?.email ?? "") } },
    });
    const invoke2: Unary<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse> =
      (input, done) => this.customersCustomerValidationClient.lintCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse>(invoke2, request2));
    const request3 = contentContentBlockValidationServiceApi.PreviewContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            location: { countryCode: (req?.taxonomy?.location?.countryCode ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke3: Unary<contentContentBlockValidationServiceApi.PreviewContentBlockRequest, contentContentBlockValidationServiceApi.PreviewContentBlockResponse> =
      (input, done) => this.contentContentBlockValidationClient.previewContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<contentContentBlockValidationServiceApi.PreviewContentBlockResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = formsFormWorkflowServiceApi.ListFormWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.taxonomy?.location?.region ?? "") },
    });
    const invoke4: Unary<formsFormWorkflowServiceApi.ListFormWorkflowsRequest, formsFormWorkflowServiceApi.ListFormWorkflowsResponse> =
      (input, done) => this.formsFormWorkflowClient.listFormWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    const request5 = mediaMediaAssetServiceApi.BatchCreateMediaAssetsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply5 = await upload<mediaMediaAssetServiceApi.BatchCreateMediaAssetsRequest, mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse>(
      (done) => this.mediaMediaAssetClient.batchCreateMediaAssets(metadataFor(request5.context), { deadline: Date.now() + 15_000 }, done), [request5],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyApprovalServiceApi.EscalateTaxonomyResponse.fromPartial({ taxonomy: { location: reply1?.contentBlock?.location } }),
      contentTaxonomyApprovalServiceApi.EscalateTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{ audit: { updatedAt: reply2?.customer?.audit?.updatedAt } }],
        },
      }),
      contentTaxonomyApprovalServiceApi.EscalateTaxonomyResponse.fromPartial({
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
        taxonomy: {
          children: [{
            children: [{
              location: { postalCode: (reply3?.contentBlock?.location?.postalCode ?? "") },
            }],
          }],
        },
      }),
      contentTaxonomyApprovalServiceApi.EscalateTaxonomyResponse.fromPartial({
        outcome: { message: (reply4?.result?.message ?? "") },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      contentTaxonomyApprovalServiceApi.EscalateTaxonomyResponse.fromPartial({
        taxonomy: {
          status: req?.taxonomy?.status,
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a taxonomy.
   */
  async getTaxonomyApprovalStatus(req: contentTaxonomyApprovalServiceApi.GetTaxonomyApprovalStatusRequest): Promise<contentTaxonomyApprovalServiceApi.GetTaxonomyApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.taxonomyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "taxonomy_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTaxonomyApprovalStatus", req);
    this.logger.info("get_taxonomy_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest.fromPartial({
      chatRoom: {
        audit: { createdAt: req?.context?.deadline },
        components: { primary: { componentId: (req?.taxonomyId ?? "") } },
        owner: { userId: (req?.context?.actor?.userId ?? "") },
      },
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.RetryChatRoomWorkflowResponse> =
      (input, done) => this.chatChatRoomWorkflowClient.retryChatRoomWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (reply1?.chatRoom?.owner?.email ?? ""),
          userId: (reply1?.chatRoom?.owner?.userId ?? ""),
        },
      },
    });
    const method2 = "rejectSurveyResponse" as const;
    const invoke2: Unary<surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RejectSurveyResponseResponse>(invoke2, request2);
    return mergeResponses(
      contentTaxonomyApprovalServiceApi.GetTaxonomyApprovalStatusResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{ audit: { etag: (reply1?.chatRoom?.audit?.etag ?? "") } }],
          }],
        },
      }),
      contentTaxonomyApprovalServiceApi.GetTaxonomyApprovalStatusResponse.fromPartial({
        result: { message: (reply2?.outcome?.message ?? "") },
        taxonomy: { manager: { email: (reply2?.surveyResponse?.subject?.email ?? "") } },
      }),
      contentTaxonomyApprovalServiceApi.GetTaxonomyApprovalStatusResponse.fromPartial({ taxonomy: { taxonomyId: (req?.taxonomyId ?? "") } }),
    );
  }

  /**
   * Lists taxonomies a page at a time.
   */
  async listPendingTaxonomies(req: contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesRequest): Promise<contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingTaxonomies", req);
    this.logger.info("list_pending_taxonomies", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesResponse.fromPartial({});
  }

  /**
   * Recalls a taxonomy.
   */
  async recallTaxonomy(req: contentTaxonomyApprovalServiceApi.RecallTaxonomyRequest): Promise<contentTaxonomyApprovalServiceApi.RecallTaxonomyResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "RecallTaxonomy", req);
    this.logger.info("recall_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.UpdateUserRequest.fromPartial({
      context: req?.context,
      user: {
        primaryAddress: { postalCode: (req?.taxonomy?.location?.postalCode ?? "") },
        relationshipManager: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          email: (req?.taxonomy?.manager?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.identityUserClient);
    const invoke1: Unary<identityUserServiceApi.UpdateUserRequest, identityUserServiceApi.UpdateUserResponse> =
      (input, done) => proxy1.updateUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserServiceApi.UpdateUserRequest, identityUserServiceApi.UpdateUserResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.details?.approver?.displayName ?? "") } },
      details: {
        notify: {
          email: (req?.taxonomy?.manager?.email ?? ""),
          name: reply1?.user?.contact?.name,
        },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.pauseDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse>(invoke2, request2);
    const request3 = webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.approver?.email ?? "") } },
      webhookEndpoint: {
        audit: { updatedBy: (req?.taxonomy?.audit?.updatedBy ?? "") },
        owner: { displayName: (reply2?.deliveryAttempt?.subject?.displayName ?? "") },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointApprovalClient.approveWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointRequest, webhooksWebhookEndpointApprovalServiceApi.ApproveWebhookEndpointResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { createdBy: (reply3?.webhookEndpoint?.audit?.createdBy ?? "") },
            location: {
              recipient: ((reply3?.webhookEndpoint?.locator?.$case === "address" ? reply3?.webhookEndpoint?.locator.address : undefined)?.recipient ?? ""),
            },
            manager: { displayName: (reply2?.deliveryAttempt?.subject?.displayName ?? "") },
          }],
        }],
      },
      context: input4?.context,
    });
    const invoke4: Unary<contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowResponse> =
      (input, done) => this.contentContentBlockWorkflowClient.cancelContentBlockWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyApprovalServiceApi.RecallTaxonomyResponse.fromPartial({
        taxonomy: {
          location: { recipient: (reply1?.user?.primaryAddress?.recipient ?? "") },
        },
      }),
      contentTaxonomyApprovalServiceApi.RecallTaxonomyResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          nextSteps: (reply2?.outcome?.nextSteps ?? []),
        },
      }),
      contentTaxonomyApprovalServiceApi.RecallTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{
            audit: { updatedAt: reply3?.webhookEndpoint?.audit?.updatedAt },
            location: {
              region: ((reply3?.webhookEndpoint?.locator?.$case === "address" ? reply3?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
            },
          }],
        },
      }),
      contentTaxonomyApprovalServiceApi.RecallTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{ children: [{ depth: (reply4?.contentBlock?.depth ?? 0) }] }],
        },
      }),
      contentTaxonomyApprovalServiceApi.RecallTaxonomyResponse.fromPartial({
        taxonomy: {
          attributes: (req?.taxonomy?.attributes ?? {}),
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a taxonomy.
   */
  async submitTaxonomy(req: contentTaxonomyApprovalServiceApi.SubmitTaxonomyRequest): Promise<contentTaxonomyApprovalServiceApi.SubmitTaxonomyResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "SubmitTaxonomy", req);
    this.logger.info("submit_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerQueryServiceApi.FindCustomersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.taxonomy?.audit?.createdAt,
        region: (req?.taxonomy?.location?.region ?? ""),
      },
    });
    const cloned1: customersCustomerQueryServiceApi.FindCustomersRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<customersCustomerQueryServiceApi.FindCustomersRequest, customersCustomerQueryServiceApi.FindCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient.findCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerQueryServiceApi.FindCustomersRequest, customersCustomerQueryServiceApi.FindCustomersResponse>(invoke1, cloned1);
    const request2 = contentContentRevisionValidationServiceApi.ValidateContentRevisionRequest.fromPartial({
      contentRevision: {
        attributes: Object.fromEntries(Object.entries((req?.taxonomy?.attributes ?? {}))),
        subject: {
          displayName: (req?.taxonomy?.manager?.displayName ?? ""),
          email: (req?.taxonomy?.manager?.email ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
    });
    const decoded2 = contentContentRevisionValidationServiceApi.ValidateContentRevisionRequest.fromJSON(
      JSON.parse(JSON.stringify(contentContentRevisionValidationServiceApi.ValidateContentRevisionRequest.toJSON(request2))),
    );
    const invoke2: Unary<contentContentRevisionValidationServiceApi.ValidateContentRevisionRequest, contentContentRevisionValidationServiceApi.ValidateContentRevisionResponse> =
      (input, done) => this.contentContentRevisionValidationClient.validateContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentContentRevisionValidationServiceApi.ValidateContentRevisionRequest, contentContentRevisionValidationServiceApi.ValidateContentRevisionResponse>(invoke2, decoded2);
    const request3 = contentContentBlockCalculationServiceApi.CalculateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: {
              createdAt: req?.taxonomy?.audit?.createdAt,
              updatedAt: req?.taxonomy?.audit?.updatedAt,
              updatedBy: (req?.taxonomy?.audit?.updatedBy ?? ""),
            },
            location: { locality: (req?.taxonomy?.location?.locality ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.content.v1.CalculateContentBlockRequest",
      value: Buffer.from(contentContentBlockCalculationServiceApi.CalculateContentBlockRequest.encode(request3).finish()),
    });
    const unpacked3 = contentContentBlockCalculationServiceApi.CalculateContentBlockRequest.decode(envelope3.value);
    const invoke3: Unary<contentContentBlockCalculationServiceApi.CalculateContentBlockRequest, contentContentBlockCalculationServiceApi.CalculateContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.calculateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<contentContentBlockCalculationServiceApi.CalculateContentBlockRequest, contentContentBlockCalculationServiceApi.CalculateContentBlockResponse>(invoke3, unpacked3);
    const request4 = customersPreferenceCalculationServiceApi.CalculatePreferenceRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (reply3?.contentBlock?.location?.lines ?? []).map((value) => value),
        },
      },
      preference: { audit: { createdBy: (reply3?.contentBlock?.audit?.createdBy ?? "") } },
    });
    const client4 = this.clients.get<customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient>("acme.customers.v1.PreferenceCalculationService");
    const invoke4: Unary<customersPreferenceCalculationServiceApi.CalculatePreferenceRequest, customersPreferenceCalculationServiceApi.CalculatePreferenceResponse> =
      (input, done) => client4.calculatePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersPreferenceCalculationServiceApi.CalculatePreferenceRequest, customersPreferenceCalculationServiceApi.CalculatePreferenceResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyApprovalServiceApi.SubmitTaxonomyResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      contentTaxonomyApprovalServiceApi.SubmitTaxonomyResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      contentTaxonomyApprovalServiceApi.SubmitTaxonomyResponse.fromPartial({
        taxonomy: {
          audit: { updatedAt: reply3?.contentBlock?.audit?.updatedAt },
          children: [{
            manager: { displayName: (reply3?.contentBlock?.manager?.displayName ?? "") },
          }],
        },
      }),
      contentTaxonomyApprovalServiceApi.SubmitTaxonomyResponse.fromPartial({
        taxonomy: { audit: { updatedAt: reply4?.preference?.audit?.updatedAt } },
      }),
      contentTaxonomyApprovalServiceApi.SubmitTaxonomyResponse.fromPartial({
        taxonomy: {
          status: req?.taxonomy?.status,
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for TaxonomyApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class TaxonomyApprovalHandler {
  constructor(@inject(TaxonomyApprovalWorkflow) private readonly workflow: TaxonomyApprovalWorkflow) {}

  /**
   * Approves a taxonomy.
   */
  approveTaxonomy = unary<contentTaxonomyApprovalServiceApi.ApproveTaxonomyRequest, contentTaxonomyApprovalServiceApi.ApproveTaxonomyResponse>(
    (request) => this.workflow.approveTaxonomy(request),
  );

  /**
   * Comments a taxonomy.
   */
  commentTaxonomyApproval = unary<contentTaxonomyApprovalServiceApi.CommentTaxonomyApprovalRequest, contentTaxonomyApprovalServiceApi.CommentTaxonomyApprovalResponse>(
    (request) => this.workflow.commentTaxonomyApproval(request),
  );

  /**
   * Delegates a taxonomy.
   */
  delegateTaxonomyApproval = (call: ServerUnaryCall<contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalRequest, contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalResponse>, done: sendUnaryData<contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalResponse>): void => {
    void this.workflow.delegateTaxonomyApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a taxonomy.
   */
  escalateTaxonomy = unary<contentTaxonomyApprovalServiceApi.EscalateTaxonomyRequest, contentTaxonomyApprovalServiceApi.EscalateTaxonomyResponse>(
    (request) => this.workflow.escalateTaxonomy(request),
  );

  /**
   * Returns a taxonomy.
   */
  getTaxonomyApprovalStatus = unary<contentTaxonomyApprovalServiceApi.GetTaxonomyApprovalStatusRequest, contentTaxonomyApprovalServiceApi.GetTaxonomyApprovalStatusResponse>(
    (request) => this.workflow.getTaxonomyApprovalStatus(request),
  );

  /**
   * Lists taxonomies a page at a time.
   */
  listPendingTaxonomies = (call: ServerUnaryCall<contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesRequest, contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesResponse>, done: sendUnaryData<contentTaxonomyApprovalServiceApi.ListPendingTaxonomiesResponse>): void => {
    void this.workflow.listPendingTaxonomies(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a taxonomy.
   */
  recallTaxonomy = unary<contentTaxonomyApprovalServiceApi.RecallTaxonomyRequest, contentTaxonomyApprovalServiceApi.RecallTaxonomyResponse>(
    (request) => this.workflow.recallTaxonomy(request),
  );

  /**
   * Submits a taxonomy.
   */
  submitTaxonomy = unary<contentTaxonomyApprovalServiceApi.SubmitTaxonomyRequest, contentTaxonomyApprovalServiceApi.SubmitTaxonomyResponse>(
    (request) => this.workflow.submitTaxonomy(request),
  );
}

export function implementation(handler: TaxonomyApprovalHandler): contentTaxonomyApprovalServiceApi.TaxonomyApprovalServiceServer {
  return {
    approveTaxonomy: handler.approveTaxonomy,
    commentTaxonomyApproval: handler.commentTaxonomyApproval,
    delegateTaxonomyApproval: handler.delegateTaxonomyApproval,
    escalateTaxonomy: handler.escalateTaxonomy,
    getTaxonomyApprovalStatus: handler.getTaxonomyApprovalStatus,
    listPendingTaxonomies: handler.listPendingTaxonomies,
    recallTaxonomy: handler.recallTaxonomy,
    submitTaxonomy: handler.submitTaxonomy,
  };
}
