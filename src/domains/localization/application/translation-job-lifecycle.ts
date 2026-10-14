/**
 * Moves a translation job between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as communityForumApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as communityModerationLifecycleServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_lifecycle_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationJobLifecycleServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_lifecycle_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTranslationJobRecord } from "../data/records.js";
import { LocalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation job operations and persist audit data.
 */
@injectable()
export class TranslationJobLifecycleWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.community.v1.ModerationLifecycleService") private readonly communityModerationLifecycleClient: communityModerationLifecycleServiceApi.ModerationLifecycleServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdCalculationService") private readonly customersHouseholdCalculationClient: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobReportingService") private readonly localizationTranslationJobReportingClient: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobValidationService") private readonly localizationTranslationJobValidationClient: localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyService") private readonly localizationTranslationKeyClient: localizationTranslationKeyServiceApi.TranslationKeyServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyValidationService") private readonly localizationTranslationKeyValidationClient: localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityApprovalService") private readonly personalizationAffinityApprovalClient: personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationWorkflowService") private readonly personalizationRecommendationWorkflowClient: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a translation job.
   */
  async activateTranslationJob(req: localizationTranslationJobLifecycleServiceApi.ActivateTranslationJobRequest): Promise<localizationTranslationJobLifecycleServiceApi.ActivateTranslationJobResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateTranslationJob", req);
    this.logger.info("activate_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            manager: {
              displayName: (req?.details?.newOwner?.displayName ?? ""),
              userId: (req?.details?.newOwner?.userId ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse> =
      (input, done) => this.customersHouseholdCalculationClient.explainHouseholdCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ActivateTranslationJob.ExplainHouseholdCalculation", () => call<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse>(invoke1, request1));
    const request2 = localizationLocaleValidationServiceApi.ExplainLocaleDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notifyContact?.email ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      locale: {
        owner: {
          displayName: (reply1?.household?.manager?.displayName ?? ""),
          email: (reply1?.household?.manager?.email ?? ""),
        },
      },
    });
    const invoke2: Unary<localizationLocaleValidationServiceApi.ExplainLocaleDecisionRequest, localizationLocaleValidationServiceApi.ExplainLocaleDecisionResponse> =
      (input, done) => this.localizationLocaleValidationClient.explainLocaleDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobLifecycleServiceApi.ActivateTranslationJobResponse.fromPartial({
        result: { message: (reply1?.result?.message ?? "") },
        translationJob: { requester: { email: (reply1?.household?.manager?.email ?? "") } },
      }),
      localizationTranslationJobLifecycleServiceApi.ActivateTranslationJobResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      localizationTranslationJobLifecycleServiceApi.ActivateTranslationJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        translationJob: { translationJobId: (req?.translationJobId ?? "") },
      }),
    );
  }

  /**
   * Expires a translation job.
   */
  async expireTranslationJob(req: localizationTranslationJobLifecycleServiceApi.ExpireTranslationJobRequest): Promise<localizationTranslationJobLifecycleServiceApi.ExpireTranslationJobResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireTranslationJob", req);
    this.logger.info("expire_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerCalculationServiceApi.RecalculateCustomersRequest.fromPartial({
      context: req?.context,
      customer: { contact: { email: (req?.details?.notifyContact?.email ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<customersCustomerCalculationServiceApi.RecalculateCustomersRequest, customersCustomerCalculationServiceApi.RecalculateCustomersResponse>(
      "acme.localization.v1.TranslationJobLifecycleService/ExpireTranslationJob:0", request1,
    );
    const request2 = auditAuditEventValidationServiceApi.LintAuditEventsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: reply1?.customer?.contact?.name,
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<auditAuditEventValidationServiceApi.LintAuditEventsRequest, auditAuditEventValidationServiceApi.LintAuditEventsResponse> =
      (input, done) => this.auditAuditEventValidationClient.lintAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<auditAuditEventValidationServiceApi.LintAuditEventsRequest, auditAuditEventValidationServiceApi.LintAuditEventsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobLifecycleServiceApi.ExpireTranslationJobResponse.fromPartial({
        translationJob: {
          assignee: { userId: (reply1?.customer?.relationshipManager?.userId ?? "") },
        },
      }),
      localizationTranslationJobLifecycleServiceApi.ExpireTranslationJobResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      localizationTranslationJobLifecycleServiceApi.ExpireTranslationJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        translationJob: { translationJobId: (req?.translationJobId ?? "") },
      }),
    );
  }

  /**
   * Returns a translation job.
   */
  async getTranslationJobLifecycle(req: localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleRequest): Promise<localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranslationJobLifecycle", req);
    this.logger.info("get_translation_job_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest.fromPartial({
      consentRecord: {
        attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        correlationId: (req?.translationJobId ?? ""),
        measurements: [{ observedAt: req?.context?.deadline }],
        source: (req?.context?.actor?.userId ?? ""),
      },
      context: req?.context,
    });
    const invoke1: Unary<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.recalculateConsentRecords(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = customersCustomerCalculationServiceApi.RecalculateCustomersRequest.fromPartial({
      context: req?.context,
      customer: {
        attributes: Object.fromEntries(Object.entries((reply1?.consentRecord?.attributes ?? {}))),
        relationshipManager: { displayName: (reply1?.consentRecord?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<customersCustomerCalculationServiceApi.RecalculateCustomersRequest, customersCustomerCalculationServiceApi.RecalculateCustomersResponse> =
      (input, done) => this.customersCustomerCalculationClient.recalculateCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    return mergeResponses(
      localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleResponse.fromPartial({
        translationJob: {
          assignee: { email: (reply2?.customer?.contact?.email ?? "") },
          audit: { updatedBy: (reply2?.customer?.audit?.updatedBy ?? "") },
        },
      }),
      localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleResponse.fromPartial({ translationJob: { translationJobId: (req?.translationJobId ?? "") } }),
    );
  }

  /**
   * Reinstates a translation job.
   */
  async reinstateTranslationJob(req: localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobRequest): Promise<localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateTranslationJob", req);
    this.logger.info("reinstate_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersHouseholdQueryServiceApi.BrowseHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.details?.newOwner?.userId ?? "") },
    });
    const invoke1: Unary<customersHouseholdQueryServiceApi.BrowseHouseholdsRequest, customersHouseholdQueryServiceApi.BrowseHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.browseHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = localizationTranslationJobReportingServiceApi.ListTranslationJobReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const method2 = "listTranslationJobReports" as const;
    const invoke2: Unary<localizationTranslationJobReportingServiceApi.ListTranslationJobReportsRequest, localizationTranslationJobReportingServiceApi.ListTranslationJobReportsResponse> =
      (input, done) => this.localizationTranslationJobReportingClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationJobReportingServiceApi.ListTranslationJobReportsRequest, localizationTranslationJobReportingServiceApi.ListTranslationJobReportsResponse>(invoke2, request2);
    const request3 = personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.details?.newOwner?.email ?? ""),
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
      },
      recommendation: {
        counterparty: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const proxy3 = forwarding(this.personalizationRecommendationWorkflowClient);
    const invoke3: Unary<personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowResponse> =
      (input, done) => proxy3.pauseRecommendationWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.PauseRecommendationWorkflowResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobResponse.fromPartial({ translationJob: { sla: { dueAt: reply3?.recommendation?.dueAt } } }),
      localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        translationJob: { translationJobId: (req?.translationJobId ?? "") },
      }),
    );
  }

  /**
   * Renews a translation job.
   */
  async renewTranslationJob(req: localizationTranslationJobLifecycleServiceApi.RenewTranslationJobRequest): Promise<localizationTranslationJobLifecycleServiceApi.RenewTranslationJobResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewTranslationJob", req);
    this.logger.info("renew_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumWorkflowServiceApi.SignalForumWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      forum: {
        children: [{
          children: [{
            manager: {
              displayName: (req?.details?.newOwner?.displayName ?? ""),
              email: (req?.details?.notifyContact?.email ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<communityForumWorkflowServiceApi.SignalForumWorkflowRequest, communityForumWorkflowServiceApi.SignalForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.signalForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumWorkflowServiceApi.SignalForumWorkflowRequest, communityForumWorkflowServiceApi.SignalForumWorkflowResponse>(invoke1, request1);
    const request2 = communityForumApprovalServiceApi.ListPendingForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.forum?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (reply1?.forum?.manager?.userId ?? ""),
        region: (reply1?.forum?.location?.region ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse> =
      (input, done) => this.communityForumApprovalClient.listPendingForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesRequest.fromPartial({
      context: input3?.context,
      translationJobId: (input3?.translationJobId ?? ""),
    });
    const invoke3: Unary<localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesRequest, localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.getTranslationJobRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesRequest, localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesResponse>(invoke3, request3);
    let selected4_2: string | undefined;
    switch (reply3?.translationJob?.origin?.$case) {
      case "customer":
        selected4_2 = ((reply3?.translationJob?.origin?.$case === "customer" ? reply3?.translationJob?.origin.customer : undefined)?.email ?? "");
        break;
      default:
        selected4_2 = "";
    }
    const request4 = auditAuditEventValidationServiceApi.ExplainAuditEventDecisionRequest.fromPartial({
      auditEvent: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      context: req?.context,
      details: {
        contact: {
          email: (selected4_2 ?? ""),
          name: req?.details?.notifyContact?.name,
          phone: (reply3?.translationJob?.requester?.phone ?? ""),
        },
      },
    });
    const invoke4: Unary<auditAuditEventValidationServiceApi.ExplainAuditEventDecisionRequest, auditAuditEventValidationServiceApi.ExplainAuditEventDecisionResponse> =
      (input, done) => this.auditAuditEventValidationClient.explainAuditEventDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<auditAuditEventValidationServiceApi.ExplainAuditEventDecisionRequest, auditAuditEventValidationServiceApi.ExplainAuditEventDecisionResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobLifecycleServiceApi.RenewTranslationJobResponse.fromPartial({
        translationJob: { assignee: { email: (reply1?.forum?.manager?.email ?? "") } },
      }),
      localizationTranslationJobLifecycleServiceApi.RenewTranslationJobResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      localizationTranslationJobLifecycleServiceApi.RenewTranslationJobResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        translationJob: { audit: { etag: (reply3?.translationJob?.audit?.etag ?? "") } },
      }),
      localizationTranslationJobLifecycleServiceApi.RenewTranslationJobResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      localizationTranslationJobLifecycleServiceApi.RenewTranslationJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        translationJob: { translationJobId: (req?.translationJobId ?? "") },
      }),
    );
  }

  /**
   * Schedules a translation job.
   */
  async scheduleTranslationJobExpiry(req: localizationTranslationJobLifecycleServiceApi.ScheduleTranslationJobExpiryRequest): Promise<localizationTranslationJobLifecycleServiceApi.ScheduleTranslationJobExpiryResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "ScheduleTranslationJobExpiry", req);
    this.logger.info("schedule_translation_job_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: ((req?.translationJob?.origin?.$case === "customer" ? req?.translationJob?.origin.customer : undefined)?.email ?? ""),
          phone: (req?.translationJob?.requester?.phone ?? ""),
        },
      },
      translationKey: {
        audit: {
          etag: (req?.translationJob?.audit?.etag ?? ""),
          updatedBy: (req?.translationJob?.audit?.updatedBy ?? ""),
        },
      },
    });
    const decoded1 = localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest.fromJSON(
      JSON.parse(JSON.stringify(localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest.toJSON(request1))),
    );
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.explainTranslationKeyCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse>(invoke1, decoded1);
    const results2 = await Promise.all((req?.translationJob?.comments ?? []).map(async (item) => {
      const request2 = localizationLocaleValidationServiceApi.LintLocalesRequest.fromPartial({
        context: req?.context,
        details: {
          contact: {
            email: (item?.authorEmail ?? ""),
            phone: (req?.translationJob?.requester?.phone ?? ""),
          },
        },
        locale: {
          audit: { createdAt: item?.createdAt },
          owner: { email: (reply1?.translationKey?.owner?.email ?? "") },
        },
      });
      const invoke2: Unary<localizationLocaleValidationServiceApi.LintLocalesRequest, localizationLocaleValidationServiceApi.LintLocalesResponse> =
        (input, done) => this.localizationLocaleValidationClient.lintLocales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<localizationLocaleValidationServiceApi.LintLocalesRequest, localizationLocaleValidationServiceApi.LintLocalesResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? localizationLocaleValidationServiceApi.LintLocalesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobLifecycleServiceApi.ScheduleTranslationJobExpiryResponse.fromPartial({
        translationJob: { requester: { email: (reply1?.translationKey?.owner?.email ?? "") } },
      }),
      localizationTranslationJobLifecycleServiceApi.ScheduleTranslationJobExpiryResponse.fromPartial({
        translationJob: {
          customFields: (req?.translationJob?.customFields ?? {}),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Suspends a translation job.
   */
  async suspendTranslationJob(req: localizationTranslationJobLifecycleServiceApi.SuspendTranslationJobRequest): Promise<localizationTranslationJobLifecycleServiceApi.SuspendTranslationJobResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendTranslationJob", req);
    this.logger.info("suspend_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.fromPartial({
      context: req?.context,
      translationKey: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.RecalculateTranslationKeysRequest",
      value: Buffer.from(localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.encode(request1).finish()),
    });
    const unpacked1 = localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.decode(envelope1.value);
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.recalculateTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse>(invoke1, unpacked1);
    const request2 = personalizationAffinityApprovalServiceApi.RecallAffinityRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.newOwner?.email ?? "") } },
    });
    const client2 = this.clients.get<personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient>("acme.personalization.v1.AffinityApprovalService");
    const invoke2: Unary<personalizationAffinityApprovalServiceApi.RecallAffinityRequest, personalizationAffinityApprovalServiceApi.RecallAffinityResponse> =
      (input, done) => client2.recallAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityApprovalServiceApi.RecallAffinityRequest, personalizationAffinityApprovalServiceApi.RecallAffinityResponse>(invoke2, request2);
    const request3 = localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.notifyContact?.phone ?? "") } },
      translationKey: {
        locator: { $case: "address", address: {
          locality: ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.locality ?? ""),
        } },
        dimensions: { length: (reply1?.translationKey?.dimensions?.length ?? 0) },
        owner: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const invoke3: Unary<localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyValidationClient.normalizeTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.NormalizeTranslationKeyResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobLifecycleServiceApi.SuspendTranslationJobResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      localizationTranslationJobLifecycleServiceApi.SuspendTranslationJobResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      localizationTranslationJobLifecycleServiceApi.SuspendTranslationJobResponse.fromPartial({
        translationJob: {
          assignee: { displayName: (reply3?.translationKey?.owner?.displayName ?? "") },
        },
      }),
      localizationTranslationJobLifecycleServiceApi.SuspendTranslationJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        translationJob: { translationJobId: (req?.translationJobId ?? "") },
      }),
    );
  }

  /**
   * Terminates a translation job.
   */
  async terminateTranslationJob(req: localizationTranslationJobLifecycleServiceApi.TerminateTranslationJobRequest): Promise<localizationTranslationJobLifecycleServiceApi.TerminateTranslationJobResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateTranslationJob", req);
    this.logger.info("terminate_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceCalculationServiceApi.SimulatePreferenceRequest.fromPartial({
      context: req?.context,
      preference: {
        action: { $case: "block", block: { notifyEmail: (req?.details?.newOwner?.email ?? "") } },
        owner: { userId: (req?.details?.newOwner?.userId ?? "") },
      },
    });
    const invoke1: Unary<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse> =
      (input, done) => this.customersPreferenceCalculationClient.simulatePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse>(invoke1, request1));
    const request2 = localizationTranslationJobValidationServiceApi.ScoreTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: { assignee: { email: (req?.details?.newOwner?.email ?? "") } },
    });
    const invoke2: Unary<localizationTranslationJobValidationServiceApi.ScoreTranslationJobRequest, localizationTranslationJobValidationServiceApi.ScoreTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobValidationClient.scoreTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("TerminateTranslationJob.ScoreTranslationJob", () => call<localizationTranslationJobValidationServiceApi.ScoreTranslationJobRequest, localizationTranslationJobValidationServiceApi.ScoreTranslationJobResponse>(invoke2, request2));
    const request3 = communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: { email: (reply2?.translationJob?.requester?.email ?? "") },
        audit: { etag: (reply1?.preference?.audit?.etag ?? "") },
        origin: { $case: "customer", customer: {
          customerId: ((reply2?.translationJob?.origin?.$case === "customer" ? reply2?.translationJob?.origin.customer : undefined)?.customerId ?? ""),
        } },
      },
    });
    const invoke3: Unary<communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest, communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse> =
      (input, done) => this.communityModerationLifecycleClient.scheduleModerationExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = localizationTranslationKeyServiceApi.SearchTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: reply3?.moderation?.sla?.dueAt },
    });
    const reply4 = await this.workQueue.enqueue<localizationTranslationKeyServiceApi.SearchTranslationKeysRequest, localizationTranslationKeyServiceApi.SearchTranslationKeysResponse>(
      "acme.localization.v1.TranslationJobLifecycleService/TerminateTranslationJob:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobLifecycleServiceApi.TerminateTranslationJobResponse.fromPartial({
        translationJob: {
          audit: { createdBy: (reply1?.preference?.audit?.createdBy ?? "") },
          requester: { email: (reply1?.preference?.owner?.email ?? "") },
        },
      }),
      localizationTranslationJobLifecycleServiceApi.TerminateTranslationJobResponse.fromPartial({
        translationJob: { sla: { breached: (reply2?.translationJob?.sla?.breached ?? false) } },
      }),
      localizationTranslationJobLifecycleServiceApi.TerminateTranslationJobResponse.fromPartial({
        translationJob: {
          priority: (reply3?.moderation?.priority ?? 0),
          requester: {
            email: ((reply3?.moderation?.origin?.$case === "customer" ? reply3?.moderation?.origin.customer : undefined)?.email ?? ""),
          },
        },
      }),
      localizationTranslationJobLifecycleServiceApi.TerminateTranslationJobResponse.fromPartial({ outcome: { message: (reply4?.result?.message ?? "") } }),
      localizationTranslationJobLifecycleServiceApi.TerminateTranslationJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        translationJob: { translationJobId: (req?.translationJobId ?? "") },
      }),
    );
  }
}
