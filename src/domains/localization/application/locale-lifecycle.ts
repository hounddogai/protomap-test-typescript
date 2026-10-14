/**
 * Moves a locale between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as chatChatRoomServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as experimentsExperimentReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as experimentsVariantWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_workflow_service.js";
import * as localizationLocaleLifecycleServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import * as localizationLocaleQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationAffinityWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_workflow_service.js";
import * as telehealthVideoVisitQueryServiceApi from "../../../../.cache/proto/acme/telehealth/v1/video_visit_query_service.js";
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
import { collect, upload, write } from "../../../platform/streams.js";
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
export class LocaleLifecycleWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentReportingService") private readonly experimentsExperimentReportingClient: experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentWorkflowService") private readonly experimentsExperimentWorkflowClient: experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient,
    @inject("grpc:acme.experiments.v1.VariantWorkflowService") private readonly experimentsVariantWorkflowClient: experimentsVariantWorkflowServiceApi.VariantWorkflowServiceClient,
    @inject("grpc:acme.localization.v1.LocaleQueryService") private readonly localizationLocaleQueryClient: localizationLocaleQueryServiceApi.LocaleQueryServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobReportingService") private readonly localizationTranslationJobReportingClient: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyQueryService") private readonly localizationTranslationKeyQueryClient: localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityApprovalService") private readonly personalizationAffinityApprovalClient: personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityWorkflowService") private readonly personalizationAffinityWorkflowClient: personalizationAffinityWorkflowServiceApi.AffinityWorkflowServiceClient,
    @inject("grpc:acme.telehealth.v1.VideoVisitQueryService") private readonly telehealthVideoVisitQueryClient: telehealthVideoVisitQueryServiceApi.VideoVisitQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a locale.
   */
  async activateLocale(req: localizationLocaleLifecycleServiceApi.ActivateLocaleRequest): Promise<localizationLocaleLifecycleServiceApi.ActivateLocaleResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateLocale", req);
    this.logger.info("activate_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse> =
      (input, done) => this.localizationTranslationJobReportingClient.scheduleTranslationJobReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse>(invoke1, request1);
    const request2 = customersPreferenceCalculationServiceApi.EstimatePreferenceRequest.fromPartial({
      context: req?.context,
      preference: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<customersPreferenceCalculationServiceApi.EstimatePreferenceRequest, customersPreferenceCalculationServiceApi.EstimatePreferenceResponse> =
      (input, done) => this.customersPreferenceCalculationClient.estimatePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersPreferenceCalculationServiceApi.EstimatePreferenceRequest, customersPreferenceCalculationServiceApi.EstimatePreferenceResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      localizationLocaleLifecycleServiceApi.ActivateLocaleResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      localizationLocaleLifecycleServiceApi.ActivateLocaleResponse.fromPartial({
        locale: {
          owner: { displayName: (reply2?.preference?.owner?.displayName ?? "") },
          version: (reply2?.preference?.version ?? 0),
        },
      }),
      localizationLocaleLifecycleServiceApi.ActivateLocaleResponse.fromPartial({
        locale: { localeId: (req?.localeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a locale.
   */
  async expireLocale(req: localizationLocaleLifecycleServiceApi.ExpireLocaleRequest): Promise<localizationLocaleLifecycleServiceApi.ExpireLocaleResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireLocale", req);
    this.logger.info("expire_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input1?.annotations ?? {}))),
      context: input1?.context,
    });
    const invoke1: Unary<localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse> =
      (input, done) => this.localizationTranslationJobReportingClient.scheduleTranslationJobReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse>(invoke1, request1);
    const request2 = localizationLocaleQueryServiceApi.BrowseLocalesRequest.fromPartial({
      context: req?.context,
      filter: { labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))) },
    });
    const cloned2: localizationLocaleQueryServiceApi.BrowseLocalesRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<localizationLocaleQueryServiceApi.BrowseLocalesRequest, localizationLocaleQueryServiceApi.BrowseLocalesResponse> =
      (input, done) => this.localizationLocaleQueryClient.browseLocales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleQueryServiceApi.BrowseLocalesRequest, localizationLocaleQueryServiceApi.BrowseLocalesResponse>(invoke2, cloned2);
    const request3 = personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
      },
    });
    const decoded3 = personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsRequest.toJSON(request3))),
    );
    const invoke3: Unary<personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsRequest, personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsResponse> =
      (input, done) => this.personalizationAffinityWorkflowClient.listAffinityWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsRequest, personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsResponse>(invoke3, decoded3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleLifecycleServiceApi.ExpireLocaleResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      localizationLocaleLifecycleServiceApi.ExpireLocaleResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      localizationLocaleLifecycleServiceApi.ExpireLocaleResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      localizationLocaleLifecycleServiceApi.ExpireLocaleResponse.fromPartial({
        locale: { localeId: (req?.localeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a locale.
   */
  async getLocaleLifecycle(req: localizationLocaleLifecycleServiceApi.GetLocaleLifecycleRequest): Promise<localizationLocaleLifecycleServiceApi.GetLocaleLifecycleResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetLocaleLifecycle", req);
    this.logger.info("get_locale_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentReportingServiceApi.StreamExperimentMetricsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.localeId ?? ""),
      },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream1 = this.experimentsExperimentReportingClient.streamExperimentMetrics(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? experimentsExperimentReportingServiceApi.StreamExperimentMetricsResponse.fromPartial({});
    const request2 = localizationTranslationJobReportingServiceApi.StreamTranslationJobMetricsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        ownerId: (req?.localeId ?? ""),
      },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream2 = this.localizationTranslationJobReportingClient.streamTranslationJobMetrics(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? localizationTranslationJobReportingServiceApi.StreamTranslationJobMetricsResponse.fromPartial({});
    return localizationLocaleLifecycleServiceApi.GetLocaleLifecycleResponse.fromPartial({ locale: { localeId: (req?.localeId ?? "") } });
  }

  /**
   * Reinstates a locale.
   */
  async reinstateLocale(req: localizationLocaleLifecycleServiceApi.ReinstateLocaleRequest): Promise<localizationLocaleLifecycleServiceApi.ReinstateLocaleResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateLocale", req);
    this.logger.info("reinstate_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest.fromPartial({
      context: req?.context,
      customerSegment: { owner: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.RecalculateCustomerSegmentsRequest",
      value: Buffer.from(customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest.encode(request1).finish()),
    });
    const unpacked1 = customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest.decode(envelope1.value);
    const invoke1: Unary<customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest, customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.recalculateCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsRequest, customersCustomerSegmentCalculationServiceApi.RecalculateCustomerSegmentsResponse>(invoke1, unpacked1);
    const request2 = experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{ contact: { email: (req?.details?.notifyContact?.email ?? "") } }],
      },
    });
    const client2 = this.clients.get<experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient>("acme.experiments.v1.ExperimentWorkflowService");
    const invoke2: Unary<experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowResponse> =
      (input, done) => client2.pauseExperimentWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleLifecycleServiceApi.ReinstateLocaleResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      localizationLocaleLifecycleServiceApi.ReinstateLocaleResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      localizationLocaleLifecycleServiceApi.ReinstateLocaleResponse.fromPartial({
        locale: { localeId: (req?.localeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews a locale.
   */
  async renewLocale(req: localizationLocaleLifecycleServiceApi.RenewLocaleRequest): Promise<localizationLocaleLifecycleServiceApi.RenewLocaleResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewLocale", req);
    this.logger.info("renew_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyQueryServiceApi.ExportTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const stream1 = this.localizationTranslationKeyQueryClient.exportTranslationKeys(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? localizationTranslationKeyQueryServiceApi.ExportTranslationKeysResponse.fromPartial({});
    const request2 = customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest.fromPartial({
      consentRecord: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      context: req?.context,
      details: { contact: { phone: (req?.details?.notifyContact?.phone ?? "") } },
    });
    const invoke2: Unary<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.previewConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
      translationKey: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const invoke3: Unary<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.recalculateTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse>(invoke3, request3));
    const request4 = communityPostApprovalServiceApi.RecallPostRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (reply3?.translationKey?.owner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
      post: {
        audit: { createdBy: (reply3?.translationKey?.audit?.createdBy ?? "") },
        lines: [{
          description: (reply3?.translationKey?.components?.["primary"]?.description ?? ""),
        }],
      },
    });
    const invoke4: Unary<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse> =
      (input, done) => this.communityPostApprovalClient.recallPost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("RenewLocale.RecallPost", () => call<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      localizationLocaleLifecycleServiceApi.RenewLocaleResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      localizationLocaleLifecycleServiceApi.RenewLocaleResponse.fromPartial({
        locale: { name: (reply3?.translationKey?.name ?? "") },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      localizationLocaleLifecycleServiceApi.RenewLocaleResponse.fromPartial({ outcome: { effectiveAt: reply4?.outcome?.effectiveAt } }),
      localizationLocaleLifecycleServiceApi.RenewLocaleResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          owner: { userId: (req?.details?.newOwner?.userId ?? "") },
        },
      }),
    );
  }

  /**
   * Schedules a locale.
   */
  async scheduleLocaleExpiry(req: localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryRequest): Promise<localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "ScheduleLocaleExpiry", req);
    this.logger.info("schedule_locale_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest.fromPartial({
      context: req?.context,
      translationJob: { assignee: { email: (req?.details?.notify?.email ?? "") } },
    });
    const invoke1: Unary<localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest, localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.recalculateTranslationJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = personalizationAffinityApprovalServiceApi.RecallAffinityRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (reply1?.translationJob?.assignee?.displayName ?? "") },
      },
    });
    const reply2 = await this.workQueue.enqueue<personalizationAffinityApprovalServiceApi.RecallAffinityRequest, personalizationAffinityApprovalServiceApi.RecallAffinityResponse>(
      "acme.localization.v1.LocaleLifecycleService/ScheduleLocaleExpiry:1", request2,
    );
    let selected3_1: string | undefined;
    switch (req?.locale?.action?.$case) {
      case "block":
        selected3_1 = ((req?.locale?.action?.$case === "block" ? req?.locale?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        action: { $case: "block", block: { reason: (selected3_1 ?? "") } },
        owner: { userId: (reply1?.translationJob?.assignee?.userId ?? "") },
      },
    });
    const invoke3: Unary<customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest, customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.compareCustomerSegmentOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest, customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsResponse>(invoke3, request3);
    const request4 = personalizationAffinitySyncServiceApi.StreamAffinityChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.context?.deadline,
        source: (req?.context?.actor?.userId ?? ""),
        subject: { displayName: (req?.locale?.owner?.displayName ?? "") },
      } },
      context: req?.context,
    });
    const stream4 = this.personalizationAffinitySyncClient.streamAffinityChanges(metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const reading4 = collect(stream4);
    const writing4 = (async () => {
      await write(stream4, request4);
      stream4.end();
    })();
    const [messages4] = await Promise.all([reading4, writing4]);
    const reply4 = messages4.at(-1) ?? personalizationAffinitySyncServiceApi.StreamAffinityChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryResponse.fromPartial({ locale: { priority: (reply1?.translationJob?.priority ?? 0) } }),
      localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryResponse.fromPartial({
        outcome: {
          referenceId: (reply2?.outcome?.referenceId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryResponse.fromPartial({
        locale: {
          audit: { etag: (reply3?.customerSegment?.audit?.etag ?? "") },
          owner: { email: (reply3?.customerSegment?.owner?.email ?? "") },
        },
      }),
      localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          parameters: (req?.details?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Suspends a locale.
   */
  async suspendLocale(req: localizationLocaleLifecycleServiceApi.SuspendLocaleRequest): Promise<localizationLocaleLifecycleServiceApi.SuspendLocaleResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendLocale", req);
    this.logger.info("suspend_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleValidationServiceApi.PreviewLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<localizationLocaleValidationServiceApi.PreviewLocaleRequest, localizationLocaleValidationServiceApi.PreviewLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.previewLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<localizationLocaleValidationServiceApi.PreviewLocaleResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = customersCustomerQueryServiceApi.ResolveCustomersRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<customersCustomerQueryServiceApi.ResolveCustomersRequest, customersCustomerQueryServiceApi.ResolveCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient.resolveCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = localizationLocaleValidationServiceApi.GetLocaleRulesRequest.fromPartial({
      context: req?.context,
      localeId: (req?.localeId ?? ""),
    });
    const invoke3: Unary<localizationLocaleValidationServiceApi.GetLocaleRulesRequest, localizationLocaleValidationServiceApi.GetLocaleRulesResponse> =
      (input, done) => this.localizationLocaleValidationClient.getLocaleRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = chatChatRoomServiceApi.BatchCreateChatRoomsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.details?.notifyContact,
      } },
    });
    const reply4 = await upload<chatChatRoomServiceApi.BatchCreateChatRoomsRequest, chatChatRoomServiceApi.BatchCreateChatRoomsResponse>(
      (done) => this.chatChatRoomClient.batchCreateChatRooms(metadataFor(request4.context), { deadline: Date.now() + 15_000 }, done), [request4],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleLifecycleServiceApi.SuspendLocaleResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      localizationLocaleLifecycleServiceApi.SuspendLocaleResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      localizationLocaleLifecycleServiceApi.SuspendLocaleResponse.fromPartial({
        locale: {
          owner: { displayName: (reply3?.locale?.owner?.displayName ?? "") },
          version: (reply3?.locale?.version ?? 0),
        },
      }),
      localizationLocaleLifecycleServiceApi.SuspendLocaleResponse.fromPartial({
        locale: { localeId: (req?.localeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates a locale.
   */
  async terminateLocale(req: localizationLocaleLifecycleServiceApi.TerminateLocaleRequest): Promise<localizationLocaleLifecycleServiceApi.TerminateLocaleResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateLocale", req);
    this.logger.info("terminate_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantWorkflowServiceApi.ListVariantWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const method1 = "listVariantWorkflows" as const;
    const invoke1: Unary<experimentsVariantWorkflowServiceApi.ListVariantWorkflowsRequest, experimentsVariantWorkflowServiceApi.ListVariantWorkflowsResponse> =
      (input, done) => this.experimentsVariantWorkflowClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantWorkflowServiceApi.ListVariantWorkflowsRequest, experimentsVariantWorkflowServiceApi.ListVariantWorkflowsResponse>(invoke1, request1);
    const request2 = telehealthVideoVisitQueryServiceApi.BrowseVideoVisitsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
      },
    });
    const proxy2 = forwarding(this.telehealthVideoVisitQueryClient);
    const invoke2: Unary<telehealthVideoVisitQueryServiceApi.BrowseVideoVisitsRequest, telehealthVideoVisitQueryServiceApi.BrowseVideoVisitsResponse> =
      (input, done) => proxy2.browseVideoVisits(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<telehealthVideoVisitQueryServiceApi.BrowseVideoVisitsRequest, telehealthVideoVisitQueryServiceApi.BrowseVideoVisitsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleLifecycleServiceApi.TerminateLocaleResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      localizationLocaleLifecycleServiceApi.TerminateLocaleResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      localizationLocaleLifecycleServiceApi.TerminateLocaleResponse.fromPartial({
        locale: { localeId: (req?.localeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}
