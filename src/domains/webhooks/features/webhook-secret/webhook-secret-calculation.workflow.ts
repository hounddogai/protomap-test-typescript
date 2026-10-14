/**
 * Computes the figures of a webhook secret, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as broadcastsBroadcastServiceApi from "../../../../../.cache/proto/acme/broadcasts/v1/broadcast_service.js";
import * as configurationConfigSetCalculationServiceApi from "../../../../../.cache/proto/acme/configuration/v1/config_set_calculation_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as personalizationProfileServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as ticketingTicketQueryServiceApi from "../../../../../.cache/proto/acme/ticketing/v1/ticket_query_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
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
  workflow,
} from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toWebhookSecretRecord } from "../../data/records.js";
import { WebhooksRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook secret operations and persist audit data.
 */
@injectable()
export class WebhookSecretCalculationWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.broadcasts.v1.BroadcastService") private readonly broadcastsBroadcastClient: broadcastsBroadcastServiceApi.BroadcastServiceClient,
    @inject("grpc:acme.configuration.v1.ConfigSetCalculationService") private readonly configurationConfigSetCalculationClient: configurationConfigSetCalculationServiceApi.ConfigSetCalculationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.localization.v1.LocaleCalculationService") private readonly localizationLocaleCalculationClient: localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyQueryService") private readonly localizationTranslationKeyQueryClient: localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileService") private readonly personalizationProfileClient: personalizationProfileServiceApi.ProfileServiceClient,
    @inject("grpc:acme.ticketing.v1.TicketQueryService") private readonly ticketingTicketQueryClient: ticketingTicketQueryServiceApi.TicketQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a webhook secret.
   */
  async calculateWebhookSecret(req: webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest): Promise<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "CalculateWebhookSecret", req);
    this.logger.info("calculate_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointResponse>> = [];
    for (const item of (req?.webhookSecret?.limits ?? [])) {
      tasks1.push(async () => {
        const request1 = webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointRequest.fromPartial({
          context: req?.context,
          webhookEndpoint: { name: (item?.name ?? "") },
        });
        const invoke1: Unary<webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointResponse> =
          (input, done) => this.webhooksWebhookEndpointValidationClient.scoreWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? webhooksWebhookEndpointValidationServiceApi.ScoreWebhookEndpointResponse.fromPartial({});
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = localizationLocaleCalculationServiceApi.CalculateLocaleRequest.fromPartial({
      context: input2?.context,
      details: {
        destination: { postalCode: (input2?.details?.destination?.postalCode ?? "") },
      },
    });
    const invoke2: Unary<localizationLocaleCalculationServiceApi.CalculateLocaleRequest, localizationLocaleCalculationServiceApi.CalculateLocaleResponse> =
      (input, done) => this.localizationLocaleCalculationClient.calculateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleCalculationServiceApi.CalculateLocaleRequest, localizationLocaleCalculationServiceApi.CalculateLocaleResponse>(invoke2, request2);
    const request3 = ledgerLedgerAccountServiceApi.WatchLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((reply1?.webhookEndpoint?.locator?.$case === "address" ? reply1?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
      },
      subscriber: { email: (req?.webhookSecret?.contact?.email ?? "") },
    });
    const stream3 = this.ledgerLedgerAccountClient.watchLedgerAccounts(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? ledgerLedgerAccountServiceApi.WatchLedgerAccountsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse.fromPartial({
        webhookSecret: {
          audit: { createdBy: (reply2?.locale?.audit?.createdBy ?? "") },
          currencyCode: (reply2?.breakdown?.currencyCode ?? ""),
        },
      }),
      webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse.fromPartial({
        webhookSecret: {
          available: req?.webhookSecret?.available,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a webhook secret.
   */
  async estimateWebhookSecret(req: webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest): Promise<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "EstimateWebhookSecret", req);
    this.logger.info("estimate_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = broadcastsBroadcastServiceApi.CreateBroadcastRequest.fromPartial({
      broadcast: {
        location: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
        organizer: { email: (req?.webhookSecret?.contact?.email ?? "") },
        participants: [{ contact: { phone: (req?.webhookSecret?.contact?.phone ?? "") } }],
      },
      context: req?.context,
    });
    const cloned1: broadcastsBroadcastServiceApi.CreateBroadcastRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<broadcastsBroadcastServiceApi.CreateBroadcastRequest, broadcastsBroadcastServiceApi.CreateBroadcastResponse> =
      (input, done) => this.broadcastsBroadcastClient.createBroadcast(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<broadcastsBroadcastServiceApi.CreateBroadcastRequest, broadcastsBroadcastServiceApi.CreateBroadcastResponse>(invoke1, cloned1);
    const request2 = webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        locator: { $case: "address", address: { postalCode: (req?.details?.destination?.postalCode ?? "") } },
        audit: { createdBy: (req?.webhookSecret?.audit?.createdBy ?? "") },
      },
    });
    const decoded2 = webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityRequest.fromJSON(
      JSON.parse(JSON.stringify(webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityRequest.toJSON(request2))),
    );
    const invoke2: Unary<webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityRequest, webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.checkWebhookEndpointEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityRequest, webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse.fromPartial({
        webhookSecret: { audit: { createdBy: (reply1?.broadcast?.audit?.createdBy ?? "") } },
      }),
      webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse.fromPartial({
        webhookSecret: {
          audit: { createdBy: (reply2?.webhookEndpoint?.audit?.createdBy ?? "") },
          holder: { code: (reply2?.webhookEndpoint?.code ?? "") },
        },
      }),
      webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse.fromPartial({
        webhookSecret: {
          balance: req?.webhookSecret?.balance,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a webhook secret.
   */
  async explainWebhookSecretCalculation(req: webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest): Promise<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "ExplainWebhookSecretCalculation", req);
    this.logger.info("explain_webhook_secret_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.ValidateWebhookEndpointRequest",
      value: Buffer.from(webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest.encode(request1).finish()),
    });
    const unpacked1 = webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest.decode(envelope1.value);
    const invoke1: Unary<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.validateWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse>(invoke1, unpacked1);
    let selected2_1: string | undefined;
    switch (reply1?.webhookEndpoint?.locator?.$case) {
      case "address":
        selected2_1 = ((reply1?.webhookEndpoint?.locator?.$case === "address" ? reply1?.webhookEndpoint?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = ticketingTicketQueryServiceApi.FindTicketsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookSecret?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.webhookSecret?.labels ?? {}))),
        region: (selected2_1 ?? ""),
      },
    });
    const invoke2: Unary<ticketingTicketQueryServiceApi.FindTicketsRequest, ticketingTicketQueryServiceApi.FindTicketsResponse> =
      (input, done) => this.ticketingTicketQueryClient.findTickets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ticketingTicketQueryServiceApi.FindTicketsRequest, ticketingTicketQueryServiceApi.FindTicketsResponse>(invoke2, request2);
    const request3 = localizationTranslationKeyQueryServiceApi.SuggestTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookSecret?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.webhookSecret?.labels ?? {}))),
        ownerId: (req?.webhookSecret?.webhookSecretId ?? ""),
        region: ((reply1?.webhookEndpoint?.locator?.$case === "address" ? reply1?.webhookEndpoint?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke3: Unary<localizationTranslationKeyQueryServiceApi.SuggestTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.SuggestTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyQueryClient.suggestTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<localizationTranslationKeyQueryServiceApi.SuggestTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.SuggestTranslationKeysResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    const request4 = webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        locator: { $case: "address", address: {
          locality: ((reply1?.webhookEndpoint?.locator?.$case === "address" ? reply1?.webhookEndpoint?.locator.address : undefined)?.locality ?? ""),
        } },
        audit: {
          createdBy: (reply1?.webhookEndpoint?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.webhookEndpoint?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke4: Unary<webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityRequest, webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.checkWebhookEndpointEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityRequest, webhooksWebhookEndpointValidationServiceApi.CheckWebhookEndpointEligibilityResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse.fromPartial({ result: { status: (reply4?.outcome?.status ?? "") } }),
      webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse.fromPartial({
        webhookSecret: {
          openedAt: req?.webhookSecret?.openedAt,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a webhook secret.
   */
  async getWebhookSecretRates(req: webhooksWebhookSecretCalculationServiceApi.GetWebhookSecretRatesRequest): Promise<webhooksWebhookSecretCalculationServiceApi.GetWebhookSecretRatesResponse> {
    validateContext(req.context);
    if (!req.webhookSecretId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_secret_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetWebhookSecretRates", req);
    this.logger.info("get_webhook_secret_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      featureFlag: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest, featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.checkFeatureFlagEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("GetWebhookSecretRates.CheckFeatureFlagEligibility", () => call<featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest, featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityResponse>(invoke1, request1));
    const request2 = webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        audit: {
          createdBy: (reply1?.featureFlag?.audit?.createdBy ?? ""),
          updatedAt: reply1?.featureFlag?.audit?.updatedAt,
          updatedBy: (reply1?.featureFlag?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke2: Unary<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.validateWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    return mergeResponses(
      webhooksWebhookSecretCalculationServiceApi.GetWebhookSecretRatesResponse.fromPartial({
        result: { status: (reply1?.result?.status ?? "") },
        webhookSecret: { audit: { createdAt: reply1?.featureFlag?.audit?.createdAt } },
      }),
      webhooksWebhookSecretCalculationServiceApi.GetWebhookSecretRatesResponse.fromPartial({
        webhookSecret: { audit: { etag: (reply2?.webhookEndpoint?.audit?.etag ?? "") } },
      }),
      webhooksWebhookSecretCalculationServiceApi.GetWebhookSecretRatesResponse.fromPartial({ webhookSecret: { webhookSecretId: (req?.webhookSecretId ?? "") } }),
    );
  }

  /**
   * Quotes a webhook secret.
   */
  async quoteWebhookSecret(req: webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretRequest): Promise<webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "QuoteWebhookSecret", req);
    this.logger.info("quote_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest.fromPartial({
      configSet: {
        children: [{
          children: [{ audit: { createdBy: (req?.webhookSecret?.audit?.createdBy ?? "") } }],
          location: { locality: (req?.details?.destination?.locality ?? "") },
        }],
      },
      context: req?.context,
    });
    const reply1 = await this.workQueue.enqueue<configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationRequest, configurationConfigSetCalculationServiceApi.ExplainConfigSetCalculationResponse>(
      "acme.webhooks.v1.WebhookSecretCalculationService/QuoteWebhookSecret:0", request1,
    );
    const request2 = personalizationProfileServiceApi.CreateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        audit: { createdBy: (req?.webhookSecret?.audit?.createdBy ?? "") },
        contact: { email: (reply1?.configSet?.manager?.email ?? "") },
      },
    });
    const invoke2: Unary<personalizationProfileServiceApi.CreateProfileRequest, personalizationProfileServiceApi.CreateProfileResponse> =
      (input, done) => this.personalizationProfileClient.createProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<personalizationProfileServiceApi.CreateProfileRequest, personalizationProfileServiceApi.CreateProfileResponse>(invoke2, request2));
    const request3 = webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: reply2?.profile?.contact?.name,
          phone: (reply2?.profile?.contact?.phone ?? ""),
        },
      },
      webhookEndpoint: {
        locator: { $case: "address", address: { recipient: (reply2?.profile?.primaryAddress?.recipient ?? "") } },
        audit: { etag: (req?.webhookSecret?.audit?.etag ?? "") },
      },
    });
    const invoke3: Unary<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.normalizeWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse.fromPartial({
        result: { message: (reply1?.result?.message ?? "") },
        webhookSecret: { audit: { createdBy: (reply1?.configSet?.audit?.createdBy ?? "") } },
      }),
      webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse.fromPartial({
        webhookSecret: {
          contact: {
            email: (reply2?.profile?.relationshipManager?.email ?? ""),
            phone: (reply2?.profile?.contact?.phone ?? ""),
          },
        },
      }),
      webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse.fromPartial({
        webhookSecret: {
          status: req?.webhookSecret?.status,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a webhook secret.
   */
  async recalculateWebhookSecrets(req: webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest): Promise<webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "RecalculateWebhookSecrets", req);
    this.logger.info("recalculate_webhook_secrets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        audit: { updatedAt: req?.webhookSecret?.audit?.updatedAt },
        owner: { displayName: (req?.webhookSecret?.holder?.displayName ?? "") },
      },
    });
    const invoke1: Unary<webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsRequest, webhooksWebhookEndpointValidationServiceApi.LintWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.lintWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_3: string | undefined;
    switch (reply1?.webhookEndpoint?.locator?.$case) {
      case "address":
        selected2_3 = ((reply1?.webhookEndpoint?.locator?.$case === "address" ? reply1?.webhookEndpoint?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        locator: { $case: "address", address: {
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          recipient: (selected2_3 ?? ""),
        } },
        audit: { createdBy: (req?.webhookSecret?.audit?.createdBy ?? "") },
      },
    });
    const invoke2: Unary<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.validateWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.ValidateWebhookEndpointResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse.fromPartial({
        webhookSecret: { audit: { updatedAt: reply1?.webhookEndpoint?.audit?.updatedAt } },
      }),
      webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse.fromPartial({
        webhookSecret: {
          labels: (req?.webhookSecret?.labels ?? {}),
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a webhook secret.
   */
  async simulateWebhookSecret(req: webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest): Promise<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "SimulateWebhookSecret", req);
    this.logger.info("simulate_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
        },
      },
    });
    const method1 = "calculateSubscription" as const;
    const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse>(invoke1, request1);
    const request2 = webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        locator: { $case: "address", address: { recipient: (req?.details?.destination?.recipient ?? "") } },
        audit: {
          createdAt: reply1?.subscription?.audit?.createdAt,
          updatedBy: (req?.webhookSecret?.audit?.updatedBy ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.webhooksWebhookEndpointValidationClient);
    const invoke2: Unary<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse> =
      (input, done) => proxy2.normalizeWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse.fromPartial({
        webhookSecret: { audit: { updatedBy: (reply1?.subscription?.audit?.updatedBy ?? "") } },
      }),
      webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse.fromPartial({
        webhookSecret: {
          labels: (req?.webhookSecret?.labels ?? {}),
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }
}
