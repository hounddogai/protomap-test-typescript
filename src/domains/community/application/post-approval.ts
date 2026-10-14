/**
 * Routes posts through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as communityForumApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as communityPostQueryServiceApi from "../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as messagingConversationQueryServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
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
  promised,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toPostRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate post operations and persist audit data.
 */
@injectable()
export class PostApprovalWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.community.v1.PostQueryService") private readonly communityPostQueryClient: communityPostQueryServiceApi.PostQueryServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantQueryService") private readonly experimentsVariantQueryClient: experimentsVariantQueryServiceApi.VariantQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionValidationService") private readonly formsFormSubmissionValidationClient: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationQueryService") private readonly messagingConversationQueryClient: messagingConversationQueryServiceApi.ConversationQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a post.
   */
  async approvePost(req: communityPostApprovalServiceApi.ApprovePostRequest): Promise<communityPostApprovalServiceApi.ApprovePostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "ApprovePost", req);
    this.logger.info("approve_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.ValidatePostRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: { lines: (req?.post?.billingAddress?.lines ?? []).map((value) => value) },
      },
    });
    const invoke1: Unary<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse> =
      (input, done) => this.communityPostValidationClient.validatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<communityPostValidationServiceApi.ValidatePostResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostApprovalServiceApi.ApprovePostResponse.fromPartial({
        outcome: { message: (reply1?.outcome?.message ?? "") },
        post: {
          billingAddress: { region: (reply1?.post?.billingAddress?.region ?? "") },
        },
      }),
      communityPostApprovalServiceApi.ApprovePostResponse.fromPartial({
        post: {
          counterparty: req?.post?.counterparty,
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a post.
   */
  async commentPostApproval(req: communityPostApprovalServiceApi.CommentPostApprovalRequest): Promise<communityPostApprovalServiceApi.CommentPostApprovalResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "CommentPostApproval", req);
    this.logger.info("comment_post_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { recipient: (req?.post?.billingAddress?.recipient ?? "") },
      },
      formSubmission: { subject: { displayName: (req?.details?.approver?.displayName ?? "") } },
    });
    const invoke1: Unary<formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest, formsFormSubmissionValidationServiceApi.ScoreFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionValidationClient.scoreFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostApprovalServiceApi.CommentPostApprovalResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      communityPostApprovalServiceApi.CommentPostApprovalResponse.fromPartial({
        post: {
          billingAddress: req?.post?.billingAddress,
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a post.
   */
  async delegatePostApproval(req: communityPostApprovalServiceApi.DelegatePostApprovalRequest): Promise<communityPostApprovalServiceApi.DelegatePostApprovalResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "DelegatePostApproval", req);
    this.logger.info("delegate_post_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumApprovalServiceApi.RecallForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            location: {
              locality: (req?.post?.billingAddress?.locality ?? ""),
              postalCode: (req?.post?.billingAddress?.postalCode ?? ""),
              recipient: (req?.post?.billingAddress?.recipient ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<communityForumApprovalServiceApi.RecallForumRequest, communityForumApprovalServiceApi.RecallForumResponse> =
      (input, done) => this.communityForumApprovalClient.recallForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostApprovalServiceApi.DelegatePostApprovalResponse.fromPartial({
        post: { counterparty: { email: (reply1?.forum?.manager?.email ?? "") } },
      }),
      communityPostApprovalServiceApi.DelegatePostApprovalResponse.fromPartial({
        post: {
          postId: (req?.postId ?? ""),
          status: req?.post?.status,
        },
      }),
    );
  }

  /**
   * Escalates a post.
   */
  async escalatePost(req: communityPostApprovalServiceApi.EscalatePostRequest): Promise<communityPostApprovalServiceApi.EscalatePostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "EscalatePost", req);
    this.logger.info("escalate_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.GetPostRulesRequest.fromPartial({
      context: req?.context,
      postId: (req?.postId ?? ""),
    });
    const method1 = "getPostRules" as const;
    const invoke1: Unary<communityPostValidationServiceApi.GetPostRulesRequest, communityPostValidationServiceApi.GetPostRulesResponse> =
      (input, done) => this.communityPostValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostValidationServiceApi.GetPostRulesRequest, communityPostValidationServiceApi.GetPostRulesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostApprovalServiceApi.EscalatePostResponse.fromPartial({
        post: {
          audit: { createdAt: reply1?.post?.audit?.createdAt },
          counterparty: { displayName: (reply1?.post?.counterparty?.displayName ?? "") },
        },
      }),
      communityPostApprovalServiceApi.EscalatePostResponse.fromPartial({
        post: {
          notes: (req?.post?.notes ?? ""),
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a post.
   */
  async getPostApprovalStatus(req: communityPostApprovalServiceApi.GetPostApprovalStatusRequest): Promise<communityPostApprovalServiceApi.GetPostApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.postId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "post_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetPostApprovalStatus", req);
    this.logger.info("get_post_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest.fromPartial({
      consentRecord: {
        occurredAt: req?.context?.deadline,
        source: (req?.postId ?? ""),
      },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const proxy1 = forwarding(this.customersConsentRecordValidationClient);
    const invoke1: Unary<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse> =
      (input, done) => proxy1.previewConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse>(invoke1, request1);
    return mergeResponses(
      communityPostApprovalServiceApi.GetPostApprovalStatusResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      communityPostApprovalServiceApi.GetPostApprovalStatusResponse.fromPartial({ post: { postId: (req?.postId ?? "") } }),
    );
  }

  /**
   * Recalls a post.
   */
  async recallPost(req: communityPostApprovalServiceApi.RecallPostRequest): Promise<communityPostApprovalServiceApi.RecallPostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "RecallPost", req);
    this.logger.info("recall_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.post?.settlement?.$case) {
      case "bank":
        selected1_1 = ((req?.post?.settlement?.$case === "bank" ? req?.post?.settlement.bank : undefined)?.bic ?? "");
        break;
      default:
        selected1_1 = "";
    }
    let selected1_3: string | undefined;
    switch (req?.post?.settlement?.$case) {
      case "bank":
        selected1_3 = ((req?.post?.settlement?.$case === "bank" ? req?.post?.settlement.bank : undefined)?.accountHolder ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        settlement: { $case: "bank", bank: {
          accountHolder: (selected1_3 ?? ""),
          bic: (selected1_1 ?? ""),
        } },
        billingAddress: { region: (req?.post?.billingAddress?.region ?? "") },
        counterparty: { displayName: (req?.post?.counterparty?.displayName ?? "") },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.recalculateNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse>(invoke1, request1);
    const request2 = communityPostQueryServiceApi.ResolvePostsRequest.fromPartial({ context: req?.context });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityPostQueryServiceApi.ResolvePostsRequest, communityPostQueryServiceApi.ResolvePostsResponse> =
      (input, done) => this.communityPostQueryClient.resolvePosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostQueryServiceApi.ResolvePostsRequest, communityPostQueryServiceApi.ResolvePostsResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostApprovalServiceApi.RecallPostResponse.fromPartial({
        post: {
          counterparty: {
            displayName: (reply1?.notificationTemplate?.counterparty?.displayName ?? ""),
          },
        },
      }),
      communityPostApprovalServiceApi.RecallPostResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      communityPostApprovalServiceApi.RecallPostResponse.fromPartial({
        post: {
          notes: (req?.post?.notes ?? ""),
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a post.
   */
  async rejectPost(req: communityPostApprovalServiceApi.RejectPostRequest): Promise<communityPostApprovalServiceApi.RejectPostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "RejectPost", req);
    this.logger.info("reject_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = personalizationProfileCalculationServiceApi.CalculateProfileRequest.fromPartial({
      context: input1?.context,
      profile: {
        audit: {
          createdBy: (input1?.post?.audit?.createdBy ?? ""),
          etag: (input1?.post?.audit?.etag ?? ""),
          updatedBy: (input1?.post?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.calculateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse>(invoke1, request1);
    const request2 = experimentsVariantQueryServiceApi.SuggestVariantsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.post?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.post?.metadata ?? {}))),
        region: (req?.post?.billingAddress?.region ?? ""),
      },
    });
    const cloned2: experimentsVariantQueryServiceApi.SuggestVariantsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<experimentsVariantQueryServiceApi.SuggestVariantsRequest, experimentsVariantQueryServiceApi.SuggestVariantsResponse> =
      (input, done) => this.experimentsVariantQueryClient.suggestVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantQueryServiceApi.SuggestVariantsRequest, experimentsVariantQueryServiceApi.SuggestVariantsResponse>(invoke2, cloned2);
    const request3 = notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (reply1?.profile?.primaryAddress?.lines ?? []).map((value) => value),
        },
      },
    });
    const decoded3 = notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest.toJSON(request3))),
    );
    const invoke3: Unary<notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.estimateNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateResponse>(invoke3, decoded3);
    const request4 = communityForumServiceApi.WatchForumsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply3?.notificationTemplate?.billingAddress?.region ?? "") },
      subscriber: {
        email: (reply1?.profile?.contact?.email ?? ""),
        name: reply1?.profile?.name,
        phone: (reply1?.profile?.contact?.phone ?? ""),
      },
    });
    const stream4 = this.communityForumClient.watchForums(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const messages4 = await collect(stream4);
    const reply4 = messages4.at(-1) ?? communityForumServiceApi.WatchForumsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostApprovalServiceApi.RejectPostResponse.fromPartial({
        post: {
          audit: { etag: (reply1?.profile?.audit?.etag ?? "") },
          billingAddress: { postalCode: (reply1?.profile?.primaryAddress?.postalCode ?? "") },
        },
      }),
      communityPostApprovalServiceApi.RejectPostResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      communityPostApprovalServiceApi.RejectPostResponse.fromPartial({
        post: { billingAddress: reply3?.notificationTemplate?.billingAddress },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      communityPostApprovalServiceApi.RejectPostResponse.fromPartial({
        post: {
          postId: (req?.postId ?? ""),
          status: req?.post?.status,
        },
      }),
    );
  }

  /**
   * Submits a post.
   */
  async submitPost(req: communityPostApprovalServiceApi.SubmitPostRequest): Promise<communityPostApprovalServiceApi.SubmitPostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "SubmitPost", req);
    this.logger.info("submit_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        audit: {
          createdBy: (req?.post?.audit?.createdBy ?? ""),
          etag: (req?.post?.audit?.etag ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.LintWebhookEndpointsRequest",
      value: Buffer.from(webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest.encode(request1).finish()),
    });
    const unpacked1 = webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest.decode(envelope1.value);
    const invoke1: Unary<webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest, webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.lintWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest, webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsResponse>(invoke1, unpacked1);
    const request2 = messagingConversationQueryServiceApi.SuggestConversationsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.post?.billingAddress?.region ?? "") },
    });
    const client2 = this.clients.get<messagingConversationQueryServiceApi.ConversationQueryServiceClient>("acme.messaging.v1.ConversationQueryService");
    const invoke2: Unary<messagingConversationQueryServiceApi.SuggestConversationsRequest, messagingConversationQueryServiceApi.SuggestConversationsResponse> =
      (input, done) => client2.suggestConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationQueryServiceApi.SuggestConversationsRequest, messagingConversationQueryServiceApi.SuggestConversationsResponse>(invoke2, request2);
    const request3 = customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        owner: { displayName: (reply1?.webhookEndpoint?.owner?.displayName ?? "") },
      },
    });
    const invoke3: Unary<customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.quoteCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostApprovalServiceApi.SubmitPostResponse.fromPartial({
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
        post: {
          audit: { createdBy: (reply1?.webhookEndpoint?.audit?.createdBy ?? "") },
        },
      }),
      communityPostApprovalServiceApi.SubmitPostResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      communityPostApprovalServiceApi.SubmitPostResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      communityPostApprovalServiceApi.SubmitPostResponse.fromPartial({
        post: {
          issuedAt: req?.post?.issuedAt,
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }
}
