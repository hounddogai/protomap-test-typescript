/**
 * Checks webhook deliveries against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as careplansCarePlanServiceApi from "../../../../.cache/proto/acme/careplans/v1/care_plan_service.js";
import * as communityModerationValidationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as documentsDocumentServiceApi from "../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
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
import { toWebhookDeliveryRecord } from "../data/records.js";
import { WebhooksRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook delivery operations and persist audit data.
 */
@injectable()
export class WebhookDeliveryValidationWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.careplans.v1.CarePlanService") private readonly careplansCarePlanClient: careplansCarePlanServiceApi.CarePlanServiceClient,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a webhook delivery.
   */
  async checkWebhookDeliveryEligibility(req: webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest): Promise<webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "CheckWebhookDeliveryEligibility", req);
    this.logger.info("check_webhook_delivery_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleValidationServiceApi.LintLocalesRequest.fromPartial({
      context: req?.context,
      locale: { owner: { email: (req?.details?.contact?.email ?? "") } },
    });
    const decoded1 = localizationLocaleValidationServiceApi.LintLocalesRequest.fromJSON(
      JSON.parse(JSON.stringify(localizationLocaleValidationServiceApi.LintLocalesRequest.toJSON(request1))),
    );
    const invoke1: Unary<localizationLocaleValidationServiceApi.LintLocalesRequest, localizationLocaleValidationServiceApi.LintLocalesResponse> =
      (input, done) => this.localizationLocaleValidationClient.lintLocales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleValidationServiceApi.LintLocalesRequest, localizationLocaleValidationServiceApi.LintLocalesResponse>(invoke1, decoded1);
    const request2 = webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        holder: { displayName: (req?.webhookDelivery?.subject?.displayName ?? "") },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.QuoteWebhookSecretRequest",
      value: Buffer.from(webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretRequest.encode(request2).finish()),
    });
    const unpacked2 = webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretRequest.decode(envelope2.value);
    const invoke2: Unary<webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.quoteWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.QuoteWebhookSecretResponse>(invoke2, unpacked2);
    const request3 = webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest.fromPartial({
      context: req?.context,
      webhookEndpointId: (req?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
    });
    const client3 = this.clients.get<webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient>("acme.webhooks.v1.WebhookEndpointValidationService");
    const invoke3: Unary<webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest, webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse> =
      (input, done) => client3.getWebhookEndpointRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest, webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse.fromPartial({
        webhookDelivery: {
          subject: {
            code: (reply2?.webhookSecret?.holder?.code ?? ""),
            webhookEndpointId: (reply2?.webhookSecret?.holder?.webhookEndpointId ?? ""),
          },
        },
      }),
      webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse.fromPartial({
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
        webhookDelivery: {
          subject: { webhookEndpointId: (reply3?.webhookEndpoint?.webhookEndpointId ?? "") },
        },
      }),
      webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse.fromPartial({
        webhookDelivery: {
          source: (req?.webhookDelivery?.source ?? ""),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a webhook delivery.
   */
  async explainWebhookDeliveryDecision(req: webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionRequest): Promise<webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "ExplainWebhookDeliveryDecision", req);
    this.logger.info("explain_webhook_delivery_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationValidationServiceApi.ExplainModerationDecisionRequest.fromPartial({
      context: req?.context,
      moderation: {
        requester: {
          email: (req?.details?.contact?.email ?? ""),
          name: req?.details?.contact?.name,
        },
      },
    });
    const invoke1: Unary<communityModerationValidationServiceApi.ExplainModerationDecisionRequest, communityModerationValidationServiceApi.ExplainModerationDecisionResponse> =
      (input, done) => this.communityModerationValidationClient.explainModerationDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<communityModerationValidationServiceApi.ExplainModerationDecisionRequest, communityModerationValidationServiceApi.ExplainModerationDecisionResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        audit: {
          updatedAt: reply1?.moderation?.audit?.updatedAt,
          updatedBy: (reply1?.moderation?.audit?.updatedBy ?? ""),
        },
        contact: {
          name: reply1?.moderation?.requester?.name,
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.estimateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionResponse.fromPartial({
        result: { correlationId: (req?.webhookDelivery?.correlationId ?? "") },
        webhookDelivery: { webhookDeliveryId: (req?.webhookDeliveryId ?? "") },
      }),
    );
  }

  /**
   * Returns a webhook delivery.
   */
  async getWebhookDeliveryRules(req: webhooksWebhookDeliveryValidationServiceApi.GetWebhookDeliveryRulesRequest): Promise<webhooksWebhookDeliveryValidationServiceApi.GetWebhookDeliveryRulesResponse> {
    validateContext(req.context);
    if (!req.webhookDeliveryId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_delivery_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetWebhookDeliveryRules", req);
    this.logger.info("get_webhook_delivery_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.estimateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("GetWebhookDeliveryRules.EstimateWebhookSecret", () => call<webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.EstimateWebhookSecretResponse>(invoke1, request1));
    const request2 = experimentsExposureCalculationServiceApi.RecalculateExposuresRequest.fromPartial({
      context: req?.context,
      details: { currencyCode: (reply1?.breakdown?.currencyCode ?? "") },
      exposure: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: {
          displayName: (reply1?.webhookSecret?.holder?.displayName ?? ""),
          startsAt: reply1?.webhookSecret?.audit?.updatedAt,
        },
      },
    });
    const invoke2: Unary<experimentsExposureCalculationServiceApi.RecalculateExposuresRequest, experimentsExposureCalculationServiceApi.RecalculateExposuresResponse> =
      (input, done) => this.experimentsExposureCalculationClient.recalculateExposures(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    return mergeResponses(
      webhooksWebhookDeliveryValidationServiceApi.GetWebhookDeliveryRulesResponse.fromPartial({
        webhookDelivery: {
          subject: {
            code: (reply1?.webhookSecret?.holder?.code ?? ""),
            webhookEndpointId: (reply1?.webhookSecret?.holder?.webhookEndpointId ?? ""),
          },
        },
      }),
      webhooksWebhookDeliveryValidationServiceApi.GetWebhookDeliveryRulesResponse.fromPartial({ webhookDelivery: { attributes: (reply2?.exposure?.attributes ?? {}) } }),
      webhooksWebhookDeliveryValidationServiceApi.GetWebhookDeliveryRulesResponse.fromPartial({
        webhookDelivery: { webhookDeliveryId: (req?.webhookDeliveryId ?? "") },
      }),
    );
  }

  /**
   * Lints a webhook delivery.
   */
  async lintWebhookDeliveries(req: webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest): Promise<webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "LintWebhookDeliveries", req);
    this.logger.info("lint_webhook_deliveries", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        contact: {
          name: req?.details?.contact?.name,
          phone: (req?.details?.contact?.phone ?? ""),
        },
        holder: { code: (req?.webhookDelivery?.subject?.code ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>(
      "acme.webhooks.v1.WebhookDeliveryValidationService/LintWebhookDeliveries:0", request1,
    );
    let selected2_2: string | undefined;
    switch (reply1?.webhookSecret?.funding?.$case) {
      case "bank":
        selected2_2 = ((reply1?.webhookSecret?.funding?.$case === "bank" ? reply1?.webhookSecret?.funding.bank : undefined)?.bic ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (reply1?.webhookSecret?.contact?.preferredChannel ?? ""),
        },
      },
      webhookSecret: { funding: { $case: "bank", bank: { bic: (selected2_2 ?? "") } } },
    });
    const invoke2: Unary<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.explainWebhookSecretCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse.fromPartial({
        webhookDelivery: {
          subject: {
            webhookEndpointId: (reply1?.webhookSecret?.holder?.webhookEndpointId ?? ""),
          },
        },
      }),
      webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse.fromPartial({
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
        webhookDelivery: {
          subject: {
            webhookEndpointId: (reply2?.webhookSecret?.holder?.webhookEndpointId ?? ""),
          },
        },
      }),
      webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse.fromPartial({
        webhookDelivery: {
          correlationId: (req?.webhookDelivery?.correlationId ?? ""),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a webhook delivery.
   */
  async previewWebhookDelivery(req: webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest): Promise<webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "PreviewWebhookDelivery", req);
    this.logger.info("preview_webhook_delivery", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.webhookDelivery?.measurements ?? []).map(async (item) => {
      const request1 = webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest.fromPartial({
        context: req?.context,
        webhookSecret: { audit: { updatedAt: item?.observedAt } },
      });
      const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse> =
        (input, done) => this.webhooksWebhookSecretCalculationClient.calculateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? webhooksWebhookSecretCalculationServiceApi.CalculateWebhookSecretResponse.fromPartial({});
    const request2 = documentsDocumentServiceApi.BatchGetDocumentsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<documentsDocumentServiceApi.BatchGetDocumentsRequest, documentsDocumentServiceApi.BatchGetDocumentsResponse> =
      (input, done) => this.documentsDocumentClient.batchGetDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<documentsDocumentServiceApi.BatchGetDocumentsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryResponse.fromPartial({
        webhookDelivery: {
          attributes: (req?.webhookDelivery?.attributes ?? {}),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a webhook delivery.
   */
  async scoreWebhookDelivery(req: webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest): Promise<webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "ScoreWebhookDelivery", req);
    this.logger.info("score_webhook_delivery", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = careplansCarePlanServiceApi.BatchGetCarePlansRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<careplansCarePlanServiceApi.BatchGetCarePlansRequest, careplansCarePlanServiceApi.BatchGetCarePlansResponse> =
      (input, done) => this.careplansCarePlanClient.batchGetCarePlans(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        webhookDelivery: { webhookDeliveryId: (req?.webhookDeliveryId ?? "") },
      }),
    );
  }

  /**
   * Validates a webhook delivery.
   */
  async validateWebhookDelivery(req: webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest): Promise<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "ValidateWebhookDelivery", req);
    this.logger.info("validate_webhook_delivery", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleValidationServiceApi.NormalizeLocaleRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      locale: {
        owner: { displayName: (req?.webhookDelivery?.subject?.displayName ?? "") },
      },
    });
    const invoke1: Unary<localizationLocaleValidationServiceApi.NormalizeLocaleRequest, localizationLocaleValidationServiceApi.NormalizeLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient.normalizeLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        audit: { etag: (reply1?.locale?.audit?.etag ?? "") },
        contact: { email: (reply1?.locale?.owner?.email ?? "") },
        holder: { code: (req?.webhookDelivery?.subject?.code ?? "") },
        limits: [{
          amount: (reply1?.locale?.action?.$case === "discount" ? reply1?.locale?.action.discount : undefined)?.amount,
        }],
      },
    });
    const method2 = "recalculateWebhookSecrets" as const;
    const invoke2: Unary<webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest, webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsRequest, webhooksWebhookSecretCalculationServiceApi.RecalculateWebhookSecretsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse.fromPartial({
        webhookDelivery: {
          occurredAt: req?.webhookDelivery?.occurredAt,
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }
}
