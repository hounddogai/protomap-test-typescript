/**
 * Manages translation keys: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as certificatesCertificateServiceApi from "../../../../.cache/proto/acme/certificates/v1/certificate_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as notificationsSubscriptionExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { GrpcAdapter, call, forwarding, metadataFor, type RequestPort, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTranslationKeyRecord } from "../data/records.js";
import { LocalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation key operations and persist audit data.
 */
@injectable()
export class TranslationKeyWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.certificates.v1.CertificateService") private readonly certificatesCertificateClient: certificatesCertificateServiceApi.CertificateServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantQueryService") private readonly experimentsVariantQueryClient: experimentsVariantQueryServiceApi.VariantQueryServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobValidationService") private readonly localizationTranslationJobValidationClient: localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionExportService") private readonly notificationsSubscriptionExportClient: notificationsSubscriptionExportServiceApi.SubscriptionExportServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of translation keys and answers once at the end.
   */
  async batchCreateTranslationKeys(req: localizationTranslationKeyServiceApi.BatchCreateTranslationKeysRequest): Promise<localizationTranslationKeyServiceApi.BatchCreateTranslationKeysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateTranslationKeys", req);
    this.logger.info("batch_create_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected1_1 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.preferredChannel ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = personalizationProfileValidationServiceApi.LintProfilesRequest.fromPartial({
      context: req?.context,
      profile: { contact: { preferredChannel: (selected1_1 ?? "") } },
    });
    const invoke1: Unary<personalizationProfileValidationServiceApi.LintProfilesRequest, personalizationProfileValidationServiceApi.LintProfilesResponse> =
      (input, done) => this.personalizationProfileValidationClient.lintProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileValidationServiceApi.LintProfilesRequest, personalizationProfileValidationServiceApi.LintProfilesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return localizationTranslationKeyServiceApi.BatchCreateTranslationKeysResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } });
  }

  /**
   * Returns several translation keys at once.
   */
  async batchGetTranslationKeys(req: localizationTranslationKeyServiceApi.BatchGetTranslationKeysRequest): Promise<localizationTranslationKeyServiceApi.BatchGetTranslationKeysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetTranslationKeys", req);
    this.logger.info("batch_get_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    return localizationTranslationKeyServiceApi.BatchGetTranslationKeysResponse.fromPartial({});
  }

  /**
   * Creates a translation key.
   */
  async createTranslationKey(req: localizationTranslationKeyServiceApi.CreateTranslationKeyRequest): Promise<localizationTranslationKeyServiceApi.CreateTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "CreateTranslationKey", req);
    this.logger.info("create_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.translationKey?.owner?.email ?? "") } },
      translationKey: {
        locator: { $case: "address", address: {
          recipient: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.recipient ?? ""),
          region: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? ""),
        } },
        components: { primary: {
          componentId: (req?.translationKey?.components?.["primary"]?.componentId ?? ""),
        } },
      },
    });
    const method1 = "explainTranslationKeyCalculation" as const;
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      localizationTranslationKeyServiceApi.CreateTranslationKeyResponse.fromPartial({
        translationKey: {
          dimensions: { length: (reply1?.translationKey?.dimensions?.length ?? 0) },
        },
      }),
      localizationTranslationKeyServiceApi.CreateTranslationKeyResponse.fromPartial({
        translationKey: {
          capacity: (req?.translationKey?.capacity ?? 0),
          status: req?.translationKey?.status,
        },
      }),
    );
  }

  /**
   * Deletes a translation key.
   */
  async deleteTranslationKey(req: localizationTranslationKeyServiceApi.DeleteTranslationKeyRequest): Promise<localizationTranslationKeyServiceApi.DeleteTranslationKeyResponse> {
    validateContext(req.context);
    if (!req.translationKeyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_key_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteTranslationKey", req);
    this.logger.info("delete_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantQueryServiceApi.ResolveVariantsRequest.fromPartial({ context: req?.context });
    const proxy1 = forwarding(this.experimentsVariantQueryClient);
    const invoke1: Unary<experimentsVariantQueryServiceApi.ResolveVariantsRequest, experimentsVariantQueryServiceApi.ResolveVariantsResponse> =
      (input, done) => proxy1.resolveVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantQueryServiceApi.ResolveVariantsRequest, experimentsVariantQueryServiceApi.ResolveVariantsResponse>(invoke1, request1);
    const request2 = personalizationProfileQueryServiceApi.ResolveProfilesRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<personalizationProfileQueryServiceApi.ResolveProfilesRequest, personalizationProfileQueryServiceApi.ResolveProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.resolveProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileQueryServiceApi.ResolveProfilesRequest, personalizationProfileQueryServiceApi.ResolveProfilesResponse>(invoke2, request2);
    const request3 = certificatesCertificateServiceApi.ListCertificatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<certificatesCertificateServiceApi.ListCertificatesRequest, certificatesCertificateServiceApi.ListCertificatesResponse> =
      (input, done) => this.certificatesCertificateClient.listCertificates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<certificatesCertificateServiceApi.ListCertificatesRequest, certificatesCertificateServiceApi.ListCertificatesResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = localizationTranslationJobValidationServiceApi.NormalizeTranslationJobRequest.fromPartial({
      context: input4?.context,
      translationJob: {
        assignee: { userId: (input4?.context?.actor?.userId ?? "") },
        audit: { etag: (input4?.etag ?? "") },
        origin: { $case: "customer", customer: { email: (input4?.context?.actor?.email ?? "") } },
      },
    });
    const invoke4: Unary<localizationTranslationJobValidationServiceApi.NormalizeTranslationJobRequest, localizationTranslationJobValidationServiceApi.NormalizeTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobValidationClient.normalizeTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<localizationTranslationJobValidationServiceApi.NormalizeTranslationJobRequest, localizationTranslationJobValidationServiceApi.NormalizeTranslationJobResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyServiceApi.DeleteTranslationKeyResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      localizationTranslationKeyServiceApi.DeleteTranslationKeyResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      localizationTranslationKeyServiceApi.DeleteTranslationKeyResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      localizationTranslationKeyServiceApi.DeleteTranslationKeyResponse.fromPartial({ result: { message: (reply4?.outcome?.message ?? "") } }),
    );
  }

  /**
   * Returns a translation key.
   */
  async getTranslationKey(req: localizationTranslationKeyServiceApi.GetTranslationKeyRequest): Promise<localizationTranslationKeyServiceApi.GetTranslationKeyResponse> {
    validateContext(req.context);
    if (!req.translationKeyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_key_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranslationKey", req);
    this.logger.info("get_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        issuedAt: req?.context?.deadline,
        metadata: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const cloned1: notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.estimateNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateResponse>(invoke1, cloned1);
    return mergeResponses(
      localizationTranslationKeyServiceApi.GetTranslationKeyResponse.fromPartial({
        result: { details: (reply1?.result?.details ?? {}) },
        translationKey: { audit: { updatedAt: reply1?.notificationTemplate?.audit?.updatedAt } },
      }),
      localizationTranslationKeyServiceApi.GetTranslationKeyResponse.fromPartial({ translationKey: { translationKeyId: (req?.translationKeyId ?? "") } }),
    );
  }

  /**
   * Lists translation keys a page at a time.
   */
  async searchTranslationKeys(req: localizationTranslationKeyServiceApi.SearchTranslationKeysRequest): Promise<localizationTranslationKeyServiceApi.SearchTranslationKeysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchTranslationKeys", req);
    this.logger.info("search_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      notificationTemplate: {
        audit: { updatedAt: req?.filter?.createdAfter },
        billingAddress: { region: (req?.filter?.region ?? "") },
      },
    });
    const decoded1 = notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest.toJSON(request1))),
    );
    const invoke1: Unary<notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.validateNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationTranslationKeyServiceApi.SearchTranslationKeysResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } });
  }

  /**
   * Streams the changes of translation keys as they happen.
   */
  async watchTranslationKeys(req: localizationTranslationKeyServiceApi.WatchTranslationKeysRequest): Promise<localizationTranslationKeyServiceApi.WatchTranslationKeysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchTranslationKeys", req);
    this.logger.info("watch_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.fromPartial({
      context: req?.context,
      translationKey: { owner: { email: (req?.subscriber?.email ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.RecalculateTranslationKeysRequest",
      value: Buffer.from(localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.encode(request1).finish()),
    });
    const unpacked1 = localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.decode(envelope1.value);
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.recalculateTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse>(invoke1, unpacked1);
    const request2 = localizationLocaleValidationServiceApi.NormalizeLocaleRequest.fromPartial({
      context: req?.context,
      locale: { owner: { email: (reply1?.translationKey?.owner?.email ?? "") } },
    });
    const client2 = this.clients.get<localizationLocaleValidationServiceApi.LocaleValidationServiceClient>("acme.localization.v1.LocaleValidationService");
    const invoke2: Unary<localizationLocaleValidationServiceApi.NormalizeLocaleRequest, localizationLocaleValidationServiceApi.NormalizeLocaleResponse> =
      (input, done) => client2.normalizeLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleValidationServiceApi.NormalizeLocaleRequest, localizationLocaleValidationServiceApi.NormalizeLocaleResponse>(invoke2, request2);
    const request3 = communityPostValidationServiceApi.ExplainPostDecisionRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { updatedBy: (reply1?.translationKey?.audit?.updatedBy ?? "") },
      },
    });
    const invoke3: Unary<communityPostValidationServiceApi.ExplainPostDecisionRequest, communityPostValidationServiceApi.ExplainPostDecisionResponse> =
      (input, done) => this.communityPostValidationClient.explainPostDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<communityPostValidationServiceApi.ExplainPostDecisionRequest, communityPostValidationServiceApi.ExplainPostDecisionResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    const request4 = notificationsSubscriptionExportServiceApi.StreamSubscriptionExportRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        query: (req?.filter?.query ?? ""),
        region: ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream4 = this.notificationsSubscriptionExportClient.streamSubscriptionExport(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const messages4 = await collect(stream4);
    const reply4 = messages4.at(-1) ?? notificationsSubscriptionExportServiceApi.StreamSubscriptionExportResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      localizationTranslationKeyServiceApi.WatchTranslationKeysResponse.fromPartial({
        translationKey: { translationKeyId: (reply1?.translationKey?.translationKeyId ?? "") },
      }),
      localizationTranslationKeyServiceApi.WatchTranslationKeysResponse.fromPartial({ translationKey: { owner: reply2?.locale?.owner } }),
      localizationTranslationKeyServiceApi.WatchTranslationKeysResponse.fromPartial({
        translationKey: { audit: { createdAt: reply3?.post?.audit?.createdAt } },
      }),
    );
  }
}

