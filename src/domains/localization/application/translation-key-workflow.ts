/**
 * Runs the long-lived workflow that takes a translation key from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as experimentsExposureImportServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_workflow_service.js";
import * as experimentsVariantWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_workflow_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as localizationTranslationKeyWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_workflow_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationRecommendationApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_approval_service.js";
import * as recruitingJobOpeningCalculationServiceApi from "../../../../.cache/proto/acme/recruiting/v1/job_opening_calculation_service.js";
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
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTranslationKeyRecord } from "../data/records.js";
import { LocalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation key operations and persist audit data.
 */
@injectable()
export class TranslationKeyWorkflowWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentApprovalService") private readonly experimentsExperimentApprovalClient: experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureWorkflowService") private readonly experimentsExposureWorkflowClient: experimentsExposureWorkflowServiceApi.ExposureWorkflowServiceClient,
    @inject("grpc:acme.experiments.v1.VariantWorkflowService") private readonly experimentsVariantWorkflowClient: experimentsVariantWorkflowServiceApi.VariantWorkflowServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyValidationService") private readonly localizationTranslationKeyValidationClient: localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationApprovalService") private readonly personalizationRecommendationApprovalClient: personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceClient,
    @inject("grpc:acme.recruiting.v1.JobOpeningCalculationService") private readonly recruitingJobOpeningCalculationClient: recruitingJobOpeningCalculationServiceApi.JobOpeningCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a translation key.
   */
  async advanceTranslationKeyWorkflow(req: localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowRequest): Promise<localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "AdvanceTranslationKeyWorkflow", req);
    this.logger.info("advance_translation_key_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureWorkflowServiceApi.PauseExposureWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.translationKey?.owner?.email ?? ""),
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
      exposure: {
        measurements: [{ unit: (req?.translationKey?.dimensions?.unit ?? "") }],
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.PauseExposureWorkflowRequest",
      value: Buffer.from(experimentsExposureWorkflowServiceApi.PauseExposureWorkflowRequest.encode(request1).finish()),
    });
    const unpacked1 = experimentsExposureWorkflowServiceApi.PauseExposureWorkflowRequest.decode(envelope1.value);
    const invoke1: Unary<experimentsExposureWorkflowServiceApi.PauseExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.PauseExposureWorkflowResponse> =
      (input, done) => this.experimentsExposureWorkflowClient.pauseExposureWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureWorkflowServiceApi.PauseExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.PauseExposureWorkflowResponse>(invoke1, unpacked1);
    let selected2_1: string | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected2_1 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = personalizationAffinityImportServiceApi.ListAffinityImportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.translationKey?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.outcome?.referenceId ?? ""),
        region: (selected2_1 ?? ""),
      },
    });
    const invoke2: Unary<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse> =
      (input, done) => this.personalizationAffinityImportClient.listAffinityImports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowResponse.fromPartial({
        translationKey: {
          code: (req?.translationKey?.code ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a translation key.
   */
  async cancelTranslationKeyWorkflow(req: localizationTranslationKeyWorkflowServiceApi.CancelTranslationKeyWorkflowRequest): Promise<localizationTranslationKeyWorkflowServiceApi.CancelTranslationKeyWorkflowResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "CancelTranslationKeyWorkflow", req);
    this.logger.info("cancel_translation_key_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          recipient: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.recipient ?? ""),
          region: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? ""),
        },
      },
      translationJob: { requester: { email: (req?.translationKey?.owner?.email ?? "") } },
    });
    const invoke1: Unary<localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest, localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.recalculateTranslationJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest, localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (reply1?.translationJob?.assignee?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
      translationKey: {
        audit: {
          createdAt: reply1?.translationJob?.audit?.createdAt,
          etag: (reply1?.translationJob?.audit?.etag ?? ""),
        },
      },
    });
    const invoke2: Unary<localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionRequest, localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse> =
      (input, done) => this.localizationTranslationKeyValidationClient.explainTranslationKeyDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionRequest, localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyWorkflowServiceApi.CancelTranslationKeyWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        translationKey: { owner: { userId: (reply1?.translationJob?.assignee?.userId ?? "") } },
      }),
      localizationTranslationKeyWorkflowServiceApi.CancelTranslationKeyWorkflowResponse.fromPartial({
        translationKey: {
          owner: { displayName: (reply2?.translationKey?.owner?.displayName ?? "") },
        },
      }),
      localizationTranslationKeyWorkflowServiceApi.CancelTranslationKeyWorkflowResponse.fromPartial({
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
  async inspectTranslationKeyWorkflow(req: localizationTranslationKeyWorkflowServiceApi.InspectTranslationKeyWorkflowRequest): Promise<localizationTranslationKeyWorkflowServiceApi.InspectTranslationKeyWorkflowResponse> {
    validateContext(req.context);
    if (!req.translationKeyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_key_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectTranslationKeyWorkflow", req);
    this.logger.info("inspect_translation_key_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest.fromPartial({
      context: req?.context,
      translationJob: { requester: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest, localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.compareTranslationJobOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("InspectTranslationKeyWorkflow.CompareTranslationJobOptions", () => call<localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest, localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse>(invoke1, request1));
    return mergeResponses(
      localizationTranslationKeyWorkflowServiceApi.InspectTranslationKeyWorkflowResponse.fromPartial({
        translationKey: { owner: { email: (reply1?.translationJob?.assignee?.email ?? "") } },
      }),
      localizationTranslationKeyWorkflowServiceApi.InspectTranslationKeyWorkflowResponse.fromPartial({ translationKey: { translationKeyId: (req?.translationKeyId ?? "") } }),
    );
  }

  /**
   * Lists translation keys a page at a time.
   */
  async listTranslationKeyWorkflows(req: localizationTranslationKeyWorkflowServiceApi.ListTranslationKeyWorkflowsRequest): Promise<localizationTranslationKeyWorkflowServiceApi.ListTranslationKeyWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListTranslationKeyWorkflows", req);
    this.logger.info("list_translation_key_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationTranslationKeyWorkflowServiceApi.ListTranslationKeyWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a translation key.
   */
  async pauseTranslationKeyWorkflow(req: localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowRequest): Promise<localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "PauseTranslationKeyWorkflow", req);
    this.logger.info("pause_translation_key_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureWorkflowServiceApi.SignalExposureWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          name: req?.details?.notify?.name,
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<experimentsExposureWorkflowServiceApi.SignalExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.SignalExposureWorkflowResponse> =
      (input, done) => this.experimentsExposureWorkflowClient.signalExposureWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = recruitingJobOpeningCalculationServiceApi.RecalculateJobOpeningsRequest.fromPartial({
      context: req?.context,
      jobOpening: {
        lines: [{
          quantity: (req?.translationKey?.components?.["primary"]?.quantity ?? 0),
        }],
      },
    });
    const reply2 = await this.workQueue.enqueue<recruitingJobOpeningCalculationServiceApi.RecalculateJobOpeningsRequest, recruitingJobOpeningCalculationServiceApi.RecalculateJobOpeningsResponse>(
      "acme.localization.v1.TranslationKeyWorkflowService/PauseTranslationKeyWorkflow:1", request2,
    );
    let selected3_2: string | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected3_2 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected3_2 = "";
    }
    const request3 = customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (reply2?.jobOpening?.billingAddress?.countryCode ?? ""),
          postalCode: (selected3_2 ?? ""),
        },
      },
    });
    const invoke3: Unary<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.quoteConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse>(invoke3, request3);
    const request4 = localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (reply2?.jobOpening?.counterparty?.displayName ?? "") },
      },
      locale: {
        audit: { etag: (req?.translationKey?.audit?.etag ?? "") },
        owner: { email: (req?.details?.notify?.email ?? "") },
      },
    });
    const invoke4: Unary<localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest, localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse> =
      (input, done) => this.localizationLocaleApprovalClient.commentLocaleApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowResponse.fromPartial({
        translationKey: { audit: { updatedAt: reply2?.jobOpening?.audit?.updatedAt } },
      }),
      localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowResponse.fromPartial({
        translationKey: {
          owner: { displayName: (reply3?.consentRecord?.subject?.displayName ?? "") },
        },
      }),
      localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowResponse.fromPartial({ outcome: { effectiveAt: reply4?.outcome?.effectiveAt } }),
      localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowResponse.fromPartial({
        translationKey: {
          specs: (req?.translationKey?.specs ?? {}),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a translation key.
   */
  async resumeTranslationKeyWorkflow(req: localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowRequest): Promise<localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "ResumeTranslationKeyWorkflow", req);
    this.logger.info("resume_translation_key_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.lines ?? []).map((value) => value),
        },
      },
    });
    const invoke1: Unary<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.compareConsentRecordOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = customersHouseholdQueryServiceApi.ExportHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream2 = this.customersHouseholdQueryClient.exportHouseholds(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? customersHouseholdQueryServiceApi.ExportHouseholdsResponse.fromPartial({});
    const request3 = experimentsVariantWorkflowServiceApi.SignalVariantWorkflowRequest.fromPartial({
      context: req?.context,
      variant: { audit: { createdBy: (req?.translationKey?.audit?.createdBy ?? "") } },
    });
    const invoke3: Unary<experimentsVariantWorkflowServiceApi.SignalVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.SignalVariantWorkflowResponse> =
      (input, done) => this.experimentsVariantWorkflowClient.signalVariantWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = customersCustomerQueryServiceApi.SummarizeCustomersRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const method4 = "summarizeCustomers" as const;
    const invoke4: Unary<customersCustomerQueryServiceApi.SummarizeCustomersRequest, customersCustomerQueryServiceApi.SummarizeCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersCustomerQueryServiceApi.SummarizeCustomersRequest, customersCustomerQueryServiceApi.SummarizeCustomersResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowResponse.fromPartial({
        outcome: { message: (reply3?.outcome?.message ?? "") },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowResponse.fromPartial({
        translationKey: {
          code: (req?.translationKey?.code ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a translation key.
   */
  async retryTranslationKeyWorkflow(req: localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowRequest): Promise<localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "RetryTranslationKeyWorkflow", req);
    this.logger.info("retry_translation_key_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.CloneUserRequest.fromPartial({
      context: req?.context,
      user: { audit: { updatedAt: req?.translationKey?.audit?.updatedAt } },
    });
    const proxy1 = forwarding(this.identityUserClient);
    const invoke1: Unary<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse> =
      (input, done) => proxy1.cloneUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse>(invoke1, request1);
    const request2 = experimentsExposureImportServiceApi.ValidateExposureImportRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.translationKey?.owner?.email ?? ""),
          name: reply1?.user?.name,
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<experimentsExposureImportServiceApi.ValidateExposureImportRequest, experimentsExposureImportServiceApi.ValidateExposureImportResponse> =
      (input, done) => this.experimentsExposureImportClient.validateExposureImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExposureImportServiceApi.ValidateExposureImportRequest, experimentsExposureImportServiceApi.ValidateExposureImportResponse>(invoke2, request2);
    const request3 = personalizationRecommendationApprovalServiceApi.ApproveRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { userId: (reply1?.user?.relationshipManager?.userId ?? "") },
      },
      recommendation: {
        audit: { updatedAt: reply1?.user?.audit?.updatedAt },
        lines: [{
          quantity: (req?.translationKey?.components?.["primary"]?.quantity ?? 0),
        }],
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<personalizationRecommendationApprovalServiceApi.ApproveRecommendationRequest, personalizationRecommendationApprovalServiceApi.ApproveRecommendationResponse> =
      (input, done) => this.personalizationRecommendationApprovalClient.approveRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationRecommendationApprovalServiceApi.ApproveRecommendationRequest, personalizationRecommendationApprovalServiceApi.ApproveRecommendationResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = customersPreferenceValidationServiceApi.NormalizePreferenceRequest.fromPartial({
      context: input4?.context,
      details: {
        contact: { preferredChannel: (input4?.details?.notify?.preferredChannel ?? "") },
      },
      preference: {
        audit: {
          etag: (input4?.translationKey?.audit?.etag ?? ""),
          updatedBy: (reply1?.user?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke4: Unary<customersPreferenceValidationServiceApi.NormalizePreferenceRequest, customersPreferenceValidationServiceApi.NormalizePreferenceResponse> =
      (input, done) => this.customersPreferenceValidationClient.normalizePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersPreferenceValidationServiceApi.NormalizePreferenceRequest, customersPreferenceValidationServiceApi.NormalizePreferenceResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowResponse.fromPartial({ outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") } }),
      localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowResponse.fromPartial({
        result: { referenceIds: (reply4?.result?.referenceIds ?? []) },
        translationKey: { owner: { userId: (reply4?.preference?.owner?.userId ?? "") } },
      }),
      localizationTranslationKeyWorkflowServiceApi.RetryTranslationKeyWorkflowResponse.fromPartial({
        translationKey: {
          code: (req?.translationKey?.code ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a translation key.
   */
  async signalTranslationKeyWorkflow(req: localizationTranslationKeyWorkflowServiceApi.SignalTranslationKeyWorkflowRequest): Promise<localizationTranslationKeyWorkflowServiceApi.SignalTranslationKeyWorkflowResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "SignalTranslationKeyWorkflow", req);
    this.logger.info("signal_translation_key_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventValidationServiceApi.NormalizeAuditEventRequest.fromPartial({
      auditEvent: {
        measurements: [{ unit: (req?.translationKey?.dimensions?.unit ?? "") }],
      },
      context: req?.context,
      details: {
        contact: {
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const cloned1: auditAuditEventValidationServiceApi.NormalizeAuditEventRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<auditAuditEventValidationServiceApi.NormalizeAuditEventRequest, auditAuditEventValidationServiceApi.NormalizeAuditEventResponse> =
      (input, done) => this.auditAuditEventValidationClient.normalizeAuditEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventValidationServiceApi.NormalizeAuditEventRequest, auditAuditEventValidationServiceApi.NormalizeAuditEventResponse>(invoke1, cloned1);
    const request2 = experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest.fromPartial({
      context: req?.context,
      experiment: {
        organizer: { email: (req?.details?.notify?.email ?? "") },
        participants: [{
          contact: {
            email: (req?.translationKey?.owner?.email ?? ""),
            name: req?.details?.notify?.name,
          },
        }],
      },
    });
    const decoded2 = experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest.toJSON(request2))),
    );
    const invoke2: Unary<experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest, experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse> =
      (input, done) => this.experimentsExperimentApprovalClient.commentExperimentApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest, experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse>(invoke2, decoded2);
    const request3 = experimentsVariantWorkflowServiceApi.ListVariantWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.experiment?.audit?.createdAt,
        ownerId: (reply2?.result?.correlationId ?? ""),
        region: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? ""),
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.ListVariantWorkflowsRequest",
      value: Buffer.from(experimentsVariantWorkflowServiceApi.ListVariantWorkflowsRequest.encode(request3).finish()),
    });
    const unpacked3 = experimentsVariantWorkflowServiceApi.ListVariantWorkflowsRequest.decode(envelope3.value);
    const invoke3: Unary<experimentsVariantWorkflowServiceApi.ListVariantWorkflowsRequest, experimentsVariantWorkflowServiceApi.ListVariantWorkflowsResponse> =
      (input, done) => this.experimentsVariantWorkflowClient.listVariantWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsVariantWorkflowServiceApi.ListVariantWorkflowsRequest, experimentsVariantWorkflowServiceApi.ListVariantWorkflowsResponse>(invoke3, unpacked3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyWorkflowServiceApi.SignalTranslationKeyWorkflowResponse.fromPartial({ outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") } }),
      localizationTranslationKeyWorkflowServiceApi.SignalTranslationKeyWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        translationKey: { audit: { etag: (reply2?.experiment?.audit?.etag ?? "") } },
      }),
      localizationTranslationKeyWorkflowServiceApi.SignalTranslationKeyWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      localizationTranslationKeyWorkflowServiceApi.SignalTranslationKeyWorkflowResponse.fromPartial({
        translationKey: {
          capacity: (req?.translationKey?.capacity ?? 0),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a translation key.
   */
  async startTranslationKeyWorkflow(req: localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowRequest): Promise<localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "StartTranslationKeyWorkflow", req);
    this.logger.info("start_translation_key_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: { updatedAt: req?.translationKey?.audit?.updatedAt },
        owner: { userId: (req?.translationKey?.owner?.userId ?? "") },
      },
      details: { contact: { name: req?.details?.notify?.name } },
    });
    const client1 = this.clients.get<customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient>("acme.customers.v1.CustomerSegmentValidationService");
    const invoke1: Unary<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse> =
      (input, done) => client1.lintCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowResponse.fromPartial({
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
        translationKey: { audit: { createdAt: reply1?.customerSegment?.audit?.createdAt } },
      }),
      localizationTranslationKeyWorkflowServiceApi.StartTranslationKeyWorkflowResponse.fromPartial({
        translationKey: {
          code: (req?.translationKey?.code ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }
}
