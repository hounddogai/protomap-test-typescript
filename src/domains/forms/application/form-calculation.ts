/**
 * Computes the figures of a form, such as totals, taxes, and estimates. Remote work stays behind typed client ports.
 */

import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as communityBadgeValidationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as configurationConfigSetCalculationServiceApi from "../../../../.cache/proto/acme/configuration/v1/config_set_calculation_service.js";
import * as documentsDocumentServiceApi from "../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as formsFormCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as labelingLabelingTaskQueryServiceApi from "../../../../.cache/proto/acme/labeling/v1/labeling_task_query_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as telematicsTelemetryReadingCalculationServiceApi from "../../../../.cache/proto/acme/telematics/v1/telemetry_reading_calculation_service.js";
import * as yardsYardQueryServiceApi from "../../../../.cache/proto/acme/yards/v1/yard_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
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
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toFormRecord } from "../data/records.js";
import { FormsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form operations and persist audit data.
 */
@injectable()
export class FormCalculationWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.configuration.v1.ConfigSetCalculationService") private readonly configurationConfigSetCalculationClient: configurationConfigSetCalculationServiceApi.ConfigSetCalculationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.labeling.v1.LabelingTaskQueryService") private readonly labelingLabelingTaskQueryClient: labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobValidationService") private readonly localizationTranslationJobValidationClient: localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyValidationService") private readonly localizationTranslationKeyValidationClient: localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.telematics.v1.TelemetryReadingCalculationService") private readonly telematicsTelemetryReadingCalculationClient: telematicsTelemetryReadingCalculationServiceApi.TelemetryReadingCalculationServiceClient,
    @inject("grpc:acme.yards.v1.YardQueryService") private readonly yardsYardQueryClient: yardsYardQueryServiceApi.YardQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a form.
   */
  async calculateForm(req: formsFormCalculationServiceApi.CalculateFormRequest): Promise<formsFormCalculationServiceApi.CalculateFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "CalculateForm", req);
    this.logger.info("calculate_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = yardsYardQueryServiceApi.ExportYardsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.form?.audit?.updatedAt,
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const stream1 = this.yardsYardQueryClient.exportYards(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? yardsYardQueryServiceApi.ExportYardsResponse.fromPartial({});
    const request2 = chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest.fromPartial({
      chatRoom: { audit: { createdBy: (req?.form?.audit?.createdBy ?? "") } },
      context: req?.context,
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse> =
      (input, done) => this.chatChatRoomValidationClient.checkChatRoomEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormCalculationServiceApi.CalculateFormResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      formsFormCalculationServiceApi.CalculateFormResponse.fromPartial({
        form: {
          counterparty: req?.form?.counterparty,
          formId: (req?.formId ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a form.
   */
  async compareFormOptions(req: formsFormCalculationServiceApi.CompareFormOptionsRequest): Promise<formsFormCalculationServiceApi.CompareFormOptionsResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "CompareFormOptions", req);
    this.logger.info("compare_form_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = identityUserValidationServiceApi.GetUserRulesRequest.fromPartial({
      context: input1?.context,
      userId: (input1?.context?.actor?.userId ?? ""),
    });
    const invoke1: Unary<identityUserValidationServiceApi.GetUserRulesRequest, identityUserValidationServiceApi.GetUserRulesResponse> =
      (input, done) => this.identityUserValidationClient.getUserRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserValidationServiceApi.GetUserRulesRequest, identityUserValidationServiceApi.GetUserRulesResponse>(invoke1, request1);
    const request2 = labelingLabelingTaskQueryServiceApi.BrowseLabelingTasksRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.user?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.user?.attributes ?? {}))),
        ownerId: (req?.form?.formId ?? ""),
        region: (reply1?.user?.primaryAddress?.region ?? ""),
      },
    });
    const cloned2: labelingLabelingTaskQueryServiceApi.BrowseLabelingTasksRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<labelingLabelingTaskQueryServiceApi.BrowseLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.BrowseLabelingTasksResponse> =
      (input, done) => this.labelingLabelingTaskQueryClient.browseLabelingTasks(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<labelingLabelingTaskQueryServiceApi.BrowseLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.BrowseLabelingTasksResponse>(invoke2, cloned2);
    const request3 = telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          recipient: (reply1?.user?.primaryAddress?.recipient ?? ""),
        },
      },
      telemetryReading: {
        subject: { displayName: (reply1?.user?.relationshipManager?.displayName ?? "") },
      },
    });
    const decoded3 = telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsRequest.fromJSON(
      JSON.parse(JSON.stringify(telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsRequest.toJSON(request3))),
    );
    const invoke3: Unary<telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsRequest, telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsResponse> =
      (input, done) => this.telematicsTelemetryReadingCalculationClient.compareTelemetryReadingOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsRequest, telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsResponse>(invoke3, decoded3);
    const request4 = localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (reply1?.user?.contact?.phone ?? "") } },
      translationKey: {
        locator: { $case: "address", address: { postalCode: (reply1?.user?.primaryAddress?.postalCode ?? "") } },
      },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.CheckTranslationKeyEligibilityRequest",
      value: Buffer.from(localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest.encode(request4).finish()),
    });
    const unpacked4 = localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest.decode(envelope4.value);
    const invoke4: Unary<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse> =
      (input, done) => this.localizationTranslationKeyValidationClient.checkTranslationKeyEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormCalculationServiceApi.CompareFormOptionsResponse.fromPartial({
        form: {
          billingAddress: {
            countryCode: (reply1?.user?.primaryAddress?.countryCode ?? ""),
            recipient: (reply1?.user?.primaryAddress?.recipient ?? ""),
          },
        },
      }),
      formsFormCalculationServiceApi.CompareFormOptionsResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      formsFormCalculationServiceApi.CompareFormOptionsResponse.fromPartial({
        breakdown: { total: reply3?.breakdown?.total },
        form: { lines: [{ attributes: (reply3?.telemetryReading?.attributes ?? {}) }] },
      }),
      formsFormCalculationServiceApi.CompareFormOptionsResponse.fromPartial({
        form: {
          audit: { createdBy: (reply4?.translationKey?.audit?.createdBy ?? "") },
          billingAddress: {
            locality: ((reply4?.translationKey?.locator?.$case === "address" ? reply4?.translationKey?.locator.address : undefined)?.locality ?? ""),
          },
        },
      }),
      formsFormCalculationServiceApi.CompareFormOptionsResponse.fromPartial({
        form: {
          dueAt: req?.form?.dueAt,
          formId: (req?.formId ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a form.
   */
  async estimateForm(req: formsFormCalculationServiceApi.EstimateFormRequest): Promise<formsFormCalculationServiceApi.EstimateFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "EstimateForm", req);
    this.logger.info("estimate_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentServiceApi.WatchDocumentsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
    });
    const stream1 = this.documentsDocumentClient.watchDocuments(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? documentsDocumentServiceApi.WatchDocumentsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return formsFormCalculationServiceApi.EstimateFormResponse.fromPartial({
      form: {
        formId: (req?.formId ?? ""),
        number: (req?.form?.number ?? ""),
      },
    });
  }

  /**
   * Explains a form.
   */
  async explainFormCalculation(req: formsFormCalculationServiceApi.ExplainFormCalculationRequest): Promise<formsFormCalculationServiceApi.ExplainFormCalculationResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "ExplainFormCalculation", req);
    this.logger.info("explain_form_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.SimulateProfileRequest.fromPartial({
      context: req?.context,
      profile: { audit: { updatedBy: (req?.form?.audit?.updatedBy ?? "") } },
    });
    const client1 = this.clients.get<personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient>("acme.personalization.v1.ProfileCalculationService");
    const invoke1: Unary<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse> =
      (input, done) => client1.simulateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse>(invoke1, request1);
    const request2 = localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (req?.form?.billingAddress?.countryCode ?? "") },
      },
      translationKey: {
        audit: { updatedBy: (req?.form?.audit?.updatedBy ?? "") },
        owner: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const invoke2: Unary<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.calculateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest.fromPartial({
      context: req?.context,
      recommendation: { counterparty: { email: (req?.form?.counterparty?.email ?? "") } },
    });
    const invoke3: Unary<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.explainRecommendationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormCalculationServiceApi.ExplainFormCalculationResponse.fromPartial({
        form: {
          audit: { updatedBy: (reply1?.profile?.audit?.updatedBy ?? "") },
          billingAddress: { locality: (reply1?.profile?.primaryAddress?.locality ?? "") },
        },
      }),
      formsFormCalculationServiceApi.ExplainFormCalculationResponse.fromPartial({
        form: {
          billingAddress: {
            locality: ((reply2?.translationKey?.locator?.$case === "address" ? reply2?.translationKey?.locator.address : undefined)?.locality ?? ""),
            recipient: ((reply2?.translationKey?.locator?.$case === "address" ? reply2?.translationKey?.locator.address : undefined)?.recipient ?? ""),
          },
        },
      }),
      formsFormCalculationServiceApi.ExplainFormCalculationResponse.fromPartial({
        form: {
          billingAddress: { lines: (reply3?.recommendation?.billingAddress?.lines ?? []) },
        },
      }),
      formsFormCalculationServiceApi.ExplainFormCalculationResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          issuedAt: req?.form?.issuedAt,
        },
      }),
    );
  }

  /**
   * Returns a form.
   */
  async getFormRates(req: formsFormCalculationServiceApi.GetFormRatesRequest): Promise<formsFormCalculationServiceApi.GetFormRatesResponse> {
    validateContext(req.context);
    if (!req.formId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetFormRates", req);
    this.logger.info("get_form_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest.fromPartial({
      badge: { owner: { email: (req?.context?.actor?.email ?? "") } },
      context: req?.context,
    });
    const invoke1: Unary<communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest, communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse> =
      (input, done) => this.communityBadgeValidationClient.explainBadgeDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("GetFormRates.ExplainBadgeDecision", () => call<communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest, communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse>(invoke1, request1));
    return mergeResponses(
      formsFormCalculationServiceApi.GetFormRatesResponse.fromPartial({
        form: {
          audit: { createdAt: reply1?.badge?.audit?.createdAt },
          lines: [{ description: (reply1?.badge?.description ?? "") }],
        },
      }),
      formsFormCalculationServiceApi.GetFormRatesResponse.fromPartial({ form: { formId: (req?.formId ?? "") } }),
    );
  }

  /**
   * Quotes a form.
   */
  async quoteForm(req: formsFormCalculationServiceApi.QuoteFormRequest): Promise<formsFormCalculationServiceApi.QuoteFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "QuoteForm", req);
    this.logger.info("quote_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { contact: { email: (req?.form?.counterparty?.email ?? "") } },
      exposure: {
        subject: { displayName: (req?.form?.counterparty?.displayName ?? "") },
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest, experimentsExposureValidationServiceApi.CheckExposureEligibilityResponse> =
      (input, done) => this.experimentsExposureValidationClient.checkExposureEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.form?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.exposure?.attributes ?? {}))),
        ownerId: (reply1?.exposure?.exposureId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksResponse>(
      "acme.forms.v1.FormCalculationService/QuoteForm:1", request2,
    );
    const request3 = identityUserQueryServiceApi.PeekUserRequest.fromPartial({
      context: req?.context,
      userId: (req?.context?.actor?.userId ?? ""),
    });
    const invoke3: Unary<identityUserQueryServiceApi.PeekUserRequest, identityUserQueryServiceApi.PeekUserResponse> =
      (input, done) => this.identityUserQueryClient.peekUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<identityUserQueryServiceApi.PeekUserRequest, identityUserQueryServiceApi.PeekUserResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      formsFormCalculationServiceApi.QuoteFormResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      formsFormCalculationServiceApi.QuoteFormResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      formsFormCalculationServiceApi.QuoteFormResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      formsFormCalculationServiceApi.QuoteFormResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          number: (req?.form?.number ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a form.
   */
  async recalculateForms(req: formsFormCalculationServiceApi.RecalculateFormsRequest): Promise<formsFormCalculationServiceApi.RecalculateFormsResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "RecalculateForms", req);
    this.logger.info("recalculate_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.form?.dueAt,
        region: (req?.form?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest, notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient.listSubscriptionConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormCalculationServiceApi.RecalculateFormsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      formsFormCalculationServiceApi.RecalculateFormsResponse.fromPartial({
        breakdown: { total: req?.form?.total },
        form: { formId: (req?.formId ?? "") },
      }),
    );
  }

  /**
   * Simulates a form.
   */
  async simulateForm(req: formsFormCalculationServiceApi.SimulateFormRequest): Promise<formsFormCalculationServiceApi.SimulateFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "SimulateForm", req);
    this.logger.info("simulate_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.RecalculateProfilesRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.form?.billingAddress?.lines ?? []).map((value) => value) },
      },
      profile: {
        audit: { createdAt: req?.form?.audit?.createdAt },
        primaryAddress: { locality: (req?.details?.destination?.locality ?? "") },
      },
    });
    const invoke1: Unary<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse> =
      (input, done) => this.personalizationProfileCalculationClient.recalculateProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = configurationConfigSetCalculationServiceApi.CalculateConfigSetRequest.fromPartial({
      configSet: {
        children: [{
          children: [{
            audit: { createdBy: (req?.form?.audit?.createdBy ?? "") },
            location: {
              lines: (reply1?.profile?.primaryAddress?.lines ?? []).map((value) => value),
            },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke2: Unary<configurationConfigSetCalculationServiceApi.CalculateConfigSetRequest, configurationConfigSetCalculationServiceApi.CalculateConfigSetResponse> =
      (input, done) => this.configurationConfigSetCalculationClient.calculateConfigSet(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: {
        audit: {
          createdAt: reply1?.profile?.audit?.createdAt,
          createdBy: (req?.form?.audit?.createdBy ?? ""),
        },
      },
    });
    const method3 = "validateTranslationJob" as const;
    const invoke3: Unary<localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest, localizationTranslationJobValidationServiceApi.ValidateTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobValidationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest, localizationTranslationJobValidationServiceApi.ValidateTranslationJobResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormCalculationServiceApi.SimulateFormResponse.fromPartial({
        form: {
          billingAddress: { locality: (reply1?.profile?.primaryAddress?.locality ?? "") },
          number: ((reply1?.profile?.identityDocument?.$case === "passport" ? reply1?.profile?.identityDocument.passport : undefined)?.number ?? ""),
        },
      }),
      formsFormCalculationServiceApi.SimulateFormResponse.fromPartial({
        form: {
          billingAddress: {
            lines: (reply2?.configSet?.location?.lines ?? []),
            recipient: (reply2?.configSet?.location?.recipient ?? ""),
          },
        },
      }),
      formsFormCalculationServiceApi.SimulateFormResponse.fromPartial({
        form: {
          counterparty: {
            displayName: ((reply3?.translationJob?.origin?.$case === "customer" ? reply3?.translationJob?.origin.customer : undefined)?.displayName ?? ""),
          },
        },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      formsFormCalculationServiceApi.SimulateFormResponse.fromPartial({
        breakdown: { total: req?.form?.total },
        form: { formId: (req?.formId ?? "") },
      }),
    );
  }
}
