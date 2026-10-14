/**
 * Answers read-only questions about locales, for screens and reports. Remote work stays behind typed client ports.
 */

import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as localizationLocaleQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { LocalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate locale operations and persist audit data.
 */
@injectable()
export class LocaleQueryWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobValidationService") private readonly localizationTranslationJobValidationClient: localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyQueryService") private readonly localizationTranslationKeyQueryClient: localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists locales a page at a time.
   */
  async browseLocales(req: localizationLocaleQueryServiceApi.BrowseLocalesRequest): Promise<localizationLocaleQueryServiceApi.BrowseLocalesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseLocales", req);
    this.logger.info("browse_locales", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        correlationId: (req?.filter?.ownerId ?? ""),
        occurredAt: req?.filter?.createdAfter,
      },
      details: { authorEmail: (req?.context?.actor?.email ?? "") },
    });
    const invoke1: Unary<notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.annotateDeliveryAttemptVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionResponse>(invoke1, request1);
    const request2 = localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: {
          displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? ""),
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionRequest, localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionResponse> =
      (input, done) => this.localizationTranslationJobValidationClient.explainTranslationJobDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionRequest, localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      localizationLocaleQueryServiceApi.BrowseLocalesResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      localizationLocaleQueryServiceApi.BrowseLocalesResponse.fromPartial({
        locales: [{
          audit: { createdBy: (reply2?.translationJob?.audit?.createdBy ?? "") },
          owner: { email: (reply2?.translationJob?.requester?.email ?? "") },
        }],
      }),
    );
  }

  /**
   * Counts locales by status.
   */
  async countLocales(req: localizationLocaleQueryServiceApi.CountLocalesRequest): Promise<localizationLocaleQueryServiceApi.CountLocalesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountLocales", req);
    this.logger.info("count_locales", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input1?.context?.baggage ?? {}))),
      context: input1?.context,
      details: {
        recipient: { email: (input1?.context?.actor?.email ?? "") },
        variables: Object.fromEntries(Object.entries((input1?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesResponse> =
      (input, done) => this.notificationsSubscriptionNotificationClient.unsubscribeSubscriptionUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.UnsubscribeSubscriptionUpdatesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationLocaleQueryServiceApi.CountLocalesResponse.fromPartial({
      result: {
        message: (reply1?.outcome?.message ?? ""),
        status: (reply1?.outcome?.status ?? ""),
      },
    });
  }

  /**
   * Lists locales a page at a time.
   */
  async findLocales(req: localizationLocaleQueryServiceApi.FindLocalesRequest): Promise<localizationLocaleQueryServiceApi.FindLocalesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindLocales", req);
    this.logger.info("find_locales", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
      notificationTemplate: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const cloned1: notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.retryNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportResponse>(invoke1, cloned1);
    const request2 = personalizationProfileCalculationServiceApi.RecalculateProfilesRequest.fromPartial({
      context: req?.context,
      profile: {
        primaryAddress: {
          postalCode: (reply1?.notificationTemplate?.billingAddress?.postalCode ?? ""),
        },
      },
    });
    const decoded2 = personalizationProfileCalculationServiceApi.RecalculateProfilesRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationProfileCalculationServiceApi.RecalculateProfilesRequest.toJSON(request2))),
    );
    const invoke2: Unary<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse> =
      (input, done) => this.personalizationProfileCalculationClient.recalculateProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      localizationLocaleQueryServiceApi.FindLocalesResponse.fromPartial({
        locales: [{
          audit: { createdBy: (reply1?.notificationTemplate?.audit?.createdBy ?? "") },
        }],
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      localizationLocaleQueryServiceApi.FindLocalesResponse.fromPartial({
        locales: [{ audit: { createdAt: reply2?.profile?.audit?.createdAt } }],
      }),
    );
  }

  /**
   * Returns a locale.
   */
  async lookupLocale(req: localizationLocaleQueryServiceApi.LookupLocaleRequest): Promise<localizationLocaleQueryServiceApi.LookupLocaleResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupLocale", req);
    this.logger.info("lookup_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    return localizationLocaleQueryServiceApi.LookupLocaleResponse.fromPartial({ locale: { localeId: (req?.localeId ?? "") } });
  }

  /**
   * Returns a locale.
   */
  async peekLocale(req: localizationLocaleQueryServiceApi.PeekLocaleRequest): Promise<localizationLocaleQueryServiceApi.PeekLocaleResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekLocale", req);
    this.logger.info("peek_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.CalculateTranslationKeyRequest",
      value: Buffer.from(localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest.encode(request1).finish()),
    });
    const unpacked1 = localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest.decode(envelope1.value);
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.calculateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse>(invoke1, unpacked1);
    return mergeResponses(
      localizationLocaleQueryServiceApi.PeekLocaleResponse.fromPartial({
        locale: { audit: { updatedAt: reply1?.translationKey?.audit?.updatedAt } },
      }),
      localizationLocaleQueryServiceApi.PeekLocaleResponse.fromPartial({ locale: { localeId: (req?.localeId ?? "") } }),
    );
  }

  /**
   * Returns several locales at once.
   */
  async resolveLocales(req: localizationLocaleQueryServiceApi.ResolveLocalesRequest): Promise<localizationLocaleQueryServiceApi.ResolveLocalesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveLocales", req);
    this.logger.info("resolve_locales", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobValidationServiceApi.PreviewTranslationJobRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
      translationJob: { assignee: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const client1 = this.clients.get<localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient>("acme.localization.v1.TranslationJobValidationService");
    const invoke1: Unary<localizationTranslationJobValidationServiceApi.PreviewTranslationJobRequest, localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse> =
      (input, done) => client1.previewTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobValidationServiceApi.PreviewTranslationJobRequest, localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse>(invoke1, request1);
    return localizationLocaleQueryServiceApi.ResolveLocalesResponse.fromPartial({
      locales: [{ owner: { userId: (reply1?.translationJob?.assignee?.userId ?? "") } }],
      result: { message: (reply1?.outcome?.message ?? "") },
    });
  }

  /**
   * Lists locales a page at a time.
   */
  async suggestLocales(req: localizationLocaleQueryServiceApi.SuggestLocalesRequest): Promise<localizationLocaleQueryServiceApi.SuggestLocalesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestLocales", req);
    this.logger.info("suggest_locales", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexQueryServiceApi.ExportSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
    });
    const stream1 = this.searchSearchIndexQueryClient.exportSearchIndexes(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? searchSearchIndexQueryServiceApi.ExportSearchIndexesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationLocaleQueryServiceApi.SuggestLocalesResponse.fromPartial({});
  }

  /**
   * Summarizes a locale.
   */
  async summarizeLocales(req: localizationLocaleQueryServiceApi.SummarizeLocalesRequest): Promise<localizationLocaleQueryServiceApi.SummarizeLocalesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeLocales", req);
    this.logger.info("summarize_locales", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobValidationServiceApi.PreviewTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<localizationTranslationJobValidationServiceApi.PreviewTranslationJobRequest, localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobValidationClient.previewTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<localizationTranslationJobValidationServiceApi.PreviewTranslationJobRequest, localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = localizationLocaleValidationServiceApi.PreviewLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: ((reply1?.translationJob?.origin?.$case === "customer" ? reply1?.translationJob?.origin.customer : undefined)?.email ?? ""),
        },
      },
      locale: {
        audit: { updatedBy: (reply1?.translationJob?.audit?.updatedBy ?? "") },
        owner: {
          displayName: ((reply1?.translationJob?.origin?.$case === "customer" ? reply1?.translationJob?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
    });
    const invoke2: Unary<localizationLocaleValidationServiceApi.PreviewLocaleRequest, localizationLocaleValidationServiceApi.PreviewLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.previewLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<localizationLocaleValidationServiceApi.PreviewLocaleRequest, localizationLocaleValidationServiceApi.PreviewLocaleResponse>(invoke2, request2));
    let selected3_1: string | undefined;
    switch (reply1?.translationJob?.origin?.$case) {
      case "customer":
        selected3_1 = ((reply1?.translationJob?.origin?.$case === "customer" ? reply1?.translationJob?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = communityForumValidationServiceApi.CheckForumEligibilityRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { createdBy: (reply1?.translationJob?.audit?.createdBy ?? "") },
            manager: { displayName: (selected3_1 ?? "") },
          }],
        }],
      },
    });
    const invoke3: Unary<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse> =
      (input, done) => this.communityForumValidationClient.checkForumEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse>(invoke3, request3);
    const request4 = localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.translationJob?.audit?.updatedAt,
        region: (reply3?.forum?.location?.region ?? ""),
      },
    });
    const invoke4: Unary<localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyQueryClient.browseTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleQueryServiceApi.SummarizeLocalesResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      localizationLocaleQueryServiceApi.SummarizeLocalesResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      localizationLocaleQueryServiceApi.SummarizeLocalesResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      localizationLocaleQueryServiceApi.SummarizeLocalesResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      localizationLocaleQueryServiceApi.SummarizeLocalesResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for LocaleQueryService; workflows own validation and database transactions.
 */
