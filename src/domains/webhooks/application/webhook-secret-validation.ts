/**
 * Checks webhook secrets against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as admissionsAdmissionCalculationServiceApi from "../../../../.cache/proto/acme/admissions/v1/admission_calculation_service.js";
import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityModerationCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as webhooksWebhookSecretCalculationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_calculation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
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
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toWebhookSecretRecord } from "../data/records.js";
import { WebhooksRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook secret operations and persist audit data.
 */
@injectable()
export class WebhookSecretValidationWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.admissions.v1.AdmissionCalculationService") private readonly admissionsAdmissionCalculationClient: admissionsAdmissionCalculationServiceApi.AdmissionCalculationServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryValidationService") private readonly webhooksWebhookDeliveryValidationClient: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a webhook secret.
   */
  async checkWebhookSecretEligibility(req: webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest): Promise<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "CheckWebhookSecretEligibility", req);
    this.logger.info("check_webhook_secret_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.webhookSecret?.contact?.name } },
    });
    const invoke1: Unary<webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionRequest, webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.explainWebhookDeliveryDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionRequest, webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionResponse>(invoke1, request1);
    const results2 = await Promise.all((req?.webhookSecret?.limits ?? []).map(async (item) => {
      const request2 = communityForumServiceApi.CloneForumRequest.fromPartial({
        context: req?.context,
        forum: {
          children: [{
            children: [{
              audit: { createdAt: req?.webhookSecret?.audit?.createdAt },
              children: [{ name: (item?.name ?? "") }],
              manager: { displayName: (reply1?.webhookDelivery?.subject?.displayName ?? "") },
            }],
          }],
        },
      });
      const invoke2: Unary<communityForumServiceApi.CloneForumRequest, communityForumServiceApi.CloneForumResponse> =
        (input, done) => this.communityForumClient.cloneForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<communityForumServiceApi.CloneForumRequest, communityForumServiceApi.CloneForumResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? communityForumServiceApi.CloneForumResponse.fromPartial({});
    const request3 = communityPostCalculationServiceApi.EstimatePostRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (reply2?.forum?.location?.countryCode ?? "") },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse> =
      (input, done) => this.communityPostCalculationClient.estimatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          message: (reply3?.result?.message ?? ""),
        },
      }),
      webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse.fromPartial({
        webhookSecret: {
          holder: req?.webhookSecret?.holder,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a webhook secret.
   */
  async explainWebhookSecretDecision(req: webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionRequest): Promise<webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "ExplainWebhookSecretDecision", req);
    this.logger.info("explain_webhook_secret_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.webhookSecret?.limits ?? []).map(async (item) => {
      const request1 = webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest.fromPartial({
        context: req?.context,
        details: { budget: item?.amount },
        reason: (req?.reason ?? ""),
        webhookDelivery: {
          subject: {
            code: (req?.webhookSecret?.holder?.code ?? ""),
            displayName: (req?.webhookSecret?.holder?.displayName ?? ""),
          },
        },
      });
      const invoke1: Unary<webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse> =
        (input, done) => this.webhooksWebhookDeliveryValidationClient.scoreWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse.fromPartial({});
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest.fromPartial({
      context: input2?.context,
      webhookDelivery: { subject: { code: (input2?.webhookSecret?.holder?.code ?? "") } },
    });
    const invoke2: Unary<webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest, webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.lintWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest, webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      webhooksWebhookSecretValidationServiceApi.ExplainWebhookSecretDecisionResponse.fromPartial({
        webhookSecret: {
          contact: req?.webhookSecret?.contact,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a webhook secret.
   */
  async getWebhookSecretRules(req: webhooksWebhookSecretValidationServiceApi.GetWebhookSecretRulesRequest): Promise<webhooksWebhookSecretValidationServiceApi.GetWebhookSecretRulesResponse> {
    validateContext(req.context);
    if (!req.webhookSecretId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_secret_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetWebhookSecretRules", req);
    this.logger.info("get_webhook_secret_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      webhookDelivery: { source: (req?.webhookSecretId ?? "") },
    });
    const cloned1: webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.scoreWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ScoreWebhookDeliveryResponse>(invoke1, cloned1);
    const request2 = communityModerationCalculationServiceApi.QuoteModerationRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: { displayName: (reply1?.webhookDelivery?.subject?.displayName ?? "") },
      },
    });
    const decoded2 = communityModerationCalculationServiceApi.QuoteModerationRequest.fromJSON(
      JSON.parse(JSON.stringify(communityModerationCalculationServiceApi.QuoteModerationRequest.toJSON(request2))),
    );
    const invoke2: Unary<communityModerationCalculationServiceApi.QuoteModerationRequest, communityModerationCalculationServiceApi.QuoteModerationResponse> =
      (input, done) => this.communityModerationCalculationClient.quoteModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationCalculationServiceApi.QuoteModerationRequest, communityModerationCalculationServiceApi.QuoteModerationResponse>(invoke2, decoded2);
    return mergeResponses(
      webhooksWebhookSecretValidationServiceApi.GetWebhookSecretRulesResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      webhooksWebhookSecretValidationServiceApi.GetWebhookSecretRulesResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      webhooksWebhookSecretValidationServiceApi.GetWebhookSecretRulesResponse.fromPartial({ webhookSecret: { webhookSecretId: (req?.webhookSecretId ?? "") } }),
    );
  }

  /**
   * Lints a webhook secret.
   */
  async lintWebhookSecrets(req: webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsRequest): Promise<webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "LintWebhookSecrets", req);
    this.logger.info("lint_webhook_secrets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse>> = [];
    for (const item of (req?.webhookSecret?.limits ?? [])) {
      tasks1.push(async () => {
        const request1 = personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest.fromPartial({
          context: req?.context,
          recommendation: {
            audit: { createdAt: req?.webhookSecret?.audit?.createdAt },
            settlement: { $case: "bank", bank: {
              bic: ((req?.webhookSecret?.funding?.$case === "bank" ? req?.webhookSecret?.funding.bank : undefined)?.bic ?? ""),
            } },
            counterparty: { displayName: (req?.webhookSecret?.holder?.displayName ?? "") },
            lines: [{ tax: { amount: item?.amount } }],
          },
        });
        const invoke1: Unary<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse> =
          (input, done) => this.personalizationRecommendationCalculationClient.explainRecommendationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return webhooksWebhookSecretValidationServiceApi.LintWebhookSecretsResponse.fromPartial({
      webhookSecret: {
        currencyCode: (req?.webhookSecret?.currencyCode ?? ""),
        webhookSecretId: (req?.webhookSecretId ?? ""),
      },
    });
  }

  /**
   * Normalizes a webhook secret.
   */
  async normalizeWebhookSecret(req: webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretRequest): Promise<webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "NormalizeWebhookSecret", req);
    this.logger.info("normalize_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest.fromPartial({
      context: req?.context,
      webhookEndpointId: (req?.webhookSecret?.holder?.webhookEndpointId ?? ""),
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.GetWebhookEndpointRulesRequest",
      value: Buffer.from(webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest.encode(request1).finish()),
    });
    const unpacked1 = webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest.decode(envelope1.value);
    const invoke1: Unary<webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest, webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.getWebhookEndpointRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest, webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretResponse.fromPartial({
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
        webhookSecret: {
          holder: { webhookEndpointId: (reply1?.webhookEndpoint?.webhookEndpointId ?? "") },
        },
      }),
      webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretResponse.fromPartial({
        webhookSecret: {
          currencyCode: (req?.webhookSecret?.currencyCode ?? ""),
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a webhook secret.
   */
  async previewWebhookSecret(req: webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretRequest): Promise<webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "PreviewWebhookSecret", req);
    this.logger.info("preview_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_3: string | undefined;
    switch (req?.webhookSecret?.funding?.$case) {
      case "card":
        selected1_3 = ((req?.webhookSecret?.funding?.$case === "card" ? req?.webhookSecret?.funding.card : undefined)?.last4 ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        audit: { updatedBy: (req?.webhookSecret?.audit?.updatedBy ?? "") },
        funding: { $case: "card", card: { last4: (selected1_3 ?? "") } },
        holder: { displayName: (req?.webhookSecret?.holder?.displayName ?? "") },
      },
    });
    const invoke1: Unary<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.simulateWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretRequest, webhooksWebhookSecretCalculationServiceApi.SimulateWebhookSecretResponse>(invoke1, request1);
    const request2 = admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest.fromPartial({
      admission: {
        subject: { displayName: (req?.webhookSecret?.holder?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
    });
    const invoke2: Unary<admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest, admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationResponse> =
      (input, done) => this.admissionsAdmissionCalculationClient.explainAdmissionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest, admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretResponse.fromPartial({
        webhookSecret: {
          audit: {
            createdAt: reply1?.webhookSecret?.audit?.createdAt,
            createdBy: (reply1?.webhookSecret?.audit?.createdBy ?? ""),
          },
        },
      }),
      webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        webhookSecret: {
          holder: { displayName: (reply2?.admission?.subject?.displayName ?? "") },
        },
      }),
      webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretResponse.fromPartial({
        webhookSecret: {
          contact: req?.webhookSecret?.contact,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a webhook secret.
   */
  async scoreWebhookSecret(req: webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretRequest): Promise<webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "ScoreWebhookSecret", req);
    this.logger.info("score_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.webhookSecret?.contact?.email ?? ""),
          name: req?.webhookSecret?.contact?.name,
        },
      },
      webhookDelivery: {
        subject: {
          code: (req?.webhookSecret?.holder?.code ?? ""),
          displayName: (req?.webhookSecret?.holder?.displayName ?? ""),
        },
      },
    });
    const invoke1: Unary<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.validateWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretResponse.fromPartial({
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
        webhookSecret: {
          holder: {
            webhookEndpointId: (reply1?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
          },
        },
      }),
      webhooksWebhookSecretValidationServiceApi.ScoreWebhookSecretResponse.fromPartial({
        webhookSecret: {
          currencyCode: (req?.webhookSecret?.currencyCode ?? ""),
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a webhook secret.
   */
  async validateWebhookSecret(req: webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretRequest): Promise<webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "ValidateWebhookSecret", req);
    this.logger.info("validate_webhook_secret", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.details?.contact?.email ?? "") },
        locale: (req?.details?.locale ?? ""),
        rules: (req?.details?.rules ?? []).map((value) => value),
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.validateDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ValidateWebhookSecret.ValidateDeliveryAttempt", () => call<notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptResponse>(invoke1, request1));
    const request2 = webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
      webhookDelivery: {
        subject: {
          webhookEndpointId: (req?.webhookSecret?.holder?.webhookEndpointId ?? ""),
        },
      },
    });
    const invoke2: Unary<webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.previewWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.webhookSecret?.labels ?? {}))),
        ownerId: (reply1?.deliveryAttempt?.subject?.notificationTemplateId ?? ""),
      },
    });
    const reply3 = await this.workQueue.enqueue<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse>(
      "acme.webhooks.v1.WebhookSecretValidationService/ValidateWebhookSecret:2", request3,
    );
    const request4 = webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
      webhookDelivery: {
        subject: {
          code: (req?.webhookSecret?.holder?.code ?? ""),
          displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? ""),
        },
      },
    });
    const invoke4: Unary<webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionRequest, webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.explainWebhookDeliveryDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await inRequest(req.context!, () => call<webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionRequest, webhooksWebhookDeliveryValidationServiceApi.ExplainWebhookDeliveryDecisionResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse.fromPartial({
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
        webhookSecret: {
          holder: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
        },
      }),
      webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse.fromPartial({ result: { status: (reply4?.result?.status ?? "") } }),
      webhooksWebhookSecretValidationServiceApi.ValidateWebhookSecretResponse.fromPartial({
        webhookSecret: {
          contact: req?.details?.contact,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }
}
