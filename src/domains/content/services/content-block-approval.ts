/**
 * Routes content blocks through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as contentArticleApprovalServiceApi from "../../../../.cache/proto/acme/content/v1/article_approval_service.js";
import * as contentArticleQueryServiceApi from "../../../../.cache/proto/acme/content/v1/article_query_service.js";
import * as contentArticleValidationServiceApi from "../../../../.cache/proto/acme/content/v1/article_validation_service.js";
import * as contentContentBlockApprovalServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_approval_service.js";
import * as contentContentBlockQueryServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_query_service.js";
import * as contentContentBlockValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as contentContentRevisionCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as formsFormFieldWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_workflow_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toContentBlockRecord } from "../data/records.js";
import { ContentRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate content block operations and persist audit data.
 */
@injectable()
export class ContentBlockApprovalWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.content.v1.ArticleApprovalService") private readonly contentArticleApprovalClient: contentArticleApprovalServiceApi.ArticleApprovalServiceClient,
    @inject("grpc:acme.content.v1.ArticleQueryService") private readonly contentArticleQueryClient: contentArticleQueryServiceApi.ArticleQueryServiceClient,
    @inject("grpc:acme.content.v1.ArticleValidationService") private readonly contentArticleValidationClient: contentArticleValidationServiceApi.ArticleValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockQueryService") private readonly contentContentBlockQueryClient: contentContentBlockQueryServiceApi.ContentBlockQueryServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockValidationService") private readonly contentContentBlockValidationClient: contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionCalculationService") private readonly contentContentRevisionCalculationClient: contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerValidationService") private readonly customersCustomerValidationClient: customersCustomerValidationServiceApi.CustomerValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdCalculationService") private readonly customersHouseholdCalculationClient: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldWorkflowService") private readonly formsFormFieldWorkflowClient: formsFormFieldWorkflowServiceApi.FormFieldWorkflowServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a content block.
   */
  async approveContentBlock(req: contentContentBlockApprovalServiceApi.ApproveContentBlockRequest): Promise<contentContentBlockApprovalServiceApi.ApproveContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "ApproveContentBlock", req);
    this.logger.info("approve_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesServiceApi.CloneMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: {
        locator: { $case: "address", address: {
          countryCode: (req?.contentBlock?.location?.countryCode ?? ""),
          lines: (req?.contentBlock?.location?.lines ?? []).map((value) => value),
        } },
        owner: { userId: (req?.details?.approver?.userId ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse>(
      "acme.content.v1.ContentBlockApprovalService/ApproveContentBlock:0", request1,
    );
    let selected2_3: string | undefined;
    switch (reply1?.metricSeries?.locator?.$case) {
      case "address":
        selected2_3 = ((reply1?.metricSeries?.locator?.$case === "address" ? reply1?.metricSeries?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (req?.contentBlock?.location?.locality ?? ""),
          recipient: (selected2_3 ?? ""),
          region: (req?.contentBlock?.location?.region ?? ""),
        },
      },
    });
    const invoke2: Unary<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.quoteConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse>(invoke2, request2);
    const request3 = contentArticleApprovalServiceApi.RejectArticleRequest.fromPartial({
      article: { audit: { updatedBy: (reply1?.metricSeries?.audit?.updatedBy ?? "") } },
      context: req?.context,
    });
    const invoke3: Unary<contentArticleApprovalServiceApi.RejectArticleRequest, contentArticleApprovalServiceApi.RejectArticleResponse> =
      (input, done) => this.contentArticleApprovalClient.rejectArticle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<contentArticleApprovalServiceApi.RejectArticleResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockApprovalServiceApi.ApproveContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{
            location: {
              lines: ((reply1?.metricSeries?.locator?.$case === "address" ? reply1?.metricSeries?.locator.address : undefined)?.lines ?? []),
            },
          }],
          manager: { displayName: (reply1?.metricSeries?.owner?.displayName ?? "") },
        },
      }),
      contentContentBlockApprovalServiceApi.ApproveContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{
            manager: { displayName: (reply2?.consentRecord?.subject?.displayName ?? "") },
          }],
        },
        outcome: { message: (reply2?.result?.message ?? "") },
      }),
      contentContentBlockApprovalServiceApi.ApproveContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{ location: { region: (reply3?.article?.billingAddress?.region ?? "") } }],
        },
      }),
      contentContentBlockApprovalServiceApi.ApproveContentBlockResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          parentId: (req?.contentBlock?.parentId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a content block.
   */
  async commentContentBlockApproval(req: contentContentBlockApprovalServiceApi.CommentContentBlockApprovalRequest): Promise<contentContentBlockApprovalServiceApi.CommentContentBlockApprovalResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "CommentContentBlockApproval", req);
    this.logger.info("comment_content_block_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserValidationServiceApi.LintUsersRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.contentBlock?.manager?.email ?? "") } },
      user: {
        audit: { createdBy: (req?.contentBlock?.audit?.createdBy ?? "") },
        primaryAddress: { recipient: (req?.contentBlock?.location?.recipient ?? "") },
        relationshipManager: { userId: (req?.contentBlock?.manager?.userId ?? "") },
      },
    });
    const invoke1: Unary<identityUserValidationServiceApi.LintUsersRequest, identityUserValidationServiceApi.LintUsersResponse> =
      (input, done) => this.identityUserValidationClient.lintUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = contentArticleApprovalServiceApi.SubmitArticleRequest.fromPartial({
      article: {
        billingAddress: { countryCode: (req?.contentBlock?.location?.countryCode ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<contentArticleApprovalServiceApi.SubmitArticleRequest, contentArticleApprovalServiceApi.SubmitArticleResponse> =
      (input, done) => this.contentArticleApprovalClient.submitArticle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = notificationsNotificationQueryServiceApi.CountNotificationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.article?.issuedAt,
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (req?.contentBlock?.location?.region ?? ""),
      },
    });
    const method3 = "countNotifications" as const;
    const invoke3: Unary<notificationsNotificationQueryServiceApi.CountNotificationsRequest, notificationsNotificationQueryServiceApi.CountNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationQueryServiceApi.CountNotificationsRequest, notificationsNotificationQueryServiceApi.CountNotificationsResponse>(invoke3, request3);
    const request4 = featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        audit: {
          updatedAt: reply2?.article?.audit?.updatedAt,
          updatedBy: (reply1?.user?.audit?.updatedBy ?? ""),
        },
        owner: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const proxy4 = forwarding(this.featureflagsFeatureFlagValidationClient);
    const invoke4: Unary<featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagResponse> =
      (input, done) => proxy4.normalizeFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockApprovalServiceApi.CommentContentBlockApprovalResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{ location: { region: (reply1?.user?.primaryAddress?.region ?? "") } }],
          }],
          location: { countryCode: (reply1?.user?.primaryAddress?.countryCode ?? "") },
        },
      }),
      contentContentBlockApprovalServiceApi.CommentContentBlockApprovalResponse.fromPartial({
        contentBlock: {
          children: [{ audit: { updatedBy: (reply2?.article?.audit?.updatedBy ?? "") } }],
        },
      }),
      contentContentBlockApprovalServiceApi.CommentContentBlockApprovalResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      contentContentBlockApprovalServiceApi.CommentContentBlockApprovalResponse.fromPartial({ result: { status: (reply4?.outcome?.status ?? "") } }),
      contentContentBlockApprovalServiceApi.CommentContentBlockApprovalResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          name: (req?.contentBlock?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a content block.
   */
  async delegateContentBlockApproval(req: contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalRequest): Promise<contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "DelegateContentBlockApproval", req);
    this.logger.info("delegate_content_block_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerCalculationServiceApi.SimulateCustomerRequest.fromPartial({
      context: req?.context,
      customer: {
        primaryAddress: { region: (req?.contentBlock?.location?.region ?? "") },
        relationshipManager: { email: (req?.contentBlock?.manager?.email ?? "") },
      },
    });
    const invoke1: Unary<customersCustomerCalculationServiceApi.SimulateCustomerRequest, customersCustomerCalculationServiceApi.SimulateCustomerResponse> =
      (input, done) => this.customersCustomerCalculationClient.simulateCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerCalculationServiceApi.SimulateCustomerRequest, customersCustomerCalculationServiceApi.SimulateCustomerResponse>(invoke1, request1);
    const request2 = ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
      ledgerAccount: {
        audit: { updatedBy: (req?.contentBlock?.audit?.updatedBy ?? "") },
        holder: { displayName: (req?.contentBlock?.manager?.displayName ?? "") },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.validateLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest.fromPartial({
      contentRevision: {
        subject: { displayName: (input3?.details?.approver?.displayName ?? "") },
      },
      context: input3?.context,
      details: {
        destination: {
          countryCode: (input3?.contentBlock?.location?.countryCode ?? ""),
          postalCode: (input3?.contentBlock?.location?.postalCode ?? ""),
        },
      },
    });
    const invoke3: Unary<contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest, contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.recalculateContentRevisions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest, contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsResponse>(invoke3, request3);
    const request4 = customersHouseholdCalculationServiceApi.EstimateHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{ audit: { createdAt: req?.contentBlock?.audit?.createdAt } }],
        }],
      },
    });
    const cloned4: customersHouseholdCalculationServiceApi.EstimateHouseholdRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<customersHouseholdCalculationServiceApi.EstimateHouseholdRequest, customersHouseholdCalculationServiceApi.EstimateHouseholdResponse> =
      (input, done) => this.customersHouseholdCalculationClient.estimateHousehold(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersHouseholdCalculationServiceApi.EstimateHouseholdRequest, customersHouseholdCalculationServiceApi.EstimateHouseholdResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalResponse.fromPartial({
        contentBlock: {
          audit: { etag: (reply1?.customer?.audit?.etag ?? "") },
          children: [{ audit: { updatedAt: reply1?.customer?.audit?.updatedAt } }],
        },
      }),
      contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{ audit: { etag: (reply2?.ledgerAccount?.audit?.etag ?? "") } }],
          }],
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalResponse.fromPartial({
        contentBlock: {
          children: [{ attributes: (reply3?.contentRevision?.attributes ?? {}) }],
        },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalResponse.fromPartial({
        contentBlock: {
          children: [{ children: [{ manager: reply4?.household?.manager }] }],
          location: { recipient: (reply4?.household?.location?.recipient ?? "") },
        },
      }),
      contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalResponse.fromPartial({
        contentBlock: {
          attributes: (req?.contentBlock?.attributes ?? {}),
          contentBlockId: (req?.contentBlockId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a content block.
   */
  async escalateContentBlock(req: contentContentBlockApprovalServiceApi.EscalateContentBlockRequest): Promise<contentContentBlockApprovalServiceApi.EscalateContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "EscalateContentBlock", req);
    this.logger.info("escalate_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: { createdAt: req?.contentBlock?.audit?.createdAt },
        owner: { displayName: (req?.contentBlock?.manager?.displayName ?? "") },
      },
    });
    const decoded1 = notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest.toJSON(request1))),
    );
    const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest, notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient.explainSubscriptionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest, notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationResponse>(invoke1, decoded1);
    const request2 = contentArticleValidationServiceApi.LintArticlesRequest.fromPartial({
      article: {
        audit: { createdBy: (reply1?.subscription?.audit?.createdBy ?? "") },
        billingAddress: {
          lines: (req?.contentBlock?.location?.lines ?? []).map((value) => value),
          postalCode: (req?.contentBlock?.location?.postalCode ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { email: (req?.contentBlock?.manager?.email ?? "") } },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.content.v1.LintArticlesRequest",
      value: Buffer.from(contentArticleValidationServiceApi.LintArticlesRequest.encode(request2).finish()),
    });
    const unpacked2 = contentArticleValidationServiceApi.LintArticlesRequest.decode(envelope2.value);
    const invoke2: Unary<contentArticleValidationServiceApi.LintArticlesRequest, contentArticleValidationServiceApi.LintArticlesResponse> =
      (input, done) => this.contentArticleValidationClient.lintArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentArticleValidationServiceApi.LintArticlesRequest, contentArticleValidationServiceApi.LintArticlesResponse>(invoke2, unpacked2);
    let selected3_1: string | undefined;
    switch (reply1?.subscription?.action?.$case) {
      case "block":
        selected3_1 = ((reply1?.subscription?.action?.$case === "block" ? reply1?.subscription?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest.fromPartial({
      context: req?.context,
      preference: {
        action: { $case: "block", block: { reason: (selected3_1 ?? "") } },
        owner: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const invoke3: Unary<customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest, customersPreferenceValidationServiceApi.ExplainPreferenceDecisionResponse> =
      (input, done) => this.customersPreferenceValidationClient.explainPreferenceDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest, customersPreferenceValidationServiceApi.ExplainPreferenceDecisionResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockApprovalServiceApi.EscalateContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{ audit: { createdAt: reply1?.subscription?.audit?.createdAt } }],
        },
      }),
      contentContentBlockApprovalServiceApi.EscalateContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{
              location: {
                locality: (reply2?.article?.billingAddress?.locality ?? ""),
                recipient: (reply2?.article?.billingAddress?.recipient ?? ""),
              },
            }],
          }],
        },
      }),
      contentContentBlockApprovalServiceApi.EscalateContentBlockResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      contentContentBlockApprovalServiceApi.EscalateContentBlockResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          status: req?.contentBlock?.status,
        },
      }),
    );
  }

  /**
   * Returns a content block.
   */
  async getContentBlockApprovalStatus(req: contentContentBlockApprovalServiceApi.GetContentBlockApprovalStatusRequest): Promise<contentContentBlockApprovalServiceApi.GetContentBlockApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.contentBlockId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "content_block_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetContentBlockApprovalStatus", req);
    this.logger.info("get_content_block_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldWorkflowServiceApi.ListFormFieldWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.contentBlockId ?? ""),
      },
    });
    const invoke1: Unary<formsFormFieldWorkflowServiceApi.ListFormFieldWorkflowsRequest, formsFormFieldWorkflowServiceApi.ListFormFieldWorkflowsResponse> =
      (input, done) => this.formsFormFieldWorkflowClient.listFormFieldWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<formsFormFieldWorkflowServiceApi.ListFormFieldWorkflowsRequest, formsFormFieldWorkflowServiceApi.ListFormFieldWorkflowsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = communityPostApprovalServiceApi.DelegatePostApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<communityPostApprovalServiceApi.DelegatePostApprovalRequest, communityPostApprovalServiceApi.DelegatePostApprovalResponse> =
      (input, done) => this.communityPostApprovalClient.delegatePostApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<communityPostApprovalServiceApi.DelegatePostApprovalRequest, communityPostApprovalServiceApi.DelegatePostApprovalResponse>(invoke2, request2));
    return mergeResponses(
      contentContentBlockApprovalServiceApi.GetContentBlockApprovalStatusResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      contentContentBlockApprovalServiceApi.GetContentBlockApprovalStatusResponse.fromPartial({
        contentBlock: {
          children: [{
            location: { recipient: (reply2?.post?.billingAddress?.recipient ?? "") },
          }],
        },
      }),
      contentContentBlockApprovalServiceApi.GetContentBlockApprovalStatusResponse.fromPartial({ contentBlock: { contentBlockId: (req?.contentBlockId ?? "") } }),
    );
  }

  /**
   * Lists content blocks a page at a time.
   */
  async listPendingContentBlocks(req: contentContentBlockApprovalServiceApi.ListPendingContentBlocksRequest): Promise<contentContentBlockApprovalServiceApi.ListPendingContentBlocksResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingContentBlocks", req);
    this.logger.info("list_pending_content_blocks", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockValidationServiceApi.PreviewContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            location: { region: (req?.filter?.region ?? "") },
            manager: { email: (req?.context?.actor?.email ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockValidationServiceApi.PreviewContentBlockRequest, contentContentBlockValidationServiceApi.PreviewContentBlockResponse> =
      (input, done) => this.contentContentBlockValidationClient.previewContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ListPendingContentBlocks.PreviewContentBlock", () => call<contentContentBlockValidationServiceApi.PreviewContentBlockRequest, contentContentBlockValidationServiceApi.PreviewContentBlockResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentContentBlockApprovalServiceApi.ListPendingContentBlocksResponse.fromPartial({
      contentBlocks: [{
        children: [{
          children: [{ children: [{ manager: reply1?.contentBlock?.manager }] }],
        }],
      }],
    });
  }

  /**
   * Recalls a content block.
   */
  async recallContentBlock(req: contentContentBlockApprovalServiceApi.RecallContentBlockRequest): Promise<contentContentBlockApprovalServiceApi.RecallContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "RecallContentBlock", req);
    this.logger.info("recall_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockValidationServiceApi.ScoreContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          audit: { updatedBy: (req?.contentBlock?.audit?.updatedBy ?? "") },
          children: [{ location: { region: (req?.contentBlock?.location?.region ?? "") } }],
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockValidationServiceApi.ScoreContentBlockRequest, contentContentBlockValidationServiceApi.ScoreContentBlockResponse> =
      (input, done) => this.contentContentBlockValidationClient.scoreContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = contentArticleApprovalServiceApi.ApproveArticleRequest.fromPartial({
      article: {
        billingAddress: {
          lines: (reply1?.contentBlock?.location?.lines ?? []).map((value) => value),
          locality: (reply1?.contentBlock?.location?.locality ?? ""),
        },
      },
      context: req?.context,
      details: { approver: { userId: (reply1?.contentBlock?.manager?.userId ?? "") } },
    });
    const reply2 = await this.workQueue.enqueue<contentArticleApprovalServiceApi.ApproveArticleRequest, contentArticleApprovalServiceApi.ApproveArticleResponse>(
      "acme.content.v1.ContentBlockApprovalService/RecallContentBlock:1", request2,
    );
    const request3 = customersCustomerValidationServiceApi.LintCustomersRequest.fromPartial({
      context: req?.context,
      customer: {
        audit: { createdAt: reply2?.article?.audit?.createdAt },
        relationshipManager: { displayName: (reply2?.article?.counterparty?.displayName ?? "") },
      },
    });
    const invoke3: Unary<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse> =
      (input, done) => this.customersCustomerValidationClient.lintCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse>(invoke3, request3));
    const request4 = contentArticleQueryServiceApi.ResolveArticlesRequest.fromPartial({ context: req?.context });
    const invoke4: Unary<contentArticleQueryServiceApi.ResolveArticlesRequest, contentArticleQueryServiceApi.ResolveArticlesResponse> =
      (input, done) => this.contentArticleQueryClient.resolveArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<contentArticleQueryServiceApi.ResolveArticlesResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockApprovalServiceApi.RecallContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{
              audit: { etag: (reply1?.contentBlock?.audit?.etag ?? "") },
              location: reply1?.contentBlock?.location,
            }],
          }],
        },
      }),
      contentContentBlockApprovalServiceApi.RecallContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{
              manager: { displayName: (reply2?.article?.counterparty?.displayName ?? "") },
            }],
          }],
        },
      }),
      contentContentBlockApprovalServiceApi.RecallContentBlockResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      contentContentBlockApprovalServiceApi.RecallContentBlockResponse.fromPartial({
        outcome: { message: (reply4?.result?.message ?? "") },
        result: { referenceIds: (reply4?.result?.referenceIds ?? []) },
      }),
      contentContentBlockApprovalServiceApi.RecallContentBlockResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          manager: req?.contentBlock?.manager,
        },
      }),
    );
  }

  /**
   * Rejects a content block.
   */
  async rejectContentBlock(req: contentContentBlockApprovalServiceApi.RejectContentBlockRequest): Promise<contentContentBlockApprovalServiceApi.RejectContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "RejectContentBlock", req);
    this.logger.info("reject_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (req?.contentBlock?.location?.locality ?? ""),
          postalCode: (req?.contentBlock?.location?.postalCode ?? ""),
          recipient: (req?.contentBlock?.location?.recipient ?? ""),
          region: (req?.contentBlock?.location?.region ?? ""),
        },
      },
    });
    const invoke1: Unary<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.compareContentRevisionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = contentContentBlockQueryServiceApi.BrowseContentBlocksRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.contentRevision?.occurredAt,
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (req?.contentBlock?.location?.region ?? ""),
      },
    });
    const invoke2: Unary<contentContentBlockQueryServiceApi.BrowseContentBlocksRequest, contentContentBlockQueryServiceApi.BrowseContentBlocksResponse> =
      (input, done) => this.contentContentBlockQueryClient.browseContentBlocks(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockApprovalServiceApi.RejectContentBlockResponse.fromPartial({
        contentBlock: {
          manager: { displayName: (reply1?.contentRevision?.subject?.displayName ?? "") },
        },
      }),
      contentContentBlockApprovalServiceApi.RejectContentBlockResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      contentContentBlockApprovalServiceApi.RejectContentBlockResponse.fromPartial({
        contentBlock: { contentBlockId: (req?.contentBlockId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Submits a content block.
   */
  async submitContentBlock(req: contentContentBlockApprovalServiceApi.SubmitContentBlockRequest): Promise<contentContentBlockApprovalServiceApi.SubmitContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "SubmitContentBlock", req);
    this.logger.info("submit_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleValidationServiceApi.ExplainArticleDecisionRequest.fromPartial({
      article: {
        counterparty: { displayName: (req?.contentBlock?.manager?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
    });
    const method1 = "explainArticleDecision" as const;
    const invoke1: Unary<contentArticleValidationServiceApi.ExplainArticleDecisionRequest, contentArticleValidationServiceApi.ExplainArticleDecisionResponse> =
      (input, done) => this.contentArticleValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentArticleValidationServiceApi.ExplainArticleDecisionRequest, contentArticleValidationServiceApi.ExplainArticleDecisionResponse>(invoke1, request1);
    const request2 = identityUserValidationServiceApi.NormalizeUserRequest.fromPartial({
      context: req?.context,
      user: {
        audit: { updatedAt: reply1?.article?.audit?.updatedAt },
        relationshipManager: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const proxy2 = forwarding(this.identityUserValidationClient);
    const invoke2: Unary<identityUserValidationServiceApi.NormalizeUserRequest, identityUserValidationServiceApi.NormalizeUserResponse> =
      (input, done) => proxy2.normalizeUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserValidationServiceApi.NormalizeUserRequest, identityUserValidationServiceApi.NormalizeUserResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockApprovalServiceApi.SubmitContentBlockResponse.fromPartial({ outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) } }),
      contentContentBlockApprovalServiceApi.SubmitContentBlockResponse.fromPartial({
        contentBlock: {
          location: { countryCode: (reply2?.user?.primaryAddress?.countryCode ?? "") },
        },
      }),
      contentContentBlockApprovalServiceApi.SubmitContentBlockResponse.fromPartial({
        contentBlock: {
          attributes: (req?.contentBlock?.attributes ?? {}),
          contentBlockId: (req?.contentBlockId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ContentBlockApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ContentBlockApprovalHandler {
  constructor(@inject(ContentBlockApprovalWorkflow) private readonly workflow: ContentBlockApprovalWorkflow) {}

  /**
   * Approves a content block.
   */
  approveContentBlock = unary<contentContentBlockApprovalServiceApi.ApproveContentBlockRequest, contentContentBlockApprovalServiceApi.ApproveContentBlockResponse>(
    (request) => this.workflow.approveContentBlock(request),
  );

  /**
   * Comments a content block.
   */
  commentContentBlockApproval = unary<contentContentBlockApprovalServiceApi.CommentContentBlockApprovalRequest, contentContentBlockApprovalServiceApi.CommentContentBlockApprovalResponse>(
    (request) => this.workflow.commentContentBlockApproval(request),
  );

  /**
   * Delegates a content block.
   */
  delegateContentBlockApproval = (call: ServerUnaryCall<contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalRequest, contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalResponse>, done: sendUnaryData<contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalResponse>): void => {
    void this.workflow.delegateContentBlockApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a content block.
   */
  escalateContentBlock = unary<contentContentBlockApprovalServiceApi.EscalateContentBlockRequest, contentContentBlockApprovalServiceApi.EscalateContentBlockResponse>(
    (request) => this.workflow.escalateContentBlock(request),
  );

  /**
   * Returns a content block.
   */
  getContentBlockApprovalStatus = unary<contentContentBlockApprovalServiceApi.GetContentBlockApprovalStatusRequest, contentContentBlockApprovalServiceApi.GetContentBlockApprovalStatusResponse>(
    (request) => this.workflow.getContentBlockApprovalStatus(request),
  );

  /**
   * Lists content blocks a page at a time.
   */
  listPendingContentBlocks = (call: ServerUnaryCall<contentContentBlockApprovalServiceApi.ListPendingContentBlocksRequest, contentContentBlockApprovalServiceApi.ListPendingContentBlocksResponse>, done: sendUnaryData<contentContentBlockApprovalServiceApi.ListPendingContentBlocksResponse>): void => {
    void this.workflow.listPendingContentBlocks(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a content block.
   */
  recallContentBlock = unary<contentContentBlockApprovalServiceApi.RecallContentBlockRequest, contentContentBlockApprovalServiceApi.RecallContentBlockResponse>(
    (request) => this.workflow.recallContentBlock(request),
  );

  /**
   * Rejects a content block.
   */
  rejectContentBlock = unary<contentContentBlockApprovalServiceApi.RejectContentBlockRequest, contentContentBlockApprovalServiceApi.RejectContentBlockResponse>(
    (request) => this.workflow.rejectContentBlock(request),
  );

  /**
   * Submits a content block.
   */
  submitContentBlock = (call: ServerUnaryCall<contentContentBlockApprovalServiceApi.SubmitContentBlockRequest, contentContentBlockApprovalServiceApi.SubmitContentBlockResponse>, done: sendUnaryData<contentContentBlockApprovalServiceApi.SubmitContentBlockResponse>): void => {
    void this.workflow.submitContentBlock(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ContentBlockApprovalHandler): contentContentBlockApprovalServiceApi.ContentBlockApprovalServiceServer {
  return {
    approveContentBlock: handler.approveContentBlock,
    commentContentBlockApproval: handler.commentContentBlockApproval,
    delegateContentBlockApproval: handler.delegateContentBlockApproval,
    escalateContentBlock: handler.escalateContentBlock,
    getContentBlockApprovalStatus: handler.getContentBlockApprovalStatus,
    listPendingContentBlocks: handler.listPendingContentBlocks,
    recallContentBlock: handler.recallContentBlock,
    rejectContentBlock: handler.rejectContentBlock,
    submitContentBlock: handler.submitContentBlock,
  };
}
