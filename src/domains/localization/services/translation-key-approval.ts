/**
 * Routes translation keys through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as localizationLocaleQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as routingRouteServiceApi from "../../../../.cache/proto/acme/routing/v1/route_service.js";
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
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTranslationKeyRecord } from "../data/records.js";
import { LocalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation key operations and persist audit data.
 */
@injectable()
export class TranslationKeyApprovalWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdCalculationService") private readonly customersHouseholdCalculationClient: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleCalculationService") private readonly localizationLocaleCalculationClient: localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleQueryService") private readonly localizationLocaleQueryClient: localizationLocaleQueryServiceApi.LocaleQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobReportingService") private readonly localizationTranslationJobReportingClient: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyValidationService") private readonly localizationTranslationKeyValidationClient: localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionHistoryService") private readonly notificationsSubscriptionHistoryClient: notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient,
    @inject("grpc:acme.routing.v1.RouteService") private readonly routingRouteClient: routingRouteServiceApi.RouteServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a translation key.
   */
  async approveTranslationKey(req: localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyRequest): Promise<localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "ApproveTranslationKey", req);
    this.logger.info("approve_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobReportingServiceApi.ListTranslationJobReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? ""),
      },
    });
    const proxy1 = forwarding(this.localizationTranslationJobReportingClient);
    const invoke1: Unary<localizationTranslationJobReportingServiceApi.ListTranslationJobReportsRequest, localizationTranslationJobReportingServiceApi.ListTranslationJobReportsResponse> =
      (input, done) => proxy1.listTranslationJobReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobReportingServiceApi.ListTranslationJobReportsRequest, localizationTranslationJobReportingServiceApi.ListTranslationJobReportsResponse>(invoke1, request1);
    const request2 = customersCustomerQueryServiceApi.SummarizeCustomersRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<customersCustomerQueryServiceApi.SummarizeCustomersRequest, customersCustomerQueryServiceApi.SummarizeCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient.summarizeCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersCustomerQueryServiceApi.SummarizeCustomersRequest, customersCustomerQueryServiceApi.SummarizeCustomersResponse>(invoke2, request2);
    const request3 = notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
        region: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? ""),
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsResponse> =
      (input, done) => this.notificationsSubscriptionHistoryClient.listSubscriptionVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyResponse.fromPartial({
        translationKey: {
          name: (req?.translationKey?.name ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a translation key.
   */
  async commentTranslationKeyApproval(req: localizationTranslationKeyApprovalServiceApi.CommentTranslationKeyApprovalRequest): Promise<localizationTranslationKeyApprovalServiceApi.CommentTranslationKeyApprovalResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "CommentTranslationKeyApproval", req);
    this.logger.info("comment_translation_key_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = localizationLocaleCalculationServiceApi.ExplainLocaleCalculationRequest.fromPartial({
      context: input1?.context,
      details: { contact: { email: (input1?.details?.approver?.email ?? "") } },
      locale: {
        audit: {
          createdAt: input1?.translationKey?.audit?.createdAt,
          updatedBy: (input1?.translationKey?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke1: Unary<localizationLocaleCalculationServiceApi.ExplainLocaleCalculationRequest, localizationLocaleCalculationServiceApi.ExplainLocaleCalculationResponse> =
      (input, done) => this.localizationLocaleCalculationClient.explainLocaleCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleCalculationServiceApi.ExplainLocaleCalculationRequest, localizationLocaleCalculationServiceApi.ExplainLocaleCalculationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyApprovalServiceApi.CommentTranslationKeyApprovalResponse.fromPartial({
        result: { message: (reply1?.outcome?.message ?? "") },
        translationKey: {
          components: { primary: { description: (reply1?.locale?.description ?? "") } },
        },
      }),
      localizationTranslationKeyApprovalServiceApi.CommentTranslationKeyApprovalResponse.fromPartial({
        translationKey: {
          specs: (req?.translationKey?.specs ?? {}),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a translation key.
   */
  async delegateTranslationKeyApproval(req: localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalRequest): Promise<localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "DelegateTranslationKeyApproval", req);
    this.logger.info("delegate_translation_key_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.fromPartial({
      context: req?.context,
      translationKey: { audit: { updatedAt: req?.translationKey?.audit?.updatedAt } },
    });
    const cloned1: localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.recalculateTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse>(invoke1, cloned1);
    const request2 = localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest.fromPartial({
      context: req?.context,
      translationJob: {
        origin: { $case: "customer", customer: { email: (req?.translationKey?.owner?.email ?? "") } },
      },
    });
    const decoded2 = localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest.fromJSON(
      JSON.parse(JSON.stringify(localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest.toJSON(request2))),
    );
    const invoke2: Unary<localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest, localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.recalculateTranslationJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest, localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse>(invoke2, decoded2);
    const request3 = customersHouseholdQueryServiceApi.SummarizeHouseholdsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.SummarizeHouseholdsRequest",
      value: Buffer.from(customersHouseholdQueryServiceApi.SummarizeHouseholdsRequest.encode(request3).finish()),
    });
    const unpacked3 = customersHouseholdQueryServiceApi.SummarizeHouseholdsRequest.decode(envelope3.value);
    const invoke3: Unary<customersHouseholdQueryServiceApi.SummarizeHouseholdsRequest, customersHouseholdQueryServiceApi.SummarizeHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.summarizeHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersHouseholdQueryServiceApi.SummarizeHouseholdsRequest, customersHouseholdQueryServiceApi.SummarizeHouseholdsResponse>(invoke3, unpacked3);
    let selected4_1: string | undefined;
    switch (reply1?.translationKey?.locator?.$case) {
      case "address":
        selected4_1 = ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = auditAuditEventServiceApi.SearchAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: { region: (selected4_1 ?? "") },
    });
    const invoke4: Unary<auditAuditEventServiceApi.SearchAuditEventsRequest, auditAuditEventServiceApi.SearchAuditEventsResponse> =
      (input, done) => this.auditAuditEventClient.searchAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<auditAuditEventServiceApi.SearchAuditEventsRequest, auditAuditEventServiceApi.SearchAuditEventsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse.fromPartial({
        translationKey: {
          audit: { etag: (reply1?.translationKey?.audit?.etag ?? "") },
          owner: { displayName: (reply1?.translationKey?.owner?.displayName ?? "") },
        },
      }),
      localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse.fromPartial({
        translationKey: {
          audit: { updatedAt: reply2?.translationJob?.audit?.updatedAt },
          owner: {
            email: ((reply2?.translationJob?.origin?.$case === "customer" ? reply2?.translationJob?.origin.customer : undefined)?.email ?? ""),
          },
        },
      }),
      localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse.fromPartial({ outcome: { message: (reply3?.result?.message ?? "") } }),
      localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse.fromPartial({
        outcome: { status: (reply4?.result?.status ?? "") },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse.fromPartial({
        translationKey: {
          code: (req?.translationKey?.code ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a translation key.
   */
  async escalateTranslationKey(req: localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyRequest): Promise<localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "EscalateTranslationKey", req);
    this.logger.info("escalate_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.translationKey?.owner?.email ?? "") } },
      preference: {
        audit: {
          createdBy: (req?.translationKey?.audit?.createdBy ?? ""),
          updatedAt: req?.translationKey?.audit?.updatedAt,
        },
      },
    });
    const invoke1: Unary<customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest, customersPreferenceValidationServiceApi.ExplainPreferenceDecisionResponse> =
      (input, done) => this.customersPreferenceValidationClient.explainPreferenceDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest, customersPreferenceValidationServiceApi.ExplainPreferenceDecisionResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.resolveAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesResponse>(invoke2, request2));
    let selected3_2: string | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected3_2 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected3_2 = "";
    }
    const request3 = localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.translationKey?.owner?.email ?? "") } },
      translationKey: {
        locator: { $case: "address", address: { postalCode: (selected3_2 ?? "") } },
        audit: { updatedAt: req?.translationKey?.audit?.updatedAt },
      },
    });
    const invoke3: Unary<localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyValidationClient.validateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.ValidateTranslationKeyResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyResponse.fromPartial({
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
        translationKey: { audit: { updatedAt: reply1?.preference?.audit?.updatedAt } },
      }),
      localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyResponse.fromPartial({
        result: { status: (reply3?.outcome?.status ?? "") },
        translationKey: {
          owner: { displayName: (reply3?.translationKey?.owner?.displayName ?? "") },
        },
      }),
      localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyResponse.fromPartial({
        translationKey: {
          specs: (req?.translationKey?.specs ?? {}),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a translation key.
   */
  async getTranslationKeyApprovalStatus(req: localizationTranslationKeyApprovalServiceApi.GetTranslationKeyApprovalStatusRequest): Promise<localizationTranslationKeyApprovalServiceApi.GetTranslationKeyApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.translationKeyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_key_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranslationKeyApprovalStatus", req);
    this.logger.info("get_translation_key_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentValidationServiceApi.CheckCustomerSegmentEligibilityRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: { updatedAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      details: { locale: (req?.context?.locale ?? "") },
    });
    const invoke1: Unary<customersCustomerSegmentValidationServiceApi.CheckCustomerSegmentEligibilityRequest, customersCustomerSegmentValidationServiceApi.CheckCustomerSegmentEligibilityResponse> =
      (input, done) => this.customersCustomerSegmentValidationClient.checkCustomerSegmentEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = localizationTranslationJobCalculationServiceApi.EstimateTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: { email: (reply1?.customerSegment?.owner?.email ?? "") },
        audit: { updatedAt: reply1?.customerSegment?.audit?.updatedAt },
      },
    });
    const reply2 = await this.workQueue.enqueue<localizationTranslationJobCalculationServiceApi.EstimateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.EstimateTranslationJobResponse>(
      "acme.localization.v1.TranslationKeyApprovalService/GetTranslationKeyApprovalStatus:1", request2,
    );
    return mergeResponses(
      localizationTranslationKeyApprovalServiceApi.GetTranslationKeyApprovalStatusResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      localizationTranslationKeyApprovalServiceApi.GetTranslationKeyApprovalStatusResponse.fromPartial({
        result: { message: (reply2?.result?.message ?? "") },
        translationKey: { owner: { email: (reply2?.translationJob?.assignee?.email ?? "") } },
      }),
      localizationTranslationKeyApprovalServiceApi.GetTranslationKeyApprovalStatusResponse.fromPartial({ translationKey: { translationKeyId: (req?.translationKeyId ?? "") } }),
    );
  }

  /**
   * Lists translation keys a page at a time.
   */
  async listPendingTranslationKeys(req: localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysRequest): Promise<localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingTranslationKeys", req);
    this.logger.info("list_pending_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysResponse.fromPartial({});
  }

  /**
   * Recalls a translation key.
   */
  async recallTranslationKey(req: localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyRequest): Promise<localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "RecallTranslationKey", req);
    this.logger.info("recall_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = routingRouteServiceApi.CloneRouteRequest.fromPartial({
      context: req?.context,
      route: { audit: { updatedBy: (req?.translationKey?.audit?.updatedBy ?? "") } },
    });
    const invoke1: Unary<routingRouteServiceApi.CloneRouteRequest, routingRouteServiceApi.CloneRouteResponse> =
      (input, done) => this.routingRouteClient.cloneRoute(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<routingRouteServiceApi.CloneRouteRequest, routingRouteServiceApi.CloneRouteResponse>(invoke1, request1));
    const request2 = communityForumWorkflowServiceApi.SignalForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            location: {
              lines: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.lines ?? []).map((value) => value),
            },
          }],
        }],
      },
    });
    const invoke2: Unary<communityForumWorkflowServiceApi.SignalForumWorkflowRequest, communityForumWorkflowServiceApi.SignalForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.signalForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<communityForumWorkflowServiceApi.SignalForumWorkflowResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            location: {
              locality: (reply2?.forum?.location?.locality ?? ""),
              region: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? ""),
            },
          }],
        }],
      },
    });
    const invoke3: Unary<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse> =
      (input, done) => this.customersHouseholdCalculationClient.explainHouseholdCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    const request4 = communityForumWorkflowServiceApi.PauseForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            manager: {
              displayName: (req?.details?.approver?.displayName ?? ""),
              email: (reply2?.forum?.manager?.email ?? ""),
            },
          }],
        }],
      },
    });
    const invoke4: Unary<communityForumWorkflowServiceApi.PauseForumWorkflowRequest, communityForumWorkflowServiceApi.PauseForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.pauseForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke4 = promisify(invoke4);
    const reply4 = requireReply(await asyncInvoke4(request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyResponse.fromPartial({
        translationKey: { audit: { createdBy: (reply2?.forum?.audit?.createdBy ?? "") } },
      }),
      localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyResponse.fromPartial({
        outcome: { referenceId: (reply4?.outcome?.referenceId ?? "") },
        result: { status: (reply4?.outcome?.status ?? "") },
      }),
      localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyResponse.fromPartial({
        translationKey: {
          status: req?.translationKey?.status,
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a translation key.
   */
  async rejectTranslationKey(req: localizationTranslationKeyApprovalServiceApi.RejectTranslationKeyRequest): Promise<localizationTranslationKeyApprovalServiceApi.RejectTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "RejectTranslationKey", req);
    this.logger.info("reject_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? ""),
      },
      since: req?.translationKey?.audit?.createdAt,
      subscriber: { email: (req?.details?.approver?.email ?? "") },
    });
    const stream1 = this.notificationsDeliveryAttemptNotificationClient.streamDeliveryAttemptNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesResponse.fromPartial({});
    const request2 = customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: { createdAt: req?.translationKey?.audit?.createdAt },
            location: {
              locality: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.locality ?? ""),
            },
            manager: { email: (req?.details?.approver?.email ?? "") },
          }],
          manager: { userId: (req?.details?.approver?.userId ?? "") },
        }],
      },
    });
    const method2 = "explainHouseholdCalculation" as const;
    const invoke2: Unary<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse> =
      (input, done) => this.customersHouseholdCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse>(invoke2, request2);
    const request3 = localizationLocaleQueryServiceApi.FindLocalesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.household?.audit?.createdAt,
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (reply2?.household?.location?.region ?? ""),
      },
    });
    const proxy3 = forwarding(this.localizationLocaleQueryClient);
    const invoke3: Unary<localizationLocaleQueryServiceApi.FindLocalesRequest, localizationLocaleQueryServiceApi.FindLocalesResponse> =
      (input, done) => proxy3.findLocales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationLocaleQueryServiceApi.FindLocalesRequest, localizationLocaleQueryServiceApi.FindLocalesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyApprovalServiceApi.RejectTranslationKeyResponse.fromPartial({
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
        translationKey: { audit: { createdBy: (reply2?.household?.audit?.createdBy ?? "") } },
      }),
      localizationTranslationKeyApprovalServiceApi.RejectTranslationKeyResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      localizationTranslationKeyApprovalServiceApi.RejectTranslationKeyResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        translationKey: { translationKeyId: (req?.translationKeyId ?? "") },
      }),
    );
  }

  /**
   * Submits a translation key.
   */
  async submitTranslationKey(req: localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest): Promise<localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "SubmitTranslationKey", req);
    this.logger.info("submit_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: Array<string> | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected1_2 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.lines ?? []);
        break;
      default:
        selected1_2 = [];
    }
    let selected1_3: string | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected1_3 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = customersHouseholdCalculationServiceApi.CompareHouseholdOptionsRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: { updatedAt: req?.translationKey?.audit?.updatedAt },
            location: {
              countryCode: (selected1_3 ?? ""),
              lines: (selected1_2 ?? []),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<customersHouseholdCalculationServiceApi.CompareHouseholdOptionsRequest, customersHouseholdCalculationServiceApi.CompareHouseholdOptionsResponse> =
      (input, done) => this.customersHouseholdCalculationClient.compareHouseholdOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersHouseholdCalculationServiceApi.CompareHouseholdOptionsRequest, customersHouseholdCalculationServiceApi.CompareHouseholdOptionsResponse>(invoke1, request1);
    const request2 = communityForumWorkflowServiceApi.StartForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            location: {
              recipient: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.recipient ?? ""),
            },
          }],
        }],
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityForumWorkflowServiceApi.StartForumWorkflowRequest, communityForumWorkflowServiceApi.StartForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.startForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumWorkflowServiceApi.StartForumWorkflowRequest, communityForumWorkflowServiceApi.StartForumWorkflowResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = localizationTranslationJobReportingServiceApi.ShareTranslationJobReportRequest.fromPartial({
      context: input3?.context,
      details: { recipient: { email: (input3?.translationKey?.owner?.email ?? "") } },
    });
    const invoke3: Unary<localizationTranslationJobReportingServiceApi.ShareTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ShareTranslationJobReportResponse> =
      (input, done) => this.localizationTranslationJobReportingClient.shareTranslationJobReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationJobReportingServiceApi.ShareTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ShareTranslationJobReportResponse>(invoke3, request3);
    const request4 = authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.household?.location?.region ?? "") },
    });
    const cloned4: authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.countAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse.fromPartial({
        result: { details: (reply1?.result?.details ?? {}) },
        translationKey: { audit: { updatedBy: (reply1?.household?.audit?.updatedBy ?? "") } },
      }),
      localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        translationKey: { name: (reply2?.forum?.name ?? "") },
      }),
      localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse.fromPartial({ outcome: { message: (reply3?.outcome?.message ?? "") } }),
      localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse.fromPartial({
        translationKey: {
          code: (req?.translationKey?.code ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for TranslationKeyApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationKeyApprovalHandler {
  constructor(@inject(TranslationKeyApprovalWorkflow) private readonly workflow: TranslationKeyApprovalWorkflow) {}

  /**
   * Approves a translation key.
   */
  approveTranslationKey = unary<localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyResponse>(
    (request) => this.workflow.approveTranslationKey(request),
  );

  /**
   * Comments a translation key.
   */
  commentTranslationKeyApproval = unary<localizationTranslationKeyApprovalServiceApi.CommentTranslationKeyApprovalRequest, localizationTranslationKeyApprovalServiceApi.CommentTranslationKeyApprovalResponse>(
    (request) => this.workflow.commentTranslationKeyApproval(request),
  );

  /**
   * Delegates a translation key.
   */
  delegateTranslationKeyApproval = (call: ServerUnaryCall<localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalRequest, localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse>, done: sendUnaryData<localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse>): void => {
    void this.workflow.delegateTranslationKeyApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a translation key.
   */
  escalateTranslationKey = unary<localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.EscalateTranslationKeyResponse>(
    (request) => this.workflow.escalateTranslationKey(request),
  );

  /**
   * Returns a translation key.
   */
  getTranslationKeyApprovalStatus = unary<localizationTranslationKeyApprovalServiceApi.GetTranslationKeyApprovalStatusRequest, localizationTranslationKeyApprovalServiceApi.GetTranslationKeyApprovalStatusResponse>(
    (request) => this.workflow.getTranslationKeyApprovalStatus(request),
  );

  /**
   * Lists translation keys a page at a time.
   */
  listPendingTranslationKeys = (call: ServerUnaryCall<localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysRequest, localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysResponse>, done: sendUnaryData<localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysResponse>): void => {
    void this.workflow.listPendingTranslationKeys(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a translation key.
   */
  recallTranslationKey = unary<localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyResponse>(
    (request) => this.workflow.recallTranslationKey(request),
  );

  /**
   * Rejects a translation key.
   */
  rejectTranslationKey = unary<localizationTranslationKeyApprovalServiceApi.RejectTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.RejectTranslationKeyResponse>(
    (request) => this.workflow.rejectTranslationKey(request),
  );

  /**
   * Submits a translation key.
   */
  submitTranslationKey = (call: ServerUnaryCall<localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse>, done: sendUnaryData<localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse>): void => {
    void this.workflow.submitTranslationKey(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: TranslationKeyApprovalHandler): localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceServer {
  return {
    approveTranslationKey: handler.approveTranslationKey,
    commentTranslationKeyApproval: handler.commentTranslationKeyApproval,
    delegateTranslationKeyApproval: handler.delegateTranslationKeyApproval,
    escalateTranslationKey: handler.escalateTranslationKey,
    getTranslationKeyApprovalStatus: handler.getTranslationKeyApprovalStatus,
    listPendingTranslationKeys: handler.listPendingTranslationKeys,
    recallTranslationKey: handler.recallTranslationKey,
    rejectTranslationKey: handler.rejectTranslationKey,
    submitTranslationKey: handler.submitTranslationKey,
  };
}
