/**
 * Routes translation jobs through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as experimentsExperimentLifecycleServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_lifecycle_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as localizationLocaleLifecycleServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationJobApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_approval_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
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
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation job operations and persist audit data.
 */
@injectable()
export class TranslationJobApprovalWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExperimentLifecycleService") private readonly experimentsExperimentLifecycleClient: experimentsExperimentLifecycleServiceApi.ExperimentLifecycleServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.localization.v1.LocaleCalculationService") private readonly localizationLocaleCalculationClient: localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleLifecycleService") private readonly localizationLocaleLifecycleClient: localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobValidationService") private readonly localizationTranslationJobValidationClient: localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyApprovalService") private readonly localizationTranslationKeyApprovalClient: localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionHistoryService") private readonly notificationsSubscriptionHistoryClient: notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationApprovalService") private readonly personalizationRecommendationApprovalClient: personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a translation job.
   */
  async approveTranslationJob(req: localizationTranslationJobApprovalServiceApi.ApproveTranslationJobRequest): Promise<localizationTranslationJobApprovalServiceApi.ApproveTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "ApproveTranslationJob", req);
    this.logger.info("approve_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.translationJob?.origin?.$case) {
      case "customer":
        selected1_1 = ((req?.translationJob?.origin?.$case === "customer" ? req?.translationJob?.origin.customer : undefined)?.email ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = localizationLocaleCalculationServiceApi.CalculateLocaleRequest.fromPartial({
      context: req?.context,
      locale: { owner: { email: (selected1_1 ?? "") } },
    });
    const invoke1: Unary<localizationLocaleCalculationServiceApi.CalculateLocaleRequest, localizationLocaleCalculationServiceApi.CalculateLocaleResponse> =
      (input, done) => this.localizationLocaleCalculationClient.calculateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleCalculationServiceApi.CalculateLocaleRequest, localizationLocaleCalculationServiceApi.CalculateLocaleResponse>(invoke1, request1);
    const request2 = localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest.fromPartial({
      context: req?.context,
      translationJob: {
        audit: { createdBy: (req?.translationJob?.audit?.createdBy ?? "") },
        origin: { $case: "customer", customer: {
          customerId: ((req?.translationJob?.origin?.$case === "customer" ? req?.translationJob?.origin.customer : undefined)?.customerId ?? ""),
          email: (reply1?.locale?.owner?.email ?? ""),
        } },
        requester: { email: (req?.translationJob?.assignee?.email ?? "") },
      },
    });
    const decoded2 = localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest.fromJSON(
      JSON.parse(JSON.stringify(localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest.toJSON(request2))),
    );
    const invoke2: Unary<localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest, localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.compareTranslationJobOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest, localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobApprovalServiceApi.ApproveTranslationJobResponse.fromPartial({
        translationJob: {
          assignee: { email: (reply1?.locale?.owner?.email ?? "") },
          audit: { updatedAt: reply1?.locale?.audit?.updatedAt },
        },
      }),
      localizationTranslationJobApprovalServiceApi.ApproveTranslationJobResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      localizationTranslationJobApprovalServiceApi.ApproveTranslationJobResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        translationJob: { translationJobId: (req?.translationJobId ?? "") },
      }),
    );
  }

  /**
   * Comments a translation job.
   */
  async commentTranslationJobApproval(req: localizationTranslationJobApprovalServiceApi.CommentTranslationJobApprovalRequest): Promise<localizationTranslationJobApprovalServiceApi.CommentTranslationJobApprovalResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "CommentTranslationJobApproval", req);
    this.logger.info("comment_translation_job_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: { userId: (req?.translationJob?.assignee?.userId ?? "") },
        audit: {
          createdBy: (req?.translationJob?.audit?.createdBy ?? ""),
          updatedAt: req?.translationJob?.audit?.updatedAt,
        },
        origin: { $case: "channel", channel: {
          channel: ((req?.translationJob?.origin?.$case === "channel" ? req?.translationJob?.origin.channel : undefined)?.channel ?? ""),
        } },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.ValidateTranslationJobRequest",
      value: Buffer.from(localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest.encode(request1).finish()),
    });
    const unpacked1 = localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest.decode(envelope1.value);
    const invoke1: Unary<localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest, localizationTranslationJobValidationServiceApi.ValidateTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobValidationClient.validateTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest, localizationTranslationJobValidationServiceApi.ValidateTranslationJobResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobApprovalServiceApi.CommentTranslationJobApprovalResponse.fromPartial({
        result: { details: (reply1?.result?.details ?? {}) },
        translationJob: { translationJobId: (reply1?.translationJob?.translationJobId ?? "") },
      }),
      localizationTranslationJobApprovalServiceApi.CommentTranslationJobApprovalResponse.fromPartial({
        translationJob: {
          customFields: (req?.translationJob?.customFields ?? {}),
          subject: (req?.translationJob?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a translation job.
   */
  async delegateTranslationJobApproval(req: localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalRequest): Promise<localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "DelegateTranslationJobApproval", req);
    this.logger.info("delegate_translation_job_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.translationJob?.requester?.email ?? ""),
          name: req?.translationJob?.requester?.name,
        },
      },
    });
    const client1 = this.clients.get<notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient>("acme.notifications.v1.NotificationNotificationService");
    const invoke1: Unary<notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse> =
      (input, done) => client1.unsubscribeNotificationUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse>(invoke1, request1);
    const request2 = localizationLocaleApprovalServiceApi.RecallLocaleRequest.fromPartial({
      context: req?.context,
      locale: {
        audit: {
          createdBy: (req?.translationJob?.audit?.createdBy ?? ""),
          updatedAt: reply1?.notification?.audit?.updatedAt,
        },
        owner: {
          displayName: ((reply1?.notification?.origin?.$case === "customer" ? reply1?.notification?.origin.customer : undefined)?.displayName ?? ""),
          userId: (req?.translationJob?.assignee?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<localizationLocaleApprovalServiceApi.RecallLocaleRequest, localizationLocaleApprovalServiceApi.RecallLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient.recallLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<localizationLocaleApprovalServiceApi.RecallLocaleRequest, localizationLocaleApprovalServiceApi.RecallLocaleResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalResponse.fromPartial({
        translationJob: { audit: { createdBy: (reply1?.notification?.audit?.createdBy ?? "") } },
      }),
      localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalResponse.fromPartial({
        translationJob: {
          requester: req?.translationJob?.requester,
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a translation job.
   */
  async escalateTranslationJob(req: localizationTranslationJobApprovalServiceApi.EscalateTranslationJobRequest): Promise<localizationTranslationJobApprovalServiceApi.EscalateTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "EscalateTranslationJob", req);
    this.logger.info("escalate_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryRequest.fromPartial({
      context: req?.context,
      locale: {
        owner: {
          displayName: ((req?.translationJob?.origin?.$case === "customer" ? req?.translationJob?.origin.customer : undefined)?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryRequest, localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryResponse> =
      (input, done) => this.localizationLocaleLifecycleClient.scheduleLocaleExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryRequest, localizationLocaleLifecycleServiceApi.ScheduleLocaleExpiryResponse>(invoke1, request1));
    const request2 = experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{
          contact: {
            email: (req?.translationJob?.assignee?.email ?? ""),
            name: req?.translationJob?.requester?.name,
            preferredChannel: (req?.translationJob?.requester?.preferredChannel ?? ""),
          },
        }],
      },
    });
    const invoke2: Unary<experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryRequest, experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryResponse> =
      (input, done) => this.experimentsExperimentLifecycleClient.scheduleExperimentExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("EscalateTranslationJob.ScheduleExperimentExpiry", () => call<experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryRequest, experimentsExperimentLifecycleServiceApi.ScheduleExperimentExpiryResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobApprovalServiceApi.EscalateTranslationJobResponse.fromPartial({ outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) } }),
      localizationTranslationJobApprovalServiceApi.EscalateTranslationJobResponse.fromPartial({
        translationJob: {
          audit: {
            etag: (reply2?.experiment?.audit?.etag ?? ""),
            updatedBy: (reply2?.experiment?.audit?.updatedBy ?? ""),
          },
        },
      }),
      localizationTranslationJobApprovalServiceApi.EscalateTranslationJobResponse.fromPartial({
        translationJob: {
          subject: (req?.translationJob?.subject ?? ""),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Lists translation jobs a page at a time.
   */
  async listPendingTranslationJobs(req: localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsRequest): Promise<localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingTranslationJobs", req);
    this.logger.info("list_pending_translation_jobs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileReportingServiceApi.ListProfileReportsRequest.fromPartial({
      context: req?.context,
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const invoke1: Unary<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse> =
      (input, done) => this.personalizationProfileReportingClient.listProfileReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } });
  }

  /**
   * Recalls a translation job.
   */
  async recallTranslationJob(req: localizationTranslationJobApprovalServiceApi.RecallTranslationJobRequest): Promise<localizationTranslationJobApprovalServiceApi.RecallTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "RecallTranslationJob", req);
    this.logger.info("recall_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          preferredChannel: (req?.translationJob?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse>(
      "acme.localization.v1.TranslationJobApprovalService/RecallTranslationJob:0", request1,
    );
    let selected2_1: string | undefined;
    switch (reply1?.notification?.origin?.$case) {
      case "customer":
        selected2_1 = ((reply1?.notification?.origin?.$case === "customer" ? reply1?.notification?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (selected2_1 ?? "") } },
    });
    const invoke2: Unary<notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.compareDeliveryAttemptVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobApprovalServiceApi.RecallTranslationJobResponse.fromPartial({
        translationJob: {
          assignee: reply1?.notification?.assignee,
          requester: { email: (reply1?.notification?.assignee?.email ?? "") },
        },
      }),
      localizationTranslationJobApprovalServiceApi.RecallTranslationJobResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      localizationTranslationJobApprovalServiceApi.RecallTranslationJobResponse.fromPartial({
        translationJob: {
          priority: (req?.translationJob?.priority ?? 0),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a translation job.
   */
  async rejectTranslationJob(req: localizationTranslationJobApprovalServiceApi.RejectTranslationJobRequest): Promise<localizationTranslationJobApprovalServiceApi.RejectTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "RejectTranslationJob", req);
    this.logger.info("reject_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.translationJob?.requester?.email ?? "") } },
    });
    const invoke1: Unary<localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyApprovalClient.submitTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: { createdAt: reply1?.translationKey?.audit?.createdAt },
        owner: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.AnnotateSubscriptionVersionResponse> =
      (input, done) => this.notificationsSubscriptionHistoryClient.annotateSubscriptionVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobApprovalServiceApi.RejectTranslationJobResponse.fromPartial({ outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) } }),
      localizationTranslationJobApprovalServiceApi.RejectTranslationJobResponse.fromPartial({
        outcome: { message: (reply2?.outcome?.message ?? "") },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      localizationTranslationJobApprovalServiceApi.RejectTranslationJobResponse.fromPartial({
        translationJob: {
          requester: req?.translationJob?.requester,
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a translation job.
   */
  async submitTranslationJob(req: localizationTranslationJobApprovalServiceApi.SubmitTranslationJobRequest): Promise<localizationTranslationJobApprovalServiceApi.SubmitTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "SubmitTranslationJob", req);
    this.logger.info("submit_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationApprovalServiceApi.SubmitRecommendationRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.approver?.email ?? "") } },
      recommendation: {
        audit: {
          updatedAt: req?.translationJob?.audit?.updatedAt,
          updatedBy: (req?.translationJob?.audit?.updatedBy ?? ""),
        },
        counterparty: { displayName: (req?.translationJob?.assignee?.displayName ?? "") },
      },
    });
    const invoke1: Unary<personalizationRecommendationApprovalServiceApi.SubmitRecommendationRequest, personalizationRecommendationApprovalServiceApi.SubmitRecommendationResponse> =
      (input, done) => this.personalizationRecommendationApprovalClient.submitRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = localizationLocaleValidationServiceApi.CheckLocaleEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (reply1?.recommendation?.counterparty?.email ?? "") },
      },
      locale: { owner: { userId: (req?.translationJob?.assignee?.userId ?? "") } },
    });
    const method2 = "checkLocaleEligibility" as const;
    const invoke2: Unary<localizationLocaleValidationServiceApi.CheckLocaleEligibilityRequest, localizationLocaleValidationServiceApi.CheckLocaleEligibilityResponse> =
      (input, done) => this.localizationLocaleValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleValidationServiceApi.CheckLocaleEligibilityRequest, localizationLocaleValidationServiceApi.CheckLocaleEligibilityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobApprovalServiceApi.SubmitTranslationJobResponse.fromPartial({
        outcome: {
          nextSteps: (reply1?.outcome?.nextSteps ?? []),
          referenceId: (reply1?.outcome?.referenceId ?? ""),
        },
      }),
      localizationTranslationJobApprovalServiceApi.SubmitTranslationJobResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      localizationTranslationJobApprovalServiceApi.SubmitTranslationJobResponse.fromPartial({
        translationJob: {
          assignee: req?.translationJob?.assignee,
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for TranslationJobApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationJobApprovalHandler {
  constructor(@inject(TranslationJobApprovalWorkflow) private readonly workflow: TranslationJobApprovalWorkflow) {}

  /**
   * Approves a translation job.
   */
  approveTranslationJob = unary<localizationTranslationJobApprovalServiceApi.ApproveTranslationJobRequest, localizationTranslationJobApprovalServiceApi.ApproveTranslationJobResponse>(
    (request) => this.workflow.approveTranslationJob(request),
  );

  /**
   * Comments a translation job.
   */
  commentTranslationJobApproval = unary<localizationTranslationJobApprovalServiceApi.CommentTranslationJobApprovalRequest, localizationTranslationJobApprovalServiceApi.CommentTranslationJobApprovalResponse>(
    (request) => this.workflow.commentTranslationJobApproval(request),
  );

  /**
   * Delegates a translation job.
   */
  delegateTranslationJobApproval = (call: ServerUnaryCall<localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalRequest, localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalResponse>, done: sendUnaryData<localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalResponse>): void => {
    void this.workflow.delegateTranslationJobApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a translation job.
   */
  escalateTranslationJob = unary<localizationTranslationJobApprovalServiceApi.EscalateTranslationJobRequest, localizationTranslationJobApprovalServiceApi.EscalateTranslationJobResponse>(
    (request) => this.workflow.escalateTranslationJob(request),
  );

  /**
   * Lists translation jobs a page at a time.
   */
  listPendingTranslationJobs = unary<localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsRequest, localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsResponse>(
    (request) => this.workflow.listPendingTranslationJobs(request),
  );

  /**
   * Recalls a translation job.
   */
  recallTranslationJob = (call: ServerUnaryCall<localizationTranslationJobApprovalServiceApi.RecallTranslationJobRequest, localizationTranslationJobApprovalServiceApi.RecallTranslationJobResponse>, done: sendUnaryData<localizationTranslationJobApprovalServiceApi.RecallTranslationJobResponse>): void => {
    void this.workflow.recallTranslationJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects a translation job.
   */
  rejectTranslationJob = unary<localizationTranslationJobApprovalServiceApi.RejectTranslationJobRequest, localizationTranslationJobApprovalServiceApi.RejectTranslationJobResponse>(
    (request) => this.workflow.rejectTranslationJob(request),
  );

  /**
   * Submits a translation job.
   */
  submitTranslationJob = unary<localizationTranslationJobApprovalServiceApi.SubmitTranslationJobRequest, localizationTranslationJobApprovalServiceApi.SubmitTranslationJobResponse>(
    (request) => this.workflow.submitTranslationJob(request),
  );
}

export function implementation(handler: TranslationJobApprovalHandler): localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceServer {
  return {
    approveTranslationJob: handler.approveTranslationJob,
    commentTranslationJobApproval: handler.commentTranslationJobApproval,
    delegateTranslationJobApproval: handler.delegateTranslationJobApproval,
    escalateTranslationJob: handler.escalateTranslationJob,
    listPendingTranslationJobs: handler.listPendingTranslationJobs,
    recallTranslationJob: handler.recallTranslationJob,
    rejectTranslationJob: handler.rejectTranslationJob,
    submitTranslationJob: handler.submitTranslationJob,
  };
}
