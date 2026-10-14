/**
 * Computes the figures of a locale, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as appointmentsAppointmentQueryServiceApi from "../../../../../.cache/proto/acme/appointments/v1/appointment_query_service.js";
import * as authorizationAccessPolicyServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
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
import { toLocaleRecord } from "../../data/records.js";
import { LocalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate locale operations and persist audit data.
 */
@injectable()
export class LocaleCalculationWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.appointments.v1.AppointmentQueryService") private readonly appointmentsAppointmentQueryClient: appointmentsAppointmentQueryServiceApi.AppointmentQueryServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentQueryService") private readonly experimentsExperimentQueryClient: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a locale.
   */
  async calculateLocale(req: localizationLocaleCalculationServiceApi.CalculateLocaleRequest): Promise<localizationLocaleCalculationServiceApi.CalculateLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "CalculateLocale", req);
    this.logger.info("calculate_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest.fromPartial({
      context: input1?.context,
      featureFlag: {
        audit: {
          updatedAt: input1?.locale?.audit?.updatedAt,
          updatedBy: (input1?.locale?.audit?.updatedBy ?? ""),
        },
        action: { $case: "discount", discount: {
          percent: ((input1?.locale?.action?.$case === "discount" ? input1?.locale?.action.discount : undefined)?.percent ?? 0),
        } },
        owner: { email: (input1?.locale?.owner?.email ?? "") },
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.normalizeFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagResponse>(invoke1, request1);
    const tasks2: Array<() => Promise<notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionResponse>> = [];
    for (const item of (req?.locale?.conditions ?? [])) {
      tasks2.push(async () => {
        const request2 = notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionRequest.fromPartial({
          context: req?.context,
          subscription: {
            conditions: [{
              negate: (item?.negate ?? false),
              value: (item?.value ?? ""),
            }],
          },
        });
        const invoke2: Unary<notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionResponse> =
          (input, done) => this.notificationsSubscriptionCalculationClient.simulateSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? notificationsSubscriptionCalculationServiceApi.SimulateSubscriptionResponse.fromPartial({});
    const request3 = localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.featureFlag?.owner?.email ?? "") } },
      translationKey: {
        locator: { $case: "address", address: { locality: (req?.details?.destination?.locality ?? "") } },
      },
    });
    const cloned3: localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.explainTranslationKeyCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest, localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse>(invoke3, cloned3);
    const request4 = notificationsNotificationQueryServiceApi.ExportNotificationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply3?.translationKey?.audit?.createdAt,
        ownerId: (reply1?.featureFlag?.owner?.userId ?? ""),
        region: ((reply3?.translationKey?.locator?.$case === "address" ? reply3?.translationKey?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream4 = this.notificationsNotificationQueryClient.exportNotifications(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const messages4 = await collect(stream4);
    const reply4 = messages4.at(-1) ?? notificationsNotificationQueryServiceApi.ExportNotificationsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleCalculationServiceApi.CalculateLocaleResponse.fromPartial({ locale: { owner: reply1?.featureFlag?.owner } }),
      localizationLocaleCalculationServiceApi.CalculateLocaleResponse.fromPartial({
        locale: { owner: { email: (reply3?.translationKey?.owner?.email ?? "") } },
      }),
      localizationLocaleCalculationServiceApi.CalculateLocaleResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          priority: (req?.locale?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Compares a locale.
   */
  async compareLocaleOptions(req: localizationLocaleCalculationServiceApi.CompareLocaleOptionsRequest): Promise<localizationLocaleCalculationServiceApi.CompareLocaleOptionsResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "CompareLocaleOptions", req);
    this.logger.info("compare_locale_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyServiceApi.WatchAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.locale?.audit?.createdAt,
        region: (req?.details?.destination?.region ?? ""),
      },
      subscriber: { email: (req?.locale?.owner?.email ?? "") },
    });
    const stream1 = this.authorizationAccessPolicyClient.watchAccessPolicies(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? authorizationAccessPolicyServiceApi.WatchAccessPoliciesResponse.fromPartial({});
    const request2 = localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
    });
    const decoded2 = localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest.fromJSON(
      JSON.parse(JSON.stringify(localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest.toJSON(request2))),
    );
    const invoke2: Unary<localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.quoteTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleCalculationServiceApi.CompareLocaleOptionsResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      localizationLocaleCalculationServiceApi.CompareLocaleOptionsResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          name: (req?.locale?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a locale.
   */
  async estimateLocale(req: localizationLocaleCalculationServiceApi.EstimateLocaleRequest): Promise<localizationLocaleCalculationServiceApi.EstimateLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "EstimateLocale", req);
    this.logger.info("estimate_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
      translationKey: {
        locator: { $case: "address", address: { locality: (req?.details?.destination?.locality ?? "") } },
        audit: { createdBy: (req?.locale?.audit?.createdBy ?? "") },
        owner: { userId: (req?.locale?.owner?.userId ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.EstimateTranslationKeyRequest",
      value: Buffer.from(localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest.encode(request1).finish()),
    });
    const unpacked1 = localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest.decode(envelope1.value);
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.estimateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse>(invoke1, unpacked1);
    let selected2_4: string | undefined;
    switch (reply1?.translationKey?.locator?.$case) {
      case "address":
        selected2_4 = ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected2_4 = "";
    }
    const request2 = localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          locality: (selected2_4 ?? ""),
        } },
        audit: { createdBy: (req?.locale?.audit?.createdBy ?? "") },
        dimensions: { height: (reply1?.translationKey?.dimensions?.height ?? 0) },
      },
    });
    const invoke2: Unary<localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.quoteTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse>(invoke2, request2);
    const request3 = localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          locality: (req?.details?.destination?.locality ?? ""),
        },
      },
      translationKey: {
        audit: { updatedAt: reply1?.translationKey?.audit?.updatedAt },
        components: { primary: {
          componentId: (reply2?.translationKey?.components?.["primary"]?.componentId ?? ""),
        } },
      },
    });
    const invoke3: Unary<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.compareTranslationKeyOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleCalculationServiceApi.EstimateLocaleResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      localizationLocaleCalculationServiceApi.EstimateLocaleResponse.fromPartial({
        locale: {
          description: (reply2?.translationKey?.components?.["primary"]?.description ?? ""),
        },
      }),
      localizationLocaleCalculationServiceApi.EstimateLocaleResponse.fromPartial({
        locale: {
          audit: { createdAt: reply3?.translationKey?.audit?.createdAt },
          owner: { userId: (reply3?.translationKey?.owner?.userId ?? "") },
        },
      }),
      localizationLocaleCalculationServiceApi.EstimateLocaleResponse.fromPartial({
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
  async explainLocaleCalculation(req: localizationLocaleCalculationServiceApi.ExplainLocaleCalculationRequest): Promise<localizationLocaleCalculationServiceApi.ExplainLocaleCalculationResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "ExplainLocaleCalculation", req);
    this.logger.info("explain_locale_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest.fromPartial({
      context: req?.context,
      translationKey: { owner: { displayName: (req?.locale?.owner?.displayName ?? "") } },
    });
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.compareTranslationKeyOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse>(invoke1, request1));
    let selected2_1: string | undefined;
    switch (reply1?.translationKey?.locator?.$case) {
      case "address":
        selected2_1 = ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_3: string | undefined;
    switch (reply1?.translationKey?.locator?.$case) {
      case "address":
        selected2_3 = ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (selected2_3 ?? ""),
          postalCode: (selected2_1 ?? ""),
        },
      },
      translationKey: {
        audit: {
          createdAt: reply1?.translationKey?.audit?.createdAt,
          updatedAt: reply1?.translationKey?.audit?.updatedAt,
        },
      },
    });
    const invoke2: Unary<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.recalculateTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleCalculationServiceApi.ExplainLocaleCalculationResponse.fromPartial({
        locale: { owner: { userId: (reply1?.translationKey?.owner?.userId ?? "") } },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      localizationLocaleCalculationServiceApi.ExplainLocaleCalculationResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      localizationLocaleCalculationServiceApi.ExplainLocaleCalculationResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          name: (req?.locale?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a locale.
   */
  async getLocaleRates(req: localizationLocaleCalculationServiceApi.GetLocaleRatesRequest): Promise<localizationLocaleCalculationServiceApi.GetLocaleRatesResponse> {
    validateContext(req.context);
    if (!req.localeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "locale_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetLocaleRates", req);
    this.logger.info("get_locale_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const invoke1: Unary<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.normalizeSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return mergeResponses(
      localizationLocaleCalculationServiceApi.GetLocaleRatesResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      localizationLocaleCalculationServiceApi.GetLocaleRatesResponse.fromPartial({ locale: { localeId: (req?.localeId ?? "") } }),
    );
  }

  /**
   * Quotes a locale.
   */
  async quoteLocale(req: localizationLocaleCalculationServiceApi.QuoteLocaleRequest): Promise<localizationLocaleCalculationServiceApi.QuoteLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "QuoteLocale", req);
    this.logger.info("quote_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.locale?.owner?.displayName ?? "") } },
      details: { contact: { email: (req?.locale?.owner?.email ?? "") } },
      reason: ((req?.locale?.action?.$case === "block" ? req?.locale?.action.block : undefined)?.reason ?? ""),
    });
    const reply1 = await this.workQueue.enqueue<notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptResponse>(
      "acme.localization.v1.LocaleCalculationService/QuoteLocale:0", request1,
    );
    const request2 = appointmentsAppointmentQueryServiceApi.ResolveAppointmentsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<appointmentsAppointmentQueryServiceApi.ResolveAppointmentsRequest, appointmentsAppointmentQueryServiceApi.ResolveAppointmentsResponse> =
      (input, done) => this.appointmentsAppointmentQueryClient.resolveAppointments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<appointmentsAppointmentQueryServiceApi.ResolveAppointmentsRequest, appointmentsAppointmentQueryServiceApi.ResolveAppointmentsResponse>(invoke2, request2));
    const request3 = experimentsExperimentQueryServiceApi.SuggestExperimentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.locale?.audit?.updatedAt,
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const invoke3: Unary<experimentsExperimentQueryServiceApi.SuggestExperimentsRequest, experimentsExperimentQueryServiceApi.SuggestExperimentsResponse> =
      (input, done) => this.experimentsExperimentQueryClient.suggestExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<experimentsExperimentQueryServiceApi.SuggestExperimentsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: { audit: { createdAt: req?.locale?.audit?.createdAt } },
    });
    const invoke4: Unary<localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.quoteTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleCalculationServiceApi.QuoteLocaleResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      localizationLocaleCalculationServiceApi.QuoteLocaleResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      localizationLocaleCalculationServiceApi.QuoteLocaleResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      localizationLocaleCalculationServiceApi.QuoteLocaleResponse.fromPartial({
        locale: {
          audit: { createdAt: reply4?.translationKey?.audit?.createdAt },
          owner: { displayName: (reply4?.translationKey?.owner?.displayName ?? "") },
        },
      }),
      localizationLocaleCalculationServiceApi.QuoteLocaleResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        locale: { localeId: (req?.localeId ?? "") },
      }),
    );
  }

  /**
   * Recalculates a locale.
   */
  async recalculateLocales(req: localizationLocaleCalculationServiceApi.RecalculateLocalesRequest): Promise<localizationLocaleCalculationServiceApi.RecalculateLocalesResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "RecalculateLocales", req);
    this.logger.info("recalculate_locales", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (req?.details?.destination?.locality ?? "") },
      },
      translationKey: {
        locator: { $case: "address", address: { countryCode: (req?.details?.destination?.countryCode ?? "") } },
        owner: { email: (req?.locale?.owner?.email ?? "") },
      },
    });
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.recalculateTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.locality ?? ""),
        },
      },
      translationKey: {
        locator: { $case: "address", address: {
          region: ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.region ?? ""),
        } },
      },
    });
    const method2 = "calculateTranslationKey" as const;
    const invoke2: Unary<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleCalculationServiceApi.RecalculateLocalesResponse.fromPartial({
        locale: { audit: { createdAt: reply1?.translationKey?.audit?.createdAt } },
      }),
      localizationLocaleCalculationServiceApi.RecalculateLocalesResponse.fromPartial({
        breakdown: { currencyCode: (reply2?.breakdown?.currencyCode ?? "") },
        locale: {
          owner: { displayName: (reply2?.translationKey?.owner?.displayName ?? "") },
        },
      }),
      localizationLocaleCalculationServiceApi.RecalculateLocalesResponse.fromPartial({
        locale: {
          localeId: (req?.localeId ?? ""),
          version: (req?.locale?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Simulates a locale.
   */
  async simulateLocale(req: localizationLocaleCalculationServiceApi.SimulateLocaleRequest): Promise<localizationLocaleCalculationServiceApi.SimulateLocaleResponse> {
    validateContext(req.context);
    if (req.locale) {
      await this.repository.save(toLocaleRecord(req.context.tenantId, req.locale));
    }
    await this.repository.record(req.context.tenantId, "SimulateLocale", req);
    this.logger.info("simulate_locale", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest.fromPartial({
      context: req?.context,
      translationKey: { owner: { email: (req?.locale?.owner?.email ?? "") } },
    });
    const proxy1 = forwarding(this.localizationTranslationKeyCalculationClient);
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse> =
      (input, done) => proxy1.compareTranslationKeyOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest, localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationLocaleCalculationServiceApi.SimulateLocaleResponse.fromPartial({
        locale: { audit: { updatedAt: reply1?.translationKey?.audit?.updatedAt } },
      }),
      localizationLocaleCalculationServiceApi.SimulateLocaleResponse.fromPartial({
        locale: {
          effective: req?.locale?.effective,
          localeId: (req?.localeId ?? ""),
        },
      }),
    );
  }
}
