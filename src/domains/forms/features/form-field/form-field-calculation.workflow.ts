/**
 * Computes the figures of a form field, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as commonMoneyApi from "../../../../../.cache/proto/acme/common/v1/money.js";
import * as communityPostValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as formsFormCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormFieldCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import * as formsFormValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as telehealthVideoVisitServiceApi from "../../../../../.cache/proto/acme/telehealth/v1/video_visit_service.js";
import * as ticketingTicketServiceApi from "../../../../../.cache/proto/acme/ticketing/v1/ticket_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toFormFieldRecord } from "../../data/records.js";
import { FormsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form field operations and persist audit data.
 */
@injectable()
export class FormFieldCalculationWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.telehealth.v1.VideoVisitService") private readonly telehealthVideoVisitClient: telehealthVideoVisitServiceApi.VideoVisitServiceClient,
    @inject("grpc:acme.ticketing.v1.TicketService") private readonly ticketingTicketClient: ticketingTicketServiceApi.TicketServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a form field.
   */
  async calculateFormField(req: formsFormFieldCalculationServiceApi.CalculateFormFieldRequest): Promise<formsFormFieldCalculationServiceApi.CalculateFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "CalculateFormField", req);
    this.logger.info("calculate_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.LintPostsRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: { countryCode: (req?.details?.destination?.countryCode ?? "") },
        counterparty: { displayName: (req?.formField?.owner?.displayName ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<communityPostValidationServiceApi.LintPostsRequest, communityPostValidationServiceApi.LintPostsResponse>(
      "acme.forms.v1.FormFieldCalculationService/CalculateFormField:0", request1,
    );
    const request2 = webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        locator: { $case: "address", address: {
          countryCode: (reply1?.post?.billingAddress?.countryCode ?? ""),
          postalCode: (req?.details?.destination?.postalCode ?? ""),
        } },
      },
    });
    const invoke2: Unary<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.normalizeWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldCalculationServiceApi.CalculateFormFieldResponse.fromPartial({
        breakdown: { total: reply1?.post?.total },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      formsFormFieldCalculationServiceApi.CalculateFormFieldResponse.fromPartial({
        formField: { owner: { email: (reply2?.webhookEndpoint?.owner?.email ?? "") } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      formsFormFieldCalculationServiceApi.CalculateFormFieldResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          priority: (req?.formField?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Compares a form field.
   */
  async compareFormFieldOptions(req: formsFormFieldCalculationServiceApi.CompareFormFieldOptionsRequest): Promise<formsFormFieldCalculationServiceApi.CompareFormFieldOptionsResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "CompareFormFieldOptions", req);
    this.logger.info("compare_form_field_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.EstimateFormRequest.fromPartial({
      context: req?.context,
      form: {
        billingAddress: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          locality: (req?.details?.destination?.locality ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
        counterparty: { displayName: (req?.formField?.owner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse> =
      (input, done) => this.formsFormCalculationClient.estimateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<formsFormCalculationServiceApi.EstimateFormResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = formsFormCalculationServiceApi.QuoteFormRequest.fromPartial({
      context: req?.context,
      form: {
        audit: { updatedBy: (req?.formField?.audit?.updatedBy ?? "") },
        billingAddress: {
          locality: (req?.details?.destination?.locality ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const invoke2: Unary<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse> =
      (input, done) => this.formsFormCalculationClient.quoteForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldCalculationServiceApi.CompareFormFieldOptionsResponse.fromPartial({
        formField: {
          audit: {
            updatedAt: reply1?.form?.audit?.updatedAt,
            updatedBy: (reply1?.form?.audit?.updatedBy ?? ""),
          },
        },
      }),
      formsFormFieldCalculationServiceApi.CompareFormFieldOptionsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      formsFormFieldCalculationServiceApi.CompareFormFieldOptionsResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        formField: { formFieldId: (req?.formFieldId ?? "") },
      }),
    );
  }

  /**
   * Estimates a form field.
   */
  async estimateFormField(req: formsFormFieldCalculationServiceApi.EstimateFormFieldRequest): Promise<formsFormFieldCalculationServiceApi.EstimateFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "EstimateFormField", req);
    this.logger.info("estimate_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: commonMoneyApi.Money | undefined;
    switch (req?.formField?.action?.$case) {
      case "discount":
        selected1_1 = (req?.formField?.action?.$case === "discount" ? req?.formField?.action.discount : undefined)?.amount;
        break;
      default:
        selected1_1 = undefined;
    }
    const request1 = formsFormCalculationServiceApi.ExplainFormCalculationRequest.fromPartial({
      context: req?.context,
      form: {
        audit: {
          createdBy: (req?.formField?.audit?.createdBy ?? ""),
          updatedBy: (req?.formField?.audit?.updatedBy ?? ""),
        },
        counterparty: { displayName: (req?.formField?.owner?.displayName ?? "") },
        lines: [{ tax: { amount: selected1_1 } }],
      },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.ExplainFormCalculationRequest, formsFormCalculationServiceApi.ExplainFormCalculationResponse> =
      (input, done) => this.formsFormCalculationClient.explainFormCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormCalculationServiceApi.ExplainFormCalculationRequest, formsFormCalculationServiceApi.ExplainFormCalculationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldCalculationServiceApi.EstimateFormFieldResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      formsFormFieldCalculationServiceApi.EstimateFormFieldResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          parameters: (req?.formField?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Returns a form field.
   */
  async getFormFieldRates(req: formsFormFieldCalculationServiceApi.GetFormFieldRatesRequest): Promise<formsFormFieldCalculationServiceApi.GetFormFieldRatesResponse> {
    validateContext(req.context);
    if (!req.formFieldId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_field_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetFormFieldRates", req);
    this.logger.info("get_form_field_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormValidationServiceApi.ValidateFormRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      form: {
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        dueAt: req?.context?.deadline,
      },
    });
    const method1 = "validateForm" as const;
    const invoke1: Unary<formsFormValidationServiceApi.ValidateFormRequest, formsFormValidationServiceApi.ValidateFormResponse> =
      (input, done) => this.formsFormValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormValidationServiceApi.ValidateFormRequest, formsFormValidationServiceApi.ValidateFormResponse>(invoke1, request1);
    return mergeResponses(
      formsFormFieldCalculationServiceApi.GetFormFieldRatesResponse.fromPartial({
        formField: { audit: { updatedAt: reply1?.form?.audit?.updatedAt } },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      formsFormFieldCalculationServiceApi.GetFormFieldRatesResponse.fromPartial({ formField: { formFieldId: (req?.formFieldId ?? "") } }),
    );
  }

  /**
   * Quotes a form field.
   */
  async quoteFormField(req: formsFormFieldCalculationServiceApi.QuoteFormFieldRequest): Promise<formsFormFieldCalculationServiceApi.QuoteFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "QuoteFormField", req);
    this.logger.info("quote_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ticketingTicketServiceApi.ListTicketsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.formField?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.formField?.parameters ?? {}))),
        ownerId: (req?.formField?.owner?.userId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const proxy1 = forwarding(this.ticketingTicketClient);
    const invoke1: Unary<ticketingTicketServiceApi.ListTicketsRequest, ticketingTicketServiceApi.ListTicketsResponse> =
      (input, done) => proxy1.listTickets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ticketingTicketServiceApi.ListTicketsRequest, ticketingTicketServiceApi.ListTicketsResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (req?.formField?.action?.$case) {
      case "block":
        selected2_1 = ((req?.formField?.action?.$case === "block" ? req?.formField?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      reason: (selected2_1 ?? ""),
    });
    const invoke2: Unary<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.revertDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldCalculationServiceApi.QuoteFormFieldResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      formsFormFieldCalculationServiceApi.QuoteFormFieldResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      formsFormFieldCalculationServiceApi.QuoteFormFieldResponse.fromPartial({
        formField: {
          description: (req?.formField?.description ?? ""),
          formFieldId: (req?.formFieldId ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a form field.
   */
  async simulateFormField(req: formsFormFieldCalculationServiceApi.SimulateFormFieldRequest): Promise<formsFormFieldCalculationServiceApi.SimulateFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "SimulateFormField", req);
    this.logger.info("simulate_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = telehealthVideoVisitServiceApi.CreateVideoVisitRequest.fromPartial({
      context: req?.context,
      videoVisit: {
        location: { countryCode: (req?.details?.destination?.countryCode ?? "") },
        participants: [{ contact: { email: (req?.formField?.owner?.email ?? "") } }],
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<telehealthVideoVisitServiceApi.CreateVideoVisitRequest, telehealthVideoVisitServiceApi.CreateVideoVisitResponse> =
      (input, done) => this.telehealthVideoVisitClient.createVideoVisit(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<telehealthVideoVisitServiceApi.CreateVideoVisitRequest, telehealthVideoVisitServiceApi.CreateVideoVisitResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest.fromPartial({
      accessPolicy: {
        audit: { updatedBy: (reply1?.videoVisit?.audit?.updatedBy ?? "") },
        action: { $case: "block", block: {
          notifyEmail: ((input2?.formField?.action?.$case === "block" ? input2?.formField?.action.block : undefined)?.notifyEmail ?? ""),
          reason: ((input2?.formField?.action?.$case === "block" ? input2?.formField?.action.block : undefined)?.reason ?? ""),
        } },
      },
      context: input2?.context,
    });
    const invoke2: Unary<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.scoreAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse>(invoke2, request2);
    const request3 = telehealthVideoVisitServiceApi.BatchGetVideoVisitsRequest.fromPartial({ context: req?.context });
    const cloned3: telehealthVideoVisitServiceApi.BatchGetVideoVisitsRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<telehealthVideoVisitServiceApi.BatchGetVideoVisitsRequest, telehealthVideoVisitServiceApi.BatchGetVideoVisitsResponse> =
      (input, done) => this.telehealthVideoVisitClient.batchGetVideoVisits(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<telehealthVideoVisitServiceApi.BatchGetVideoVisitsRequest, telehealthVideoVisitServiceApi.BatchGetVideoVisitsResponse>(invoke3, cloned3);
    const request4 = experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.formField?.owner?.email ?? "") } },
      experiment: {
        location: { locality: (reply1?.videoVisit?.location?.locality ?? "") },
      },
    });
    const decoded4 = experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest.toJSON(request4))),
    );
    const invoke4: Unary<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest, experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse> =
      (input, done) => this.experimentsExperimentValidationClient.explainExperimentDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest, experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldCalculationServiceApi.SimulateFormFieldResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      formsFormFieldCalculationServiceApi.SimulateFormFieldResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      formsFormFieldCalculationServiceApi.SimulateFormFieldResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      formsFormFieldCalculationServiceApi.SimulateFormFieldResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      formsFormFieldCalculationServiceApi.SimulateFormFieldResponse.fromPartial({
        formField: {
          effective: req?.formField?.effective,
          formFieldId: (req?.formFieldId ?? ""),
        },
      }),
    );
  }
}