/**
 * The gRPC boundary for TranslationKeyService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationKeyHandler {
  constructor(@inject(TranslationKeyWorkflow) private readonly workflow: TranslationKeyWorkflow) {}

  /**
   * Takes a stream of translation keys and answers once at the end.
   */
  batchCreateTranslationKeys = clientStream<localizationTranslationKeyServiceApi.BatchCreateTranslationKeysRequest, localizationTranslationKeyServiceApi.BatchCreateTranslationKeysResponse>(
    (request) => this.workflow.batchCreateTranslationKeys(request), () => localizationTranslationKeyServiceApi.BatchCreateTranslationKeysResponse.fromPartial({}),
  );

  /**
   * Returns several translation keys at once.
   */
  batchGetTranslationKeys = unary<localizationTranslationKeyServiceApi.BatchGetTranslationKeysRequest, localizationTranslationKeyServiceApi.BatchGetTranslationKeysResponse>(
    (request) => this.workflow.batchGetTranslationKeys(request),
  );

  /**
   * Creates a translation key.
   */
  createTranslationKey = (call: ServerUnaryCall<localizationTranslationKeyServiceApi.CreateTranslationKeyRequest, localizationTranslationKeyServiceApi.CreateTranslationKeyResponse>, done: sendUnaryData<localizationTranslationKeyServiceApi.CreateTranslationKeyResponse>): void => {
    void this.workflow.createTranslationKey(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Deletes a translation key.
   */
  deleteTranslationKey = unary<localizationTranslationKeyServiceApi.DeleteTranslationKeyRequest, localizationTranslationKeyServiceApi.DeleteTranslationKeyResponse>(
    (request) => this.workflow.deleteTranslationKey(request),
  );

  /**
   * Returns a translation key.
   */
  getTranslationKey = unary<localizationTranslationKeyServiceApi.GetTranslationKeyRequest, localizationTranslationKeyServiceApi.GetTranslationKeyResponse>(
    (request) => this.workflow.getTranslationKey(request),
  );

  /**
   * Lists translation keys a page at a time.
   */
  searchTranslationKeys = (call: ServerUnaryCall<localizationTranslationKeyServiceApi.SearchTranslationKeysRequest, localizationTranslationKeyServiceApi.SearchTranslationKeysResponse>, done: sendUnaryData<localizationTranslationKeyServiceApi.SearchTranslationKeysResponse>): void => {
    void this.workflow.searchTranslationKeys(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of translation keys as they happen.
   */
  watchTranslationKeys = serverStream<localizationTranslationKeyServiceApi.WatchTranslationKeysRequest, localizationTranslationKeyServiceApi.WatchTranslationKeysResponse>(
    (request) => this.workflow.watchTranslationKeys(request),
  );
}

export function implementation(handler: TranslationKeyHandler): localizationTranslationKeyServiceApi.TranslationKeyServiceServer {
  return {
    batchCreateTranslationKeys: handler.batchCreateTranslationKeys,
    batchGetTranslationKeys: handler.batchGetTranslationKeys,
    createTranslationKey: handler.createTranslationKey,
    deleteTranslationKey: handler.deleteTranslationKey,
    getTranslationKey: handler.getTranslationKey,
    searchTranslationKeys: handler.searchTranslationKeys,
    watchTranslationKeys: handler.watchTranslationKeys,
  };
}
