/**
 * Routes locales through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as commonMoneyApi from "../../../../.cache/proto/acme/common/v1/money.js";
import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as experimentsVariantReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as localizationLocaleLifecycleServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import * as localizationLocaleQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as localizationTranslationKeyServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as notificationsNotificationExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as personalizationRecommendationApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_approval_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
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
import { toLocaleRecord } from "../data/records.js";
import { LocalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate locale operations and persist audit data.
 */
@injectable()
export class LocaleApprovalWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.experiments.v1.VariantReportingService") private readonly experimentsVariantReportingClient: experimentsVariantReportingServiceApi.VariantReportingServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.localization.v1.LocaleLifecycleService") private readonly localizationLocaleLifecycleClient: localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient,
    @inject("grpc:acme.localization.v1.LocaleQueryService") private readonly localizationLocaleQueryClient: localizationLocaleQueryServiceApi.LocaleQueryServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobValidationService") private readonly localizationTranslationJobValidationClient: localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyService") private readonly localizationTranslationKeyClient: localizationTranslationKeyServiceApi.TranslationKeyServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationExportService") private readonly notificationsNotificationExportClient: notificationsNotificationExportServiceApi.NotificationExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationApprovalService") private readonly personalizationRecommendationApprovalClient: personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a locale.
   */
  async approveLocale(req: localizationLocaleApprovalServiceApi.ApproveLocaleRequest): Promise<localizationLocaleApprovalServiceApi.ApproveLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "ApproveLocale", req);
    this.logger.info("approve_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleValidationServiceApi.PreviewLocaleRequest.fromPartial({
      context: req?.context,
      locale: { owner: { userId: (req?.locale?.owner?.userId ?? "") } },
    });
    const decoded1 = localizationLocaleValidationServiceApi.PreviewLocaleRequest.fromJSON(
      JSON.parse(JSON.stringify(localizationLocaleValidationServiceApi.PreviewLocaleRequest.toJSON(request1))),
    );
    const invoke1: Unary<localizationLocaleValidationServiceApi.PreviewLocaleRequest, localizationLocaleValidationServiceApi.PreviewLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.previewLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleValidationServiceApi.PreviewLocaleRequest, localizationLocaleValidationServiceApi.PreviewLocaleResponse>(invoke1, decoded1);
    const request2 = localizationLocaleQueryServiceApi.LookupLocaleRequest.fromPartial({
      context: req?.context,
      localeId: (req?.localeId ?? ""),
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.LookupLocaleRequest",
      value: Buffer.from(localizationLocaleQueryServiceApi.LookupLocaleRequest.encode(request2).finish()),
    });
    const unpacked2 = localizationLocaleQueryServiceApi.LookupLocaleRequest.decode(envelope2.value);
    const invoke2: Unary<localizationLocaleQueryServiceApi.LookupLocaleRequest, localizationLocaleQueryServiceApi.LookupLocaleResponse> =
      (input, done) => this.localizationLocaleQueryClient.lookupLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleQueryServiceApi.LookupLocaleRequest, localizationLocaleQueryServiceApi.LookupLocaleResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleApprovalServiceApi.ApproveLocaleResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      localizationLocaleApprovalServiceApi.ApproveLocaleResponse.fromPartial({ locale: { name: (reply2?.locale?.name ?? "") } }),
      localizationLocaleApprovalServiceApi.ApproveLocaleResponse.fromPartial({
        locale: {
          description: (req?.locale?.description ?? ""),
          localeId: (req?.localeId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a locale.
   */
  async commentLocaleApproval(req: localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest): Promise<localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "CommentLocaleApproval", req);
    this.logger.info("comment_locale_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest.fromPartial({
      consentRecord: { subject: { displayName: (req?.locale?.owner?.displayName ?? "") } },
      context: req?.context,
    });
    const client1 = this.clients.get<customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient>("acme.customers.v1.ConsentRecordValidationService");
    const invoke1: Unary<customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest, customersConsentRecordValidationServiceApi.ScoreConsentRecordResponse> =
      (input, done) => client1.scoreConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest, customersConsentRecordValidationServiceApi.ScoreConsentRecordResponse>(invoke1, request1);
    const request2 = personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.details?.approver?.userId ?? "") } },
      recommendation: { lines: [{ description: (req?.locale?.description ?? "") }] },
    });
    const invoke2: Unary<personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalRequest, personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalResponse> =
      (input, done) => this.personalizationRecommendationApprovalClient.commentRecommendationApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalRequest, personalizationRecommendationApprovalServiceApi.CommentRecommendationApprovalResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse.fromPartial({
        locale: {
          owner: { displayName: (reply1?.consentRecord?.subject?.displayName ?? "") },
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse.fromPartial({
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse.fromPartial({
        locale: {
          description: (req?.locale?.description ?? ""),
          localeId: (req?.localeId ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a locale.
   */
  async delegateLocaleApproval(req: localizationLocaleApprovalServiceApi.DelegateLocaleApprovalRequest): Promise<localizationLocaleApprovalServiceApi.DelegateLocaleApprovalResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "DelegateLocaleApproval", req);
    this.logger.info("delegate_locale_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantSyncServiceApi.PushVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        audit: {
          createdAt: req?.locale?.audit?.createdAt,
          etag: (req?.locale?.audit?.etag ?? ""),
        },
        owner: { email: (req?.locale?.owner?.email ?? "") },
        action: { $case: "route", route: {
          weight: ((req?.locale?.action?.$case === "route" ? req?.locale?.action.route : undefined)?.weight ?? 0),
        } },
      },
    });
    const invoke1: Unary<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse> =
      (input, done) => this.experimentsVariantSyncClient.pushVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleApprovalServiceApi.DelegateLocaleApprovalResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      localizationLocaleApprovalServiceApi.DelegateLocaleApprovalResponse.fromPartial({
        locale: {
          effective: req?.locale?.effective,
          localeId: (req?.localeId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a locale.
   */
  async escalateLocale(req: localizationLocaleApprovalServiceApi.EscalateLocaleRequest): Promise<localizationLocaleApprovalServiceApi.EscalateLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "EscalateLocale", req);
    this.logger.info("escalate_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleLifecycleServiceApi.ActivateLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: { displayName: (req?.locale?.owner?.displayName ?? "") },
        notifyContact: { email: (req?.details?.approver?.email ?? "") },
      },
      localeId: (req?.locale?.localeId ?? ""),
    });
    const invoke1: Unary<localizationLocaleLifecycleServiceApi.ActivateLocaleRequest, localizationLocaleLifecycleServiceApi.ActivateLocaleResponse> =
      (input, done) => this.localizationLocaleLifecycleClient.activateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("EscalateLocale.ActivateLocale", () => call<localizationLocaleLifecycleServiceApi.ActivateLocaleRequest, localizationLocaleLifecycleServiceApi.ActivateLocaleResponse>(invoke1, request1));
    const request2 = localizationLocaleLifecycleServiceApi.SuspendLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: {
          displayName: (req?.locale?.owner?.displayName ?? ""),
          email: (req?.locale?.owner?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
        notifyContact: { email: (req?.details?.approver?.email ?? "") },
      },
      localeId: (req?.locale?.localeId ?? ""),
    });
    const invoke2: Unary<localizationLocaleLifecycleServiceApi.SuspendLocaleRequest, localizationLocaleLifecycleServiceApi.SuspendLocaleResponse> =
      (input, done) => this.localizationLocaleLifecycleClient.suspendLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleApprovalServiceApi.EscalateLocaleResponse.fromPartial({
        locale: {
          audit: { createdAt: reply1?.locale?.audit?.createdAt },
          owner: { email: (reply1?.locale?.owner?.email ?? "") },
        },
      }),
      localizationLocaleApprovalServiceApi.EscalateLocaleResponse.fromPartial({
        locale: { audit: { updatedAt: reply2?.locale?.audit?.updatedAt } },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      localizationLocaleApprovalServiceApi.EscalateLocaleResponse.fromPartial({
        locale: {
          effective: req?.locale?.effective,
          localeId: (req?.localeId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a locale.
   */
  async getLocaleApprovalStatus(req: localizationLocaleApprovalServiceApi.GetLocaleApprovalStatusRequest): Promise<localizationLocaleApprovalServiceApi.GetLocaleApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetLocaleApprovalStatus", req);
    this.logger.info("get_locale_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest.fromPartial({
      context: req?.context,
      translationJob: { assignee: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest, localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse>(
      "acme.localization.v1.LocaleApprovalService/GetLocaleApprovalStatus:0", request1,
    );
    return mergeResponses(
      localizationLocaleApprovalServiceApi.GetLocaleApprovalStatusResponse.fromPartial({
        locale: {
          audit: { createdBy: (reply1?.translationJob?.audit?.createdBy ?? "") },
        },
      }),
      localizationLocaleApprovalServiceApi.GetLocaleApprovalStatusResponse.fromPartial({ locale: { localeId: (req?.localeId ?? "") } }),
    );
  }

  /**
   * Lists locales a page at a time.
   */
  async listPendingLocales(req: localizationLocaleApprovalServiceApi.ListPendingLocalesRequest): Promise<localizationLocaleApprovalServiceApi.ListPendingLocalesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingLocales", req);
    this.logger.info("list_pending_locales", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationLocaleApprovalServiceApi.ListPendingLocalesResponse.fromPartial({});
  }

  /**
   * Recalls a locale.
   */
  async recallLocale(req: localizationLocaleApprovalServiceApi.RecallLocaleRequest): Promise<localizationLocaleApprovalServiceApi.RecallLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "RecallLocale", req);
    this.logger.info("recall_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_4: commonMoneyApi.Money | undefined;
    switch (req?.locale?.action?.$case) {
      case "discount":
        selected1_4 = (req?.locale?.action?.$case === "discount" ? req?.locale?.action.discount : undefined)?.amount;
        break;
      default:
        selected1_4 = undefined;
    }
    const request1 = customersPreferenceValidationServiceApi.PreviewPreferenceRequest.fromPartial({
      context: req?.context,
      preference: {
        audit: { createdBy: (req?.locale?.audit?.createdBy ?? "") },
        action: { $case: "discount", discount: { amount: selected1_4 } },
        owner: {
          displayName: (req?.locale?.owner?.displayName ?? ""),
          email: (req?.locale?.owner?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<customersPreferenceValidationServiceApi.PreviewPreferenceRequest, customersPreferenceValidationServiceApi.PreviewPreferenceResponse> =
      (input, done) => this.customersPreferenceValidationClient.previewPreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersPreferenceValidationServiceApi.PreviewPreferenceRequest, customersPreferenceValidationServiceApi.PreviewPreferenceResponse>(invoke1, request1);
    const request2 = notificationsNotificationExportServiceApi.RetryNotificationExportRequest.fromPartial({
      context: req?.context,
      notification: { requester: { email: (req?.locale?.owner?.email ?? "") } },
    });
    const invoke2: Unary<notificationsNotificationExportServiceApi.RetryNotificationExportRequest, notificationsNotificationExportServiceApi.RetryNotificationExportResponse> =
      (input, done) => this.notificationsNotificationExportClient.retryNotificationExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<notificationsNotificationExportServiceApi.RetryNotificationExportResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleApprovalServiceApi.RecallLocaleResponse.fromPartial({
        locale: { owner: { userId: (reply1?.preference?.owner?.userId ?? "") } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      localizationLocaleApprovalServiceApi.RecallLocaleResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      localizationLocaleApprovalServiceApi.RecallLocaleResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          version: (req?.locale?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Rejects a locale.
   */
  async rejectLocale(req: localizationLocaleApprovalServiceApi.RejectLocaleRequest): Promise<localizationLocaleApprovalServiceApi.RejectLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "RejectLocale", req);
    this.logger.info("reject_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantReportingServiceApi.ListVariantReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.locale?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.locale?.parameters ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
      },
    });
    const invoke1: Unary<experimentsVariantReportingServiceApi.ListVariantReportsRequest, experimentsVariantReportingServiceApi.ListVariantReportsResponse> =
      (input, done) => this.experimentsVariantReportingClient.listVariantReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = auditAuditEventValidationServiceApi.LintAuditEventsRequest.fromPartial({
      auditEvent: { subject: { displayName: (req?.locale?.owner?.displayName ?? "") } },
      context: req?.context,
    });
    const invoke2: Unary<auditAuditEventValidationServiceApi.LintAuditEventsRequest, auditAuditEventValidationServiceApi.LintAuditEventsResponse> =
      (input, done) => this.auditAuditEventValidationClient.lintAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = localizationTranslationKeyServiceApi.BatchGetTranslationKeysRequest.fromPartial({ context: req?.context });
    const method3 = "batchGetTranslationKeys" as const;
    const invoke3: Unary<localizationTranslationKeyServiceApi.BatchGetTranslationKeysRequest, localizationTranslationKeyServiceApi.BatchGetTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationKeyServiceApi.BatchGetTranslationKeysRequest, localizationTranslationKeyServiceApi.BatchGetTranslationKeysResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleApprovalServiceApi.RejectLocaleResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      localizationLocaleApprovalServiceApi.RejectLocaleResponse.fromPartial({
        locale: {
          owner: { displayName: (reply2?.auditEvent?.subject?.displayName ?? "") },
        },
        result: { message: (reply2?.outcome?.message ?? "") },
      }),
      localizationLocaleApprovalServiceApi.RejectLocaleResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          details: (reply3?.result?.details ?? {}),
        },
      }),
      localizationLocaleApprovalServiceApi.RejectLocaleResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          version: (req?.locale?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Submits a locale.
   */
  async submitLocale(req: localizationLocaleApprovalServiceApi.SubmitLocaleRequest): Promise<localizationLocaleApprovalServiceApi.SubmitLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "SubmitLocale", req);
    this.logger.info("submit_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
      notificationTemplate: {
        lines: [{
          tax: {
            amount: (req?.locale?.action?.$case === "discount" ? req?.locale?.action.discount : undefined)?.amount,
          },
        }],
      },
    });
    const proxy1 = forwarding(this.notificationsNotificationTemplateValidationClient);
    const invoke1: Unary<notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest, notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse> =
      (input, done) => proxy1.lintNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest, notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse>(invoke1, request1);
    const request2 = localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryRequest.fromPartial({
      context: req?.context,
      locale: { owner: { displayName: (req?.details?.approver?.displayName ?? "") } },
    });
    const invoke2: Unary<localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryRequest, localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryResponse> =
      (input, done) => this.localizationLocaleLifecycleClient.scheduleLocaleExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryRequest, localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryResponse>(invoke2, request2);
    const request3 = experimentsExposureReportingServiceApi.ShareExposureReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { recipient: { email: (req?.locale?.owner?.email ?? "") } },
      reason: ((reply2?.locale?.action?.$case === "block" ? reply2?.locale?.action.block : undefined)?.reason ?? ""),
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<experimentsExposureReportingServiceApi.ShareExposureReportRequest, experimentsExposureReportingServiceApi.ShareExposureReportResponse> =
      (input, done) => this.experimentsExposureReportingClient.shareExposureReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureReportingServiceApi.ShareExposureReportRequest, experimentsExposureReportingServiceApi.ShareExposureReportResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleApprovalServiceApi.SubmitLocaleResponse.fromPartial({
        locale: { audit: { etag: (reply1?.notificationTemplate?.audit?.etag ?? "") } },
      }),
      localizationLocaleApprovalServiceApi.SubmitLocaleResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      localizationLocaleApprovalServiceApi.SubmitLocaleResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      localizationLocaleApprovalServiceApi.SubmitLocaleResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          status: req?.locale?.status,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for LocaleApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class LocaleApprovalHandler {
  constructor(@inject(LocaleApprovalWorkflow) private readonly workflow: LocaleApprovalWorkflow) {}

  /**
   * Approves a locale.
   */
  approveLocale = unary<localizationLocaleApprovalServiceApi.ApproveLocaleRequest, localizationLocaleApprovalServiceApi.ApproveLocaleResponse>(
    (request) => this.workflow.approveLocale(request),
  );

  /**
   * Comments a locale.
   */
  commentLocaleApproval = unary<localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest, localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse>(
    (request) => this.workflow.commentLocaleApproval(request),
  );

  /**
   * Delegates a locale.
   */
  delegateLocaleApproval = (call: ServerUnaryCall<localizationLocaleApprovalServiceApi.DelegateLocaleApprovalRequest, localizationLocaleApprovalServiceApi.DelegateLocaleApprovalResponse>, done: sendUnaryData<localizationLocaleApprovalServiceApi.DelegateLocaleApprovalResponse>): void => {
    void this.workflow.delegateLocaleApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a locale.
   */
  escalateLocale = unary<localizationLocaleApprovalServiceApi.EscalateLocaleRequest, localizationLocaleApprovalServiceApi.EscalateLocaleResponse>(
    (request) => this.workflow.escalateLocale(request),
  );

  /**
   * Returns a locale.
   */
  getLocaleApprovalStatus = unary<localizationLocaleApprovalServiceApi.GetLocaleApprovalStatusRequest, localizationLocaleApprovalServiceApi.GetLocaleApprovalStatusResponse>(
    (request) => this.workflow.getLocaleApprovalStatus(request),
  );

  /**
   * Lists locales a page at a time.
   */
  listPendingLocales = (call: ServerUnaryCall<localizationLocaleApprovalServiceApi.ListPendingLocalesRequest, localizationLocaleApprovalServiceApi.ListPendingLocalesResponse>, done: sendUnaryData<localizationLocaleApprovalServiceApi.ListPendingLocalesResponse>): void => {
    void this.workflow.listPendingLocales(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a locale.
   */
  recallLocale = unary<localizationLocaleApprovalServiceApi.RecallLocaleRequest, localizationLocaleApprovalServiceApi.RecallLocaleResponse>(
    (request) => this.workflow.recallLocale(request),
  );

  /**
   * Rejects a locale.
   */
  rejectLocale = unary<localizationLocaleApprovalServiceApi.RejectLocaleRequest, localizationLocaleApprovalServiceApi.RejectLocaleResponse>(
    (request) => this.workflow.rejectLocale(request),
  );

  /**
   * Submits a locale.
   */
  submitLocale = (call: ServerUnaryCall<localizationLocaleApprovalServiceApi.SubmitLocaleRequest, localizationLocaleApprovalServiceApi.SubmitLocaleResponse>, done: sendUnaryData<localizationLocaleApprovalServiceApi.SubmitLocaleResponse>): void => {
    void this.workflow.submitLocale(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: LocaleApprovalHandler): localizationLocaleApprovalServiceApi.LocaleApprovalServiceServer {
  return {
    approveLocale: handler.approveLocale,
    commentLocaleApproval: handler.commentLocaleApproval,
    delegateLocaleApproval: handler.delegateLocaleApproval,
    escalateLocale: handler.escalateLocale,
    getLocaleApprovalStatus: handler.getLocaleApprovalStatus,
    listPendingLocales: handler.listPendingLocales,
    recallLocale: handler.recallLocale,
    rejectLocale: handler.rejectLocale,
    submitLocale: handler.submitLocale,
  };
}