@injectable()
export class LocaleQueryHandler {
  constructor(@inject(LocaleQueryWorkflow) private readonly workflow: LocaleQueryWorkflow) {}

  /**
   * Lists locales a page at a time.
   */
  browseLocales = unary<localizationLocaleQueryServiceApi.BrowseLocalesRequest, localizationLocaleQueryServiceApi.BrowseLocalesResponse>(
    (request) => this.workflow.browseLocales(request),
  );

  /**
   * Counts locales by status.
   */
  countLocales = unary<localizationLocaleQueryServiceApi.CountLocalesRequest, localizationLocaleQueryServiceApi.CountLocalesResponse>(
    (request) => this.workflow.countLocales(request),
  );

  /**
   * Lists locales a page at a time.
   */
  findLocales = (call: ServerUnaryCall<localizationLocaleQueryServiceApi.FindLocalesRequest, localizationLocaleQueryServiceApi.FindLocalesResponse>, done: sendUnaryData<localizationLocaleQueryServiceApi.FindLocalesResponse>): void => {
    void this.workflow.findLocales(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a locale.
   */
  lookupLocale = unary<localizationLocaleQueryServiceApi.LookupLocaleRequest, localizationLocaleQueryServiceApi.LookupLocaleResponse>(
    (request) => this.workflow.lookupLocale(request),
  );

  /**
   * Returns a locale.
   */
  peekLocale = unary<localizationLocaleQueryServiceApi.PeekLocaleRequest, localizationLocaleQueryServiceApi.PeekLocaleResponse>(
    (request) => this.workflow.peekLocale(request),
  );

  /**
   * Returns several locales at once.
   */
  resolveLocales = (call: ServerUnaryCall<localizationLocaleQueryServiceApi.ResolveLocalesRequest, localizationLocaleQueryServiceApi.ResolveLocalesResponse>, done: sendUnaryData<localizationLocaleQueryServiceApi.ResolveLocalesResponse>): void => {
    void this.workflow.resolveLocales(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists locales a page at a time.
   */
  suggestLocales = unary<localizationLocaleQueryServiceApi.SuggestLocalesRequest, localizationLocaleQueryServiceApi.SuggestLocalesResponse>(
    (request) => this.workflow.suggestLocales(request),
  );

  /**
   * Summarizes a locale.
   */
  summarizeLocales = unary<localizationLocaleQueryServiceApi.SummarizeLocalesRequest, localizationLocaleQueryServiceApi.SummarizeLocalesResponse>(
    (request) => this.workflow.summarizeLocales(request),
  );
}

export function implementation(handler: LocaleQueryHandler): localizationLocaleQueryServiceApi.LocaleQueryServiceServer {
  return {
    browseLocales: handler.browseLocales,
    countLocales: handler.countLocales,
    findLocales: handler.findLocales,
    lookupLocale: handler.lookupLocale,
    peekLocale: handler.peekLocale,
    resolveLocales: handler.resolveLocales,
    suggestLocales: handler.suggestLocales,
    summarizeLocales: handler.summarizeLocales,
  };
}
