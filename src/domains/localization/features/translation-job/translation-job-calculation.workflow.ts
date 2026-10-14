/**
 * Computes the figures of a translation job, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as communityBadgeValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as labelingLabelingTaskCalculationServiceApi from "../../../../../.cache/proto/acme/labeling/v1/labeling_task_calculation_service.js";
import * as labelingLabelingTaskServiceApi from "../../../../../.cache/proto/acme/labeling/v1/labeling_task_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as notificationsSubscriptionExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as venuesVenueServiceApi from "../../../../../.cache/proto/acme/venues/v1/venue_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, serviceError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  retry,
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toTranslationJobRecord } from "../../data/records.js";
import { LocalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation job operations and persist audit data.
 */
@injectable()
export class TranslationJobCalculationWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentQueryService") private readonly experimentsExperimentQueryClient: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient,
    @inject("grpc:acme.labeling.v1.LabelingTaskCalculationService") private readonly labelingLabelingTaskCalculationClient: labelingLabelingTaskCalculationServiceApi.LabelingTaskCalculationServiceClient,
    @inject("grpc:acme.labeling.v1.LabelingTaskService") private readonly labelingLabelingTaskClient: labelingLabelingTaskServiceApi.LabelingTaskServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleCalculationService") private readonly localizationLocaleCalculationClient: localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyValidationService") private readonly localizationTranslationKeyValidationClient: localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateHistoryService") private readonly notificationsNotificationTemplateHistoryClient: notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionExportService") private readonly notificationsSubscriptionExportClient: notificationsSubscriptionExportServiceApi.SubscriptionExportServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.venues.v1.VenueService") private readonly venuesVenueClient: venuesVenueServiceApi.VenueServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a translation job.
   */
  async calculateTranslationJob(req: localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest): Promise<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "CalculateTranslationJob", req);
    this.logger.info("calculate_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeValidationServiceApi.ValidateBadgeRequest.fromPartial({
      badge: {
        audit: { updatedAt: req?.translationJob?.audit?.updatedAt },
        owner: {
          displayName: (req?.translationJob?.assignee?.displayName ?? ""),
          email: ((req?.translationJob?.origin?.$case === "customer" ? req?.translationJob?.origin.customer : undefined)?.email ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { phone: (req?.translationJob?.requester?.phone ?? "") } },
    });
    const proxy1 = forwarding(this.communityBadgeValidationClient);
    const invoke1: Unary<communityBadgeValidationServiceApi.ValidateBadgeRequest, communityBadgeValidationServiceApi.ValidateBadgeResponse> =
      (input, done) => proxy1.validateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeValidationServiceApi.ValidateBadgeRequest, communityBadgeValidationServiceApi.ValidateBadgeResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse.fromPartial({
        translationJob: {
          requester: req?.translationJob?.requester,
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a translation job.
   */
  async compareTranslationJobOptions(req: localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest): Promise<localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "CompareTranslationJobOptions", req);
    this.logger.info("compare_translation_job_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.translationJob?.origin?.$case) {
      case "customer":
        selected1_2 = ((req?.translationJob?.origin?.$case === "customer" ? req?.translationJob?.origin.customer : undefined)?.email ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = localizationLocaleCalculationServiceApi.ExplainLocaleCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.translationJob?.assignee?.email ?? "") } },
      locale: {
        audit: { etag: (req?.translationJob?.audit?.etag ?? "") },
        owner: {
          email: (selected1_2 ?? ""),
          userId: (req?.translationJob?.assignee?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<localizationLocaleCalculationServiceApi.ExplainLocaleCalculationRequest, localizationLocaleCalculationServiceApi.ExplainLocaleCalculationResponse> =
      (input, done) => this.localizationLocaleCalculationClient.explainLocaleCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleCalculationServiceApi.ExplainLocaleCalculationRequest, localizationLocaleCalculationServiceApi.ExplainLocaleCalculationResponse>(invoke1, request1);
    const request2 = experimentsExperimentQueryServiceApi.SummarizeExperimentsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.locale?.parameters ?? {}))),
        period: reply1?.locale?.effective,
      },
      reason: ((reply1?.locale?.action?.$case === "block" ? reply1?.locale?.action.block : undefined)?.reason ?? ""),
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<experimentsExperimentQueryServiceApi.SummarizeExperimentsRequest, experimentsExperimentQueryServiceApi.SummarizeExperimentsResponse> =
      (input, done) => this.experimentsExperimentQueryClient.summarizeExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentQueryServiceApi.SummarizeExperimentsRequest, experimentsExperimentQueryServiceApi.SummarizeExperimentsResponse>(invoke2, spread2);
    const results3 = await Promise.all((req?.translationJob?.comments ?? []).map(async (item) => {
      const request3 = ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountRequest.fromPartial({
        context: req?.context,
        details: { contact: { email: (item?.authorEmail ?? "") } },
        ledgerAccount: { audit: { createdAt: item?.createdAt } },
      });
      const invoke3: Unary<ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountResponse> =
        (input, done) => this.ledgerLedgerAccountValidationClient.validateLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountResponse>(invoke3, request3);
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse.fromPartial({
        translationJob: {
          priority: (req?.translationJob?.priority ?? 0),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a translation job.
   */
  async estimateTranslationJob(req: localizationTranslationJobCalculationServiceApi.EstimateTranslationJobRequest): Promise<localizationTranslationJobCalculationServiceApi.EstimateTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "EstimateTranslationJob", req);
    this.logger.info("estimate_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest.fromPartial({
      context: input1?.context,
      translationKey: {
        locator: { $case: "address", address: {
          countryCode: (input1?.details?.destination?.countryCode ?? ""),
          locality: (input1?.details?.destination?.locality ?? ""),
        } },
        audit: { updatedBy: (input1?.translationJob?.audit?.updatedBy ?? "") },
        owner: { userId: (input1?.translationJob?.assignee?.userId ?? "") },
      },
    });
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.compareTranslationKeyOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobCalculationServiceApi.EstimateTranslationJobResponse.fromPartial({
        breakdown: { total: reply1?.breakdown?.total },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      localizationTranslationJobCalculationServiceApi.EstimateTranslationJobResponse.fromPartial({
        translationJob: {
          status: req?.translationJob?.status,
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a translation job.
   */
  async explainTranslationJobCalculation(req: localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest): Promise<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "ExplainTranslationJobCalculation", req);
    this.logger.info("explain_translation_job_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = labelingLabelingTaskCalculationServiceApi.ExplainLabelingTaskCalculationRequest.fromPartial({
      context: req?.context,
      labelingTask: {
        origin: { $case: "customer", customer: { displayName: (req?.translationJob?.assignee?.displayName ?? "") } },
      },
    });
    const cloned1: labelingLabelingTaskCalculationServiceApi.ExplainLabelingTaskCalculationRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<labelingLabelingTaskCalculationServiceApi.ExplainLabelingTaskCalculationRequest, labelingLabelingTaskCalculationServiceApi.ExplainLabelingTaskCalculationResponse> =
      (input, done) => this.labelingLabelingTaskCalculationClient.explainLabelingTaskCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<labelingLabelingTaskCalculationServiceApi.ExplainLabelingTaskCalculationRequest, labelingLabelingTaskCalculationServiceApi.ExplainLabelingTaskCalculationResponse>(invoke1, cloned1);
    const request2 = personalizationProfileQueryServiceApi.CountProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.labelingTask?.sla?.dueAt,
        ownerId: (req?.translationJob?.assignee?.userId ?? ""),
      },
    });
    const decoded2 = personalizationProfileQueryServiceApi.CountProfilesRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationProfileQueryServiceApi.CountProfilesRequest.toJSON(request2))),
    );
    const invoke2: Unary<personalizationProfileQueryServiceApi.CountProfilesRequest, personalizationProfileQueryServiceApi.CountProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.countProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileQueryServiceApi.CountProfilesRequest, personalizationProfileQueryServiceApi.CountProfilesResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse.fromPartial({
        translationJob: {
          audit: {
            updatedAt: reply1?.labelingTask?.audit?.updatedAt,
            updatedBy: (reply1?.labelingTask?.audit?.updatedBy ?? ""),
          },
        },
      }),
      localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse.fromPartial({
        translationJob: {
          customFields: (req?.translationJob?.customFields ?? {}),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a translation job.
   */
  async getTranslationJobRates(req: localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesRequest): Promise<localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranslationJobRates", req);
    this.logger.info("get_translation_job_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.translationJobId ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.ListSubscriptionExportsRequest",
      value: Buffer.from(notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest, notificationsSubscriptionExportServiceApi.ListSubscriptionExportsResponse> =
      (input, done) => this.notificationsSubscriptionExportClient.listSubscriptionExports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest, notificationsSubscriptionExportServiceApi.ListSubscriptionExportsResponse>(invoke1, unpacked1);
    return mergeResponses(
      localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      localizationTranslationJobCalculationServiceApi.GetTranslationJobRatesResponse.fromPartial({ translationJob: { translationJobId: (req?.translationJobId ?? "") } }),
    );
  }

  /**
   * Quotes a translation job.
   */
  async quoteTranslationJob(req: localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest): Promise<localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "QuoteTranslationJob", req);
    this.logger.info("quote_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.translationJob?.comments ?? []).map(async (item) => {
      const request1 = notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest.fromPartial({
        context: req?.context,
        details: { authorEmail: (item?.authorEmail ?? "") },
        notificationTemplate: {
          audit: {
            createdAt: item?.createdAt,
            createdBy: (req?.translationJob?.audit?.createdBy ?? ""),
          },
        },
      });
      const invoke1: Unary<notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsResponse> =
        (input, done) => this.notificationsNotificationTemplateHistoryClient.compareNotificationTemplateVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse.fromPartial({
      translationJob: {
        status: req?.translationJob?.status,
        translationJobId: (req?.translationJobId ?? ""),
      },
    });
  }

  /**
   * Recalculates a translation job.
   */
  async recalculateTranslationJobs(req: localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest): Promise<localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "RecalculateTranslationJobs", req);
    this.logger.info("recalculate_translation_jobs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueServiceApi.UpdateVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        locator: { $case: "address", address: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
        } },
        owner: { displayName: (req?.translationJob?.assignee?.displayName ?? "") },
      },
    });
    const client1 = this.clients.get<venuesVenueServiceApi.VenueServiceClient>("acme.venues.v1.VenueService");
    const invoke1: Unary<venuesVenueServiceApi.UpdateVenueRequest, venuesVenueServiceApi.UpdateVenueResponse> =
      (input, done) => client1.updateVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueServiceApi.UpdateVenueRequest, venuesVenueServiceApi.UpdateVenueResponse>(invoke1, request1);
    const tasks2: Array<() => Promise<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse>> = [];
    for (const item of (req?.translationJob?.comments ?? [])) {
      tasks2.push(async () => {
        const request2 = ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest.fromPartial({
          context: req?.context,
          details: {
            contact: {
              email: (item?.authorEmail ?? ""),
              preferredChannel: (req?.translationJob?.requester?.preferredChannel ?? ""),
            },
          },
          ledgerAccount: { audit: { createdAt: item?.createdAt } },
        });
        const invoke2: Unary<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse> =
          (input, done) => this.ledgerLedgerAccountValidationClient.normalizeLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse.fromPartial({});
    const request3 = localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.translationJob?.requester?.name } },
    });
    const invoke3: Unary<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse> =
      (input, done) => this.localizationTranslationKeyValidationClient.checkTranslationKeyEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    const request4 = labelingLabelingTaskServiceApi.BatchGetLabelingTasksRequest.fromPartial({ context: req?.context });
    const invoke4: Unary<labelingLabelingTaskServiceApi.BatchGetLabelingTasksRequest, labelingLabelingTaskServiceApi.BatchGetLabelingTasksResponse> =
      (input, done) => this.labelingLabelingTaskClient.batchGetLabelingTasks(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<labelingLabelingTaskServiceApi.BatchGetLabelingTasksRequest, labelingLabelingTaskServiceApi.BatchGetLabelingTasksResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse.fromPartial({
        translationJob: { comments: [{ createdAt: reply1?.venue?.audit?.createdAt }] },
      }),
      localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse.fromPartial({
        translationJob: {
          priority: (req?.translationJob?.priority ?? 0),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }
}
