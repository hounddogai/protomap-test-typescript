/**
 * Runs the long-lived workflow that takes a locale from start to finish. Remote work stays behind typed client ports.
 */

import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersCustomerServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as insurancePolicyCalculationServiceApi from "../../../../.cache/proto/acme/insurance/v1/policy_calculation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as localizationLocaleWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import * as localizationTranslationJobApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_approval_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
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
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toLocaleRecord } from "../data/records.js";
import { LocalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate locale operations and persist audit data.
 */
@injectable()
export class LocaleWorkflowWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerService") private readonly customersCustomerClient: customersCustomerServiceApi.CustomerServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.insurance.v1.PolicyCalculationService") private readonly insurancePolicyCalculationClient: insurancePolicyCalculationServiceApi.PolicyCalculationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobApprovalService") private readonly localizationTranslationJobApprovalClient: localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobReportingService") private readonly localizationTranslationJobReportingClient: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobValidationService") private readonly localizationTranslationJobValidationClient: localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyValidationService") private readonly localizationTranslationKeyValidationClient: localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileApprovalService") private readonly personalizationProfileApprovalClient: personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a locale.
   */
  async advanceLocaleWorkflow(req: localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowRequest): Promise<localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "AdvanceLocaleWorkflow", req);
    this.logger.info("advance_locale_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobApprovalServiceApi.RejectTranslationJobRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.locale?.owner?.userId ?? "") } },
      translationJob: {
        audit: { etag: (req?.locale?.audit?.etag ?? "") },
        origin: { $case: "customer", customer: { displayName: (req?.locale?.owner?.displayName ?? "") } },
        requester: { name: req?.details?.notify?.name },
      },
    });
    const invoke1: Unary<localizationTranslationJobApprovalServiceApi.RejectTranslationJobRequest, localizationTranslationJobApprovalServiceApi.RejectTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobApprovalClient.rejectTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<localizationTranslationJobApprovalServiceApi.RejectTranslationJobRequest, localizationTranslationJobApprovalServiceApi.RejectTranslationJobResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: { audit: { etag: (reply1?.translationJob?.audit?.etag ?? "") } },
    });
    const invoke2: Unary<localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyValidationClient.scoreTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      localizationLocaleWorkflowServiceApi.AdvanceLocaleWorkflowResponse.fromPartial({
        locale: {
          effective: req?.locale?.effective,
          localeId: (req?.localeId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a locale.
   */
  async cancelLocaleWorkflow(req: localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowRequest): Promise<localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "CancelLocaleWorkflow", req);
    this.logger.info("cancel_locale_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionRequest.fromPartial({
      consentRecord: { subject: { displayName: (req?.locale?.owner?.displayName ?? "") } },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionRequest, customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionResponse> =
      (input, done) => this.customersConsentRecordValidationClient.explainConsentRecordDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("CancelLocaleWorkflow.ExplainConsentRecordDecision", () => call<customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionRequest, customersConsentRecordValidationServiceApi.ExplainConsentRecordDecisionResponse>(invoke1, request1));
    const request2 = customersCustomerSegmentValidationServiceApi.ExplainCustomerSegmentDecisionRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: { updatedAt: req?.locale?.audit?.updatedAt },
        action: { $case: "discount", discount: {
          amount: (req?.locale?.action?.$case === "discount" ? req?.locale?.action.discount : undefined)?.amount,
        } },
      },
    });
    const invoke2: Unary<customersCustomerSegmentValidationServiceApi.ExplainCustomerSegmentDecisionRequest, customersCustomerSegmentValidationServiceApi.ExplainCustomerSegmentDecisionResponse> =
      (input, done) => this.customersCustomerSegmentValidationClient.explainCustomerSegmentDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.locale?.owner?.displayName ?? "") } },
      details: {
        notify: {
          email: (reply2?.customerSegment?.owner?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const reply3 = await this.workQueue.enqueue<notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportResponse>(
      "acme.localization.v1.LocaleWorkflowService/CancelLocaleWorkflow:2", request3,
    );
    const request4 = customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{ manager: { userId: (reply2?.customerSegment?.owner?.userId ?? "") } }],
        }],
      },
    });
    const invoke4: Unary<customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest, customersHouseholdValidationServiceApi.CheckHouseholdEligibilityResponse> =
      (input, done) => this.customersHouseholdValidationClient.checkHouseholdEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await inRequest(req.context!, () => call<customersHouseholdValidationServiceApi.CheckHouseholdEligibilityRequest, customersHouseholdValidationServiceApi.CheckHouseholdEligibilityResponse>(invoke4, request4));
    const request5 = experimentsVariantSyncServiceApi.StreamVariantChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        description: (req?.locale?.description ?? ""),
        name: (req?.locale?.name ?? ""),
        priority: (req?.locale?.priority ?? 0),
      } },
      context: req?.context,
    });
    const stream5 = this.experimentsVariantSyncClient.streamVariantChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? experimentsVariantSyncServiceApi.StreamVariantChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowResponse.fromPartial({
        locale: { audit: { createdBy: (reply4?.household?.audit?.createdBy ?? "") } },
        result: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          priority: (req?.locale?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Returns a locale.
   */
  async inspectLocaleWorkflow(req: localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowRequest): Promise<localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectLocaleWorkflow", req);
    this.logger.info("inspect_locale_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        audit: { createdAt: req?.context?.deadline },
        contact: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient.cloneLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((reply1?.ledgerAccount?.labels ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
    });
    const invoke2: Unary<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.summarizeFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    return mergeResponses(
      localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowResponse.fromPartial({
        locale: {
          audit: { createdBy: (reply1?.ledgerAccount?.audit?.createdBy ?? "") },
          owner: { email: (reply1?.ledgerAccount?.contact?.email ?? "") },
        },
      }),
      localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowResponse.fromPartial({ locale: { localeId: (req?.localeId ?? "") } }),
    );
  }

  /**
   * Lists locales a page at a time.
   */
  async listLocaleWorkflows(req: localizationLocaleWorkflowServiceApi.ListLocaleWorkflowsRequest): Promise<localizationLocaleWorkflowServiceApi.ListLocaleWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListLocaleWorkflows", req);
    this.logger.info("list_locale_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileApprovalServiceApi.ApproveProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        primaryAddress: { region: (req?.filter?.region ?? "") },
      },
    });
    const invoke1: Unary<personalizationProfileApprovalServiceApi.ApproveProfileRequest, personalizationProfileApprovalServiceApi.ApproveProfileResponse> =
      (input, done) => this.personalizationProfileApprovalClient.approveProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationLocaleWorkflowServiceApi.ListLocaleWorkflowsResponse.fromPartial({
      locales: [{ audit: { createdAt: reply1?.profile?.audit?.createdAt } }],
      result: { correlationId: (reply1?.result?.correlationId ?? "") },
    });
  }

  /**
   * Retrys a locale.
   */
  async retryLocaleWorkflow(req: localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowRequest): Promise<localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "RetryLocaleWorkflow", req);
    this.logger.info("retry_locale_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: ((req?.locale?.action?.$case === "block" ? req?.locale?.action.block : undefined)?.reason ?? ""),
    });
    const method1 = "scheduleTranslationJobReport" as const;
    const invoke1: Unary<localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse> =
      (input, done) => this.localizationTranslationJobReportingClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse>(invoke1, request1);
    const request2 = customersConsentRecordValidationServiceApi.NormalizeConsentRecordRequest.fromPartial({
      consentRecord: { subject: { displayName: (req?.locale?.owner?.displayName ?? "") } },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.customersConsentRecordValidationClient);
    const invoke2: Unary<customersConsentRecordValidationServiceApi.NormalizeConsentRecordRequest, customersConsentRecordValidationServiceApi.NormalizeConsentRecordResponse> =
      (input, done) => proxy2.normalizeConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersConsentRecordValidationServiceApi.NormalizeConsentRecordRequest, customersConsentRecordValidationServiceApi.NormalizeConsentRecordResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowResponse.fromPartial({
        locale: {
          owner: { displayName: (reply2?.consentRecord?.subject?.displayName ?? "") },
        },
        outcome: { message: (reply2?.result?.message ?? "") },
      }),
      localizationLocaleWorkflowServiceApi.RetryLocaleWorkflowResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          version: (req?.locale?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Starts a locale.
   */
  async startLocaleWorkflow(req: localizationLocaleWorkflowServiceApi.StartLocaleWorkflowRequest): Promise<localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "StartLocaleWorkflow", req);
    this.logger.info("start_locale_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
      translationJob: {
        assignee: { userId: (req?.locale?.owner?.userId ?? "") },
        audit: { createdAt: req?.locale?.audit?.createdAt },
        origin: { $case: "customer", customer: { displayName: (req?.locale?.owner?.displayName ?? "") } },
      },
    });
    const invoke1: Unary<localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest, localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse> =
      (input, done) => this.localizationTranslationJobValidationClient.lintTranslationJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest, localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse>(invoke1, request1);
    const request2 = insurancePolicyCalculationServiceApi.EstimatePolicyRequest.fromPartial({
      context: req?.context,
      policy: {
        audit: {
          etag: (req?.locale?.audit?.etag ?? ""),
          updatedAt: req?.locale?.audit?.updatedAt,
        },
        contact: {
          preferredChannel: (reply1?.translationJob?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<insurancePolicyCalculationServiceApi.EstimatePolicyRequest, insurancePolicyCalculationServiceApi.EstimatePolicyResponse> =
      (input, done) => this.insurancePolicyCalculationClient.estimatePolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<insurancePolicyCalculationServiceApi.EstimatePolicyRequest, insurancePolicyCalculationServiceApi.EstimatePolicyResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = customersCustomerServiceApi.CloneCustomerRequest.fromPartial({
      context: input3?.context,
      customer: {
        audit: {
          etag: (input3?.locale?.audit?.etag ?? ""),
          updatedBy: (input3?.locale?.audit?.updatedBy ?? ""),
        },
        relationshipManager: {
          displayName: (reply1?.translationJob?.assignee?.displayName ?? ""),
          userId: (reply1?.translationJob?.assignee?.userId ?? ""),
        },
      },
    });
    const invoke3: Unary<customersCustomerServiceApi.CloneCustomerRequest, customersCustomerServiceApi.CloneCustomerResponse> =
      (input, done) => this.customersCustomerClient.cloneCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersCustomerServiceApi.CloneCustomerRequest, customersCustomerServiceApi.CloneCustomerResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse.fromPartial({ locale: { audit: { updatedAt: reply3?.customer?.audit?.updatedAt } } }),
      localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          status: req?.locale?.status,
        },
      }),
    );
  }
}
