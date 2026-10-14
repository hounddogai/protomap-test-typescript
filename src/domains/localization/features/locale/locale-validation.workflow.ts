/**
 * Checks locales against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as commonMoneyApi from "../../../../../.cache/proto/acme/common/v1/money.js";
import * as localizationLocaleCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as sponsorshipsSponsorQueryServiceApi from "../../../../../.cache/proto/acme/sponsorships/v1/sponsor_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toLocaleRecord } from "../../data/records.js";
import { LocalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate locale operations and persist audit data.
 */
@injectable()
export class LocaleValidationWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.localization.v1.LocaleCalculationService") private readonly localizationLocaleCalculationClient: localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.sponsorships.v1.SponsorQueryService") private readonly sponsorshipsSponsorQueryClient: sponsorshipsSponsorQueryServiceApi.SponsorQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a locale.
   */
  async checkLocaleEligibility(req: localizationLocaleValidationServiceApi.CheckLocaleEligibilityRequest): Promise<localizationLocaleValidationServiceApi.CheckLocaleEligibilityResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "CheckLocaleEligibility", req);
    this.logger.info("check_locale_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: { createdBy: (req?.locale?.audit?.createdBy ?? "") },
        counterparty: { displayName: (req?.locale?.owner?.displayName ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityRequest, notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityResponse>(
      "acme.localization.v1.LocaleValidationService/CheckLocaleEligibility:0", request1,
    );
    const request2 = localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest.fromPartial({
      context: req?.context,
      translationJob: {
        comments: [{ createdAt: reply1?.notificationTemplate?.audit?.createdAt }],
        requester: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const invoke2: Unary<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest, localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.explainTranslationJobCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest, localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleValidationServiceApi.CheckLocaleEligibilityResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      localizationLocaleValidationServiceApi.CheckLocaleEligibilityResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      localizationLocaleValidationServiceApi.CheckLocaleEligibilityResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          name: (req?.locale?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a locale.
   */
  async explainLocaleDecision(req: localizationLocaleValidationServiceApi.ExplainLocaleDecisionRequest): Promise<localizationLocaleValidationServiceApi.ExplainLocaleDecisionResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "ExplainLocaleDecision", req);
    this.logger.info("explain_locale_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: { email: (req?.details?.contact?.email ?? "") },
        audit: {
          etag: (req?.locale?.audit?.etag ?? ""),
          updatedAt: req?.locale?.audit?.updatedAt,
        },
      },
    });
    const invoke1: Unary<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.calculateTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = localizationLocaleCalculationServiceApi.CalculateLocaleRequest.fromPartial({
      context: req?.context,
      locale: { owner: { email: (reply1?.translationJob?.assignee?.email ?? "") } },
    });
    const invoke2: Unary<localizationLocaleCalculationServiceApi.CalculateLocaleRequest, localizationLocaleCalculationServiceApi.CalculateLocaleResponse> =
      (input, done) => this.localizationLocaleCalculationClient.calculateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    let selected3_1: string | undefined;
    switch (reply1?.translationJob?.origin?.$case) {
      case "customer":
        selected3_1 = ((reply1?.translationJob?.origin?.$case === "customer" ? reply1?.translationJob?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected3_1 = "";
    }
    let selected3_2: commonMoneyApi.Money | undefined;
    switch (req?.locale?.action?.$case) {
      case "discount":
        selected3_2 = (req?.locale?.action?.$case === "discount" ? req?.locale?.action.discount : undefined)?.amount;
        break;
      default:
        selected3_2 = undefined;
    }
    const request3 = localizationLocaleCalculationServiceApi.EstimateLocaleRequest.fromPartial({
      context: req?.context,
      locale: {
        action: { $case: "discount", discount: { amount: selected3_2 } },
        owner: { displayName: (selected3_1 ?? "") },
      },
    });
    const invoke3: Unary<localizationLocaleCalculationServiceApi.EstimateLocaleRequest, localizationLocaleCalculationServiceApi.EstimateLocaleResponse> =
      (input, done) => this.localizationLocaleCalculationClient.estimateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationLocaleCalculationServiceApi.EstimateLocaleRequest, localizationLocaleCalculationServiceApi.EstimateLocaleResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleValidationServiceApi.ExplainLocaleDecisionResponse.fromPartial({
        locale: {
          owner: { displayName: (reply1?.translationJob?.assignee?.displayName ?? "") },
        },
      }),
      localizationLocaleValidationServiceApi.ExplainLocaleDecisionResponse.fromPartial({ locale: { localeId: (reply2?.locale?.localeId ?? "") } }),
      localizationLocaleValidationServiceApi.ExplainLocaleDecisionResponse.fromPartial({
        locale: {
          audit: { createdBy: (reply3?.locale?.audit?.createdBy ?? "") },
          effective: reply3?.locale?.effective,
        },
      }),
      localizationLocaleValidationServiceApi.ExplainLocaleDecisionResponse.fromPartial({
        locale: {
          description: (req?.locale?.description ?? ""),
          priority: (req?.locale?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Returns a locale.
   */
  async getLocaleRules(req: localizationLocaleValidationServiceApi.GetLocaleRulesRequest): Promise<localizationLocaleValidationServiceApi.GetLocaleRulesResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetLocaleRules", req);
    this.logger.info("get_locale_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest.fromPartial({
      context: req?.context,
      translationKey: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const method1 = "compareTranslationKeyOptions" as const;
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse>(invoke1, request1);
    return mergeResponses(
      localizationLocaleValidationServiceApi.GetLocaleRulesResponse.fromPartial({
        locale: { audit: { updatedAt: reply1?.translationKey?.audit?.updatedAt } },
      }),
      localizationLocaleValidationServiceApi.GetLocaleRulesResponse.fromPartial({ locale: { localeId: (req?.localeId ?? "") } }),
    );
  }

  /**
   * Lints a locale.
   */
  async lintLocales(req: localizationLocaleValidationServiceApi.LintLocalesRequest): Promise<localizationLocaleValidationServiceApi.LintLocalesResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "LintLocales", req);
    this.logger.info("lint_locales", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: req?.details?.contact?.name,
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
      translationJob: {
        origin: { $case: "customer", customer: { email: (req?.details?.contact?.email ?? "") } },
      },
    });
    const proxy1 = forwarding(this.localizationTranslationJobCalculationClient);
    const invoke1: Unary<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest, localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse> =
      (input, done) => proxy1.explainTranslationJobCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest, localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleValidationServiceApi.LintLocalesResponse.fromPartial({
        locale: { owner: { email: (reply1?.translationJob?.assignee?.email ?? "") } },
        outcome: { status: (reply1?.outcome?.status ?? "") },
      }),
      localizationLocaleValidationServiceApi.LintLocalesResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          status: req?.locale?.status,
        },
      }),
    );
  }

  /**
   * Normalizes a locale.
   */
  async normalizeLocale(req: localizationLocaleValidationServiceApi.NormalizeLocaleRequest): Promise<localizationLocaleValidationServiceApi.NormalizeLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "NormalizeLocale", req);
    this.logger.info("normalize_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.locale?.action?.$case) {
      case "route":
        selected1_1 = ((req?.locale?.action?.$case === "route" ? req?.locale?.action.route : undefined)?.target ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = localizationLocaleCalculationServiceApi.CompareLocaleOptionsRequest.fromPartial({
      context: req?.context,
      locale: {
        owner: { email: (req?.locale?.owner?.email ?? "") },
        action: { $case: "route", route: { target: (selected1_1 ?? "") } },
      },
    });
    const invoke1: Unary<localizationLocaleCalculationServiceApi.CompareLocaleOptionsRequest, localizationLocaleCalculationServiceApi.CompareLocaleOptionsResponse> =
      (input, done) => this.localizationLocaleCalculationClient.compareLocaleOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleCalculationServiceApi.CompareLocaleOptionsRequest, localizationLocaleCalculationServiceApi.CompareLocaleOptionsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleValidationServiceApi.NormalizeLocaleResponse.fromPartial({
        locale: {
          scopes: (reply1?.locale?.scopes ?? []),
          status: reply1?.locale?.status,
        },
      }),
      localizationLocaleValidationServiceApi.NormalizeLocaleResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          priority: (req?.locale?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Previews a locale.
   */
  async previewLocale(req: localizationLocaleValidationServiceApi.PreviewLocaleRequest): Promise<localizationLocaleValidationServiceApi.PreviewLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "PreviewLocale", req);
    this.logger.info("preview_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.locale?.owner?.email ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse> =
      (input, done) => this.personalizationProfileCalculationClient.explainProfileCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = sponsorshipsSponsorQueryServiceApi.CountSponsorsRequest.fromPartial({
      context: input2?.context,
      filter: { region: (reply1?.profile?.primaryAddress?.region ?? "") },
    });
    const invoke2: Unary<sponsorshipsSponsorQueryServiceApi.CountSponsorsRequest, sponsorshipsSponsorQueryServiceApi.CountSponsorsResponse> =
      (input, done) => this.sponsorshipsSponsorQueryClient.countSponsors(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<sponsorshipsSponsorQueryServiceApi.CountSponsorsRequest, sponsorshipsSponsorQueryServiceApi.CountSponsorsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleValidationServiceApi.PreviewLocaleResponse.fromPartial({ locale: { owner: { email: (reply1?.profile?.contact?.email ?? "") } } }),
      localizationLocaleValidationServiceApi.PreviewLocaleResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      localizationLocaleValidationServiceApi.PreviewLocaleResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          version: (req?.locale?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Scores a locale.
   */
  async scoreLocale(req: localizationLocaleValidationServiceApi.ScoreLocaleRequest): Promise<localizationLocaleValidationServiceApi.ScoreLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "ScoreLocale", req);
    this.logger.info("score_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.LintAffinitiesRequest.fromPartial({
      affinity: { subject: { displayName: (req?.locale?.owner?.displayName ?? "") } },
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { contact: { email: (req?.locale?.owner?.email ?? "") } },
    });
    const cloned1: personalizationAffinityValidationServiceApi.LintAffinitiesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse> =
      (input, done) => this.personalizationAffinityValidationClient.lintAffinities(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse>(invoke1, cloned1);
    const request2 = localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.locale?.owner?.email ?? "") } },
      translationJob: {
        audit: { createdBy: (req?.locale?.audit?.createdBy ?? "") },
        comments: [{ createdAt: req?.locale?.audit?.createdAt }],
        origin: { $case: "customer", customer: { displayName: (reply1?.affinity?.subject?.displayName ?? "") } },
      },
    });
    const decoded2 = localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest.fromJSON(
      JSON.parse(JSON.stringify(localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest.toJSON(request2))),
    );
    const invoke2: Unary<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest, localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.explainTranslationJobCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest, localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleValidationServiceApi.ScoreLocaleResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      localizationLocaleValidationServiceApi.ScoreLocaleResponse.fromPartial({
        locale: {
          owner: {
            displayName: ((reply2?.translationJob?.origin?.$case === "customer" ? reply2?.translationJob?.origin.customer : undefined)?.displayName ?? ""),
          },
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      localizationLocaleValidationServiceApi.ScoreLocaleResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          status: req?.locale?.status,
        },
      }),
    );
  }

  /**
   * Validates a locale.
   */
  async validateLocale(req: localizationLocaleValidationServiceApi.ValidateLocaleRequest): Promise<localizationLocaleValidationServiceApi.ValidateLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "ValidateLocale", req);
    this.logger.info("validate_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.locale?.owner?.displayName ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.RevertDeliveryAttemptRequest",
      value: Buffer.from(notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.revertDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse>(invoke1, unpacked1);
    const request2 = personalizationProfileCalculationServiceApi.SimulateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        audit: { createdBy: (req?.locale?.audit?.createdBy ?? "") },
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
        relationshipManager: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
      },
    });
    const client2 = this.clients.get<personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient>("acme.personalization.v1.ProfileCalculationService");
    const invoke2: Unary<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse> =
      (input, done) => client2.simulateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleValidationServiceApi.ValidateLocaleResponse.fromPartial({
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
        result: { correlationId: (reply1?.deliveryAttempt?.correlationId ?? "") },
      }),
      localizationLocaleValidationServiceApi.ValidateLocaleResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      localizationLocaleValidationServiceApi.ValidateLocaleResponse.fromPartial({
        locale: {
          description: (req?.locale?.description ?? ""),
          localeId: (req?.localeId ?? ""),
        },
      }),
    );
  }
}
