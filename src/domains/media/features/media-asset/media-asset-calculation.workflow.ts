/**
 * Computes the figures of a media asset, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as broadcastsBroadcastServiceApi from "../../../../../.cache/proto/acme/broadcasts/v1/broadcast_service.js";
import * as certificatesCertificateQueryServiceApi from "../../../../../.cache/proto/acme/certificates/v1/certificate_query_service.js";
import * as chatChatBotQueryServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_query_service.js";
import * as configurationConfigSetServiceApi from "../../../../../.cache/proto/acme/configuration/v1/config_set_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as formsFormCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormFieldValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as formsFormQueryServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_query_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as sponsorshipsSponsorServiceApi from "../../../../../.cache/proto/acme/sponsorships/v1/sponsor_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
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
} from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toMediaAssetRecord } from "../../data/records.js";
import { MediaRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate media asset operations and persist audit data.
 */
@injectable()
export class MediaAssetCalculationWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.broadcasts.v1.BroadcastService") private readonly broadcastsBroadcastClient: broadcastsBroadcastServiceApi.BroadcastServiceClient,
    @inject("grpc:acme.certificates.v1.CertificateQueryService") private readonly certificatesCertificateQueryClient: certificatesCertificateQueryServiceApi.CertificateQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotQueryService") private readonly chatChatBotQueryClient: chatChatBotQueryServiceApi.ChatBotQueryServiceClient,
    @inject("grpc:acme.configuration.v1.ConfigSetService") private readonly configurationConfigSetClient: configurationConfigSetServiceApi.ConfigSetServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldValidationService") private readonly formsFormFieldValidationClient: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormQueryService") private readonly formsFormQueryClient: formsFormQueryServiceApi.FormQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("grpc:acme.sponsorships.v1.SponsorService") private readonly sponsorshipsSponsorClient: sponsorshipsSponsorServiceApi.SponsorServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseQueryService") private readonly surveysSurveyResponseQueryClient: surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a media asset.
   */
  async calculateMediaAsset(req: mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest): Promise<mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "CalculateMediaAsset", req);
    this.logger.info("calculate_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.mediaAsset?.specs ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.scheduleNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = formsFormFieldValidationServiceApi.LintFormFieldsRequest.fromPartial({
      context: input2?.context,
      formField: { audit: { createdBy: (input2?.mediaAsset?.audit?.createdBy ?? "") } },
    });
    const invoke2: Unary<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse> =
      (input, done) => this.formsFormFieldValidationClient.lintFormFields(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse>(invoke2, request2);
    const request3 = certificatesCertificateQueryServiceApi.CountCertificatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.mediaAsset?.audit?.updatedAt,
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const cloned3: certificatesCertificateQueryServiceApi.CountCertificatesRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<certificatesCertificateQueryServiceApi.CountCertificatesRequest, certificatesCertificateQueryServiceApi.CountCertificatesResponse> =
      (input, done) => this.certificatesCertificateQueryClient.countCertificates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<certificatesCertificateQueryServiceApi.CountCertificatesRequest, certificatesCertificateQueryServiceApi.CountCertificatesResponse>(invoke3, cloned3);
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          status: req?.mediaAsset?.status,
        },
      }),
    );
  }

  /**
   * Compares a media asset.
   */
  async compareMediaAssetOptions(req: mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest): Promise<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "CompareMediaAssetOptions", req);
    this.logger.info("compare_media_asset_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationNotificationServiceApi.StreamNotificationNoticesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
      since: req?.mediaAsset?.audit?.createdAt,
      subscriber: { email: (req?.mediaAsset?.owner?.email ?? "") },
    });
    const stream1 = this.notificationsNotificationNotificationClient.streamNotificationNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationNotificationServiceApi.StreamNotificationNoticesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse.fromPartial({
      mediaAsset: {
        mediaAssetId: (req?.mediaAssetId ?? ""),
        specs: (req?.mediaAsset?.specs ?? {}),
      },
    });
  }

  /**
   * Estimates a media asset.
   */
  async estimateMediaAsset(req: mediaMediaAssetCalculationServiceApi.EstimateMediaAssetRequest): Promise<mediaMediaAssetCalculationServiceApi.EstimateMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "EstimateMediaAsset", req);
    this.logger.info("estimate_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = broadcastsBroadcastServiceApi.ListBroadcastsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.mediaAsset?.audit?.updatedAt,
        ownerId: (req?.mediaAsset?.components?.["primary"]?.componentId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const decoded1 = broadcastsBroadcastServiceApi.ListBroadcastsRequest.fromJSON(
      JSON.parse(JSON.stringify(broadcastsBroadcastServiceApi.ListBroadcastsRequest.toJSON(request1))),
    );
    const invoke1: Unary<broadcastsBroadcastServiceApi.ListBroadcastsRequest, broadcastsBroadcastServiceApi.ListBroadcastsResponse> =
      (input, done) => this.broadcastsBroadcastClient.listBroadcasts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<broadcastsBroadcastServiceApi.ListBroadcastsRequest, broadcastsBroadcastServiceApi.ListBroadcastsResponse>(invoke1, decoded1);
    const request2 = personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        billingAddress: {
          recipient: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.recipient ?? ""),
        },
        counterparty: { displayName: (req?.mediaAsset?.owner?.displayName ?? "") },
        lines: [{
          description: (req?.mediaAsset?.components?.["primary"]?.description ?? ""),
        }],
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.NormalizeRecommendationRequest",
      value: Buffer.from(personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest.encode(request2).finish()),
    });
    const unpacked2 = personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest.decode(envelope2.value);
    const invoke2: Unary<personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest, personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.normalizeRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationValidationServiceApi.NormalizeRecommendationRequest, personalizationRecommendationValidationServiceApi.NormalizeRecommendationResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetCalculationServiceApi.EstimateMediaAssetResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaMediaAssetCalculationServiceApi.EstimateMediaAssetResponse.fromPartial({
        mediaAsset: { owner: { email: (reply2?.recommendation?.counterparty?.email ?? "") } },
      }),
      mediaMediaAssetCalculationServiceApi.EstimateMediaAssetResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          name: (req?.mediaAsset?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a media asset.
   */
  async explainMediaAssetCalculation(req: mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationRequest): Promise<mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "ExplainMediaAssetCalculation", req);
    this.logger.info("explain_media_asset_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          phone: (req?.details?.contact?.phone ?? ""),
        },
      },
      featureFlag: {
        description: (req?.mediaAsset?.components?.["primary"]?.description ?? ""),
        owner: { displayName: (req?.mediaAsset?.owner?.displayName ?? "") },
      },
    });
    const client1 = this.clients.get<featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient>("acme.featureflags.v1.FeatureFlagValidationService");
    const invoke1: Unary<featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest, featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionResponse> =
      (input, done) => client1.explainFeatureFlagDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest, featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionResponse>(invoke1, request1);
    const request2 = formsFormQueryServiceApi.BrowseFormsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<formsFormQueryServiceApi.BrowseFormsRequest, formsFormQueryServiceApi.BrowseFormsResponse> =
      (input, done) => this.formsFormQueryClient.browseForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<formsFormQueryServiceApi.BrowseFormsRequest, formsFormQueryServiceApi.BrowseFormsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = notificationsNotificationNotificationServiceApi.StreamNotificationNoticesRequest.fromPartial({
      context: req?.context,
      subscriber: { email: (req?.mediaAsset?.owner?.email ?? "") },
    });
    const stream3 = this.notificationsNotificationNotificationClient.streamNotificationNotices(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? notificationsNotificationNotificationServiceApi.StreamNotificationNoticesResponse.fromPartial({});
    const request4 = formsFormCalculationServiceApi.RecalculateFormsRequest.fromPartial({
      context: req?.context,
      form: { audit: { createdBy: (req?.mediaAsset?.audit?.createdBy ?? "") } },
    });
    const invoke4: Unary<formsFormCalculationServiceApi.RecalculateFormsRequest, formsFormCalculationServiceApi.RecalculateFormsResponse> =
      (input, done) => this.formsFormCalculationClient.recalculateForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<formsFormCalculationServiceApi.RecalculateFormsRequest, formsFormCalculationServiceApi.RecalculateFormsResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationResponse.fromPartial({
        mediaAsset: { audit: { createdBy: (reply4?.form?.audit?.createdBy ?? "") } },
      }),
      mediaMediaAssetCalculationServiceApi.ExplainMediaAssetCalculationResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          specs: (req?.mediaAsset?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Returns a media asset.
   */
  async getMediaAssetRates(req: mediaMediaAssetCalculationServiceApi.GetMediaAssetRatesRequest): Promise<mediaMediaAssetCalculationServiceApi.GetMediaAssetRatesResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetMediaAssetRates", req);
    this.logger.info("get_media_asset_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    return mediaMediaAssetCalculationServiceApi.GetMediaAssetRatesResponse.fromPartial({ mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") } });
  }

  /**
   * Quotes a media asset.
   */
  async quoteMediaAsset(req: mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest): Promise<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "QuoteMediaAsset", req);
    this.logger.info("quote_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.mediaAsset?.audit?.updatedAt,
        ownerId: (req?.mediaAsset?.owner?.userId ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.CountSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseQueryClient.countSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.CountSurveyResponsesResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          locality: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.locality ?? ""),
          recipient: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.recipient ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.calculateDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (req?.mediaAsset?.owner?.email ?? "") } },
    });
    const reply3 = await this.workQueue.enqueue<notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse>(
      "acme.media.v1.MediaAssetCalculationService/QuoteMediaAsset:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse.fromPartial({
        mediaAsset: {
          owner: { displayName: (reply2?.deliveryAttempt?.subject?.displayName ?? "") },
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse.fromPartial({
        mediaAsset: { audit: { updatedBy: (reply3?.subscription?.audit?.updatedBy ?? "") } },
      }),
      mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          status: req?.mediaAsset?.status,
        },
      }),
    );
  }

  /**
   * Recalculates a media asset.
   */
  async recalculateMediaAssets(req: mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest): Promise<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "RecalculateMediaAssets", req);
    this.logger.info("recalculate_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = configurationConfigSetServiceApi.SearchConfigSetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.mediaAsset?.audit?.createdAt,
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<configurationConfigSetServiceApi.SearchConfigSetsRequest, configurationConfigSetServiceApi.SearchConfigSetsResponse> =
      (input, done) => this.configurationConfigSetClient.searchConfigSets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<configurationConfigSetServiceApi.SearchConfigSetsRequest, configurationConfigSetServiceApi.SearchConfigSetsResponse>(invoke1, request1);
    const request2 = personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: { createdBy: (req?.mediaAsset?.audit?.createdBy ?? "") },
        counterparty: { displayName: (req?.mediaAsset?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest, personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.checkRecommendationEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        recipient: { email: (reply2?.recommendation?.counterparty?.email ?? "") },
        variables: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke3: Unary<notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse> =
      (input, done) => this.notificationsNotificationNotificationClient.unsubscribeNotificationUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    let selected4_1: string | undefined;
    switch (reply2?.recommendation?.settlement?.$case) {
      case "bank":
        selected4_1 = ((reply2?.recommendation?.settlement?.$case === "bank" ? reply2?.recommendation?.settlement.bank : undefined)?.iban ?? "");
        break;
      default:
        selected4_1 = "";
    }
    let selected4_2: string | undefined;
    switch (req?.mediaAsset?.locator?.$case) {
      case "address":
        selected4_2 = ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected4_2 = "";
    }
    const request4 = notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: { createdAt: reply2?.recommendation?.audit?.createdAt },
        settlement: { $case: "bank", bank: { iban: (selected4_1 ?? "") } },
        billingAddress: { recipient: (selected4_2 ?? "") },
        lines: [{ quantity: (req?.mediaAsset?.components?.["primary"]?.quantity ?? 0) }],
      },
    });
    const invoke4: Unary<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateSyncClient.syncNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse.fromPartial({
        mediaAsset: { audit: { createdAt: reply2?.recommendation?.audit?.createdAt } },
      }),
      mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse.fromPartial({
        mediaAsset: {
          audit: { updatedBy: (reply4?.notificationTemplate?.audit?.updatedBy ?? "") },
          owner: {
            displayName: (reply4?.notificationTemplate?.counterparty?.displayName ?? ""),
          },
        },
      }),
      mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse.fromPartial({
        mediaAsset: {
          capacity: (req?.mediaAsset?.capacity ?? 0),
          mediaAssetId: (req?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a media asset.
   */
  async simulateMediaAsset(req: mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest): Promise<mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "SimulateMediaAsset", req);
    this.logger.info("simulate_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = sponsorshipsSponsorServiceApi.UpdateSponsorRequest.fromPartial({
      context: req?.context,
      sponsor: {
        primaryAddress: { locality: (req?.details?.destination?.locality ?? "") },
        relationshipManager: { displayName: (req?.mediaAsset?.owner?.displayName ?? "") },
      },
    });
    const method1 = "updateSponsor" as const;
    const invoke1: Unary<sponsorshipsSponsorServiceApi.UpdateSponsorRequest, sponsorshipsSponsorServiceApi.UpdateSponsorResponse> =
      (input, done) => this.sponsorshipsSponsorClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<sponsorshipsSponsorServiceApi.UpdateSponsorRequest, sponsorshipsSponsorServiceApi.UpdateSponsorResponse>(invoke1, request1);
    const request2 = chatChatBotQueryServiceApi.SummarizeChatBotsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        period: reply1?.sponsor?.preferences?.quietHours,
      },
      reason: (req?.reason ?? ""),
    });
    const proxy2 = forwarding(this.chatChatBotQueryClient);
    const invoke2: Unary<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse> =
      (input, done) => proxy2.summarizeChatBots(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse.fromPartial({
        mediaAsset: {
          owner: {
            displayName: (reply1?.sponsor?.relationshipManager?.displayName ?? ""),
          },
        },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse.fromPartial({
        mediaAsset: {
          mediaAssetId: (req?.mediaAssetId ?? ""),
          name: (req?.mediaAsset?.name ?? ""),
        },
      }),
    );
  }
}
