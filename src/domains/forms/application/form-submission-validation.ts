/**
 * Checks form submissions against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as chatChatBotCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityPostQueryServiceApi from "../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as formsFormCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormSubmissionCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_calculation_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as formsFormValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as surveysQuestionValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
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
  forwarding,
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
import { toFormSubmissionRecord } from "../data/records.js";
import { FormsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form submission operations and persist audit data.
 */
@injectable()
export class FormSubmissionValidationWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.PostQueryService") private readonly communityPostQueryClient: communityPostQueryServiceApi.PostQueryServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantQueryService") private readonly experimentsVariantQueryClient: experimentsVariantQueryServiceApi.VariantQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionCalculationService") private readonly formsFormSubmissionCalculationClient: formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionValidationService") private readonly surveysQuestionValidationClient: surveysQuestionValidationServiceApi.QuestionValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretCalculationService") private readonly webhooksWebhookSecretCalculationClient: webhooksWebhookSecretCalculationServiceApi.WebhookSecretCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a form submission.
   */
  async checkFormSubmissionEligibility(req: formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityRequest): Promise<formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "CheckFormSubmissionEligibility", req);
    this.logger.info("check_form_submission_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesRequest.fromPartial({
      context: req?.context,
      formSubmissionId: (req?.formSubmissionId ?? ""),
    });
    const invoke1: Unary<formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesRequest, formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesResponse> =
      (input, done) => this.formsFormSubmissionCalculationClient.getFormSubmissionRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = communityPostValidationServiceApi.NormalizePostRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
      post: {
        counterparty: { displayName: (reply1?.formSubmission?.subject?.displayName ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((reply1?.formSubmission?.attributes ?? {}))),
        }],
      },
    });
    const invoke2: Unary<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse> =
      (input, done) => this.communityPostValidationClient.normalizePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (reply2?.post?.billingAddress?.locality ?? "") },
      },
      formSubmission: {
        subject: {
          displayName: (reply1?.formSubmission?.subject?.displayName ?? ""),
          formFieldId: (req?.formSubmission?.subject?.formFieldId ?? ""),
        },
      },
    });
    const method3 = "recalculateFormSubmissions" as const;
    const invoke3: Unary<formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsRequest, formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsResponse> =
      (input, done) => this.formsFormSubmissionCalculationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsRequest, formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        result: { message: (reply2?.outcome?.message ?? "") },
      }),
      formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityResponse.fromPartial({
        formSubmission: {
          subject: { displayName: (reply3?.formSubmission?.subject?.displayName ?? "") },
        },
      }),
      formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          sequence: (req?.formSubmission?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Explains a form submission.
   */
  async explainFormSubmissionDecision(req: formsFormSubmissionValidationServiceApi.ExplainFormSubmissionDecisionRequest): Promise<formsFormSubmissionValidationServiceApi.ExplainFormSubmissionDecisionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "ExplainFormSubmissionDecision", req);
    this.logger.info("explain_form_submission_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse>> = [];
    for (const item of (req?.formSubmission?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest.fromPartial({
          context: req?.context,
          translationJob: {
            origin: { $case: "customer", customer: {
              displayName: (req?.formSubmission?.subject?.displayName ?? ""),
              email: (req?.details?.contact?.email ?? ""),
            } },
            history: [{ changedAt: item?.observedAt }],
            requester: { name: req?.details?.contact?.name },
          },
        });
        const invoke1: Unary<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse> =
          (input, done) => this.localizationTranslationJobCalculationClient.calculateTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<localizationTranslationJobCalculationServiceApi.CalculateTranslationJobRequest, localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? localizationTranslationJobCalculationServiceApi.CalculateTranslationJobResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return formsFormSubmissionValidationServiceApi.ExplainFormSubmissionDecisionResponse.fromPartial({
      formSubmission: {
        attributes: (req?.formSubmission?.attributes ?? {}),
        formSubmissionId: (req?.formSubmissionId ?? ""),
      },
    });
  }

  /**
   * Returns a form submission.
   */
  async getFormSubmissionRules(req: formsFormSubmissionValidationServiceApi.GetFormSubmissionRulesRequest): Promise<formsFormSubmissionValidationServiceApi.GetFormSubmissionRulesResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetFormSubmissionRules", req);
    this.logger.info("get_form_submission_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventValidationServiceApi.LintAuditEventsRequest.fromPartial({
      auditEvent: { source: (req?.formSubmissionId ?? "") },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const proxy1 = forwarding(this.auditAuditEventValidationClient);
    const invoke1: Unary<auditAuditEventValidationServiceApi.LintAuditEventsRequest, auditAuditEventValidationServiceApi.LintAuditEventsResponse> =
      (input, done) => proxy1.lintAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventValidationServiceApi.LintAuditEventsRequest, auditAuditEventValidationServiceApi.LintAuditEventsResponse>(invoke1, request1);
    const request2 = formsFormCalculationServiceApi.CompareFormOptionsRequest.fromPartial({
      context: req?.context,
      form: {
        counterparty: { displayName: (reply1?.auditEvent?.subject?.displayName ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((reply1?.auditEvent?.attributes ?? {}))),
        }],
        number: (reply1?.auditEvent?.subject?.number ?? ""),
      },
    });
    const invoke2: Unary<formsFormCalculationServiceApi.CompareFormOptionsRequest, formsFormCalculationServiceApi.CompareFormOptionsResponse> =
      (input, done) => this.formsFormCalculationClient.compareFormOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormCalculationServiceApi.CompareFormOptionsRequest, formsFormCalculationServiceApi.CompareFormOptionsResponse>(invoke2, request2);
    return mergeResponses(
      formsFormSubmissionValidationServiceApi.GetFormSubmissionRulesResponse.fromPartial({
        formSubmission: { occurredAt: reply1?.auditEvent?.occurredAt },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      formsFormSubmissionValidationServiceApi.GetFormSubmissionRulesResponse.fromPartial({
        formSubmission: {
          subject: { displayName: (reply2?.form?.counterparty?.displayName ?? "") },
        },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      formsFormSubmissionValidationServiceApi.GetFormSubmissionRulesResponse.fromPartial({ formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") } }),
    );
  }

  /**
   * Lints a form submission.
   */
  async lintFormSubmissions(req: formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest): Promise<formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "LintFormSubmissions", req);
    this.logger.info("lint_form_submissions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.formSubmission?.measurements ?? []).map(async (item) => {
      const request1 = formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest.fromPartial({
        context: req?.context,
        formSubmission: { measurements: [{ observedAt: item?.observedAt }] },
      });
      const invoke1: Unary<formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse> =
        (input, done) => this.formsFormSubmissionCalculationClient.estimateFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse.fromPartial({});
    const request2 = notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((reply1?.formSubmission?.attributes ?? {}))),
        ownerId: (req?.formSubmission?.correlationId ?? ""),
      },
    });
    const stream2 = this.notificationsNotificationTemplateExportClient.streamNotificationTemplateExport(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse.fromPartial({
      formSubmission: {
        attributes: (req?.formSubmission?.attributes ?? {}),
        formSubmissionId: (req?.formSubmissionId ?? ""),
      },
    });
  }

  /**
   * Normalizes a form submission.
   */
  async normalizeFormSubmission(req: formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionRequest): Promise<formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "NormalizeFormSubmission", req);
    this.logger.info("normalize_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest.fromPartial({
      context: req?.context,
      formSubmission: {
        occurredAt: req?.formSubmission?.occurredAt,
        subject: {
          displayName: (req?.formSubmission?.subject?.displayName ?? ""),
          version: (req?.formSubmission?.subject?.version ?? 0),
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionCalculationClient.quoteFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = communityForumValidationServiceApi.NormalizeForumRequest.fromPartial({
      context: input2?.context,
      forum: {
        children: [{
          children: [{ manager: { email: (input2?.details?.contact?.email ?? "") } }],
        }],
      },
    });
    const invoke2: Unary<communityForumValidationServiceApi.NormalizeForumRequest, communityForumValidationServiceApi.NormalizeForumResponse> =
      (input, done) => this.communityForumValidationClient.normalizeForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumValidationServiceApi.NormalizeForumRequest, communityForumValidationServiceApi.NormalizeForumResponse>(invoke2, request2);
    const request3 = formsFormValidationServiceApi.ExplainFormDecisionRequest.fromPartial({
      context: req?.context,
      form: { counterparty: { email: (reply2?.forum?.manager?.email ?? "") } },
    });
    const cloned3: formsFormValidationServiceApi.ExplainFormDecisionRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<formsFormValidationServiceApi.ExplainFormDecisionRequest, formsFormValidationServiceApi.ExplainFormDecisionResponse> =
      (input, done) => this.formsFormValidationClient.explainFormDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<formsFormValidationServiceApi.ExplainFormDecisionRequest, formsFormValidationServiceApi.ExplainFormDecisionResponse>(invoke3, cloned3);
    const request4 = webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
      webhookSecret: { audit: { updatedBy: (reply2?.forum?.audit?.updatedBy ?? "") } },
    });
    const decoded4 = webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.fromJSON(
      JSON.parse(JSON.stringify(webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest.toJSON(request4))),
    );
    const invoke4: Unary<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse> =
      (input, done) => this.webhooksWebhookSecretCalculationClient.explainWebhookSecretCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationRequest, webhooksWebhookSecretCalculationServiceApi.ExplainWebhookSecretCalculationResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse.fromPartial({
        formSubmission: { subject: { version: (reply1?.formSubmission?.subject?.version ?? 0) } },
      }),
      formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse.fromPartial({ outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) } }),
      formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse.fromPartial({
        outcome: {
          message: (reply3?.outcome?.message ?? ""),
          nextSteps: (reply3?.outcome?.nextSteps ?? []),
        },
      }),
      formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          kind: (req?.formSubmission?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a form submission.
   */
  async previewFormSubmission(req: formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest): Promise<formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "PreviewFormSubmission", req);
    this.logger.info("preview_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantQueryServiceApi.SummarizeVariantsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.SummarizeVariantsRequest",
      value: Buffer.from(experimentsVariantQueryServiceApi.SummarizeVariantsRequest.encode(request1).finish()),
    });
    const unpacked1 = experimentsVariantQueryServiceApi.SummarizeVariantsRequest.decode(envelope1.value);
    const invoke1: Unary<experimentsVariantQueryServiceApi.SummarizeVariantsRequest, experimentsVariantQueryServiceApi.SummarizeVariantsResponse> =
      (input, done) => this.experimentsVariantQueryClient.summarizeVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantQueryServiceApi.SummarizeVariantsRequest, experimentsVariantQueryServiceApi.SummarizeVariantsResponse>(invoke1, unpacked1);
    const request2 = formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsRequest.fromPartial({
      context: req?.context,
      formSubmission: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        source: (req?.formSubmission?.source ?? ""),
        subject: { version: (req?.formSubmission?.subject?.version ?? 0) },
      },
    });
    const client2 = this.clients.get<formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceClient>("acme.forms.v1.FormSubmissionCalculationService");
    const invoke2: Unary<formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsRequest, formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsResponse> =
      (input, done) => client2.compareFormSubmissionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsRequest, formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsResponse>(invoke2, request2);
    const settled3 = await Promise.allSettled((req?.formSubmission?.measurements ?? []).map(async (item) => {
      const request3 = chatChatBotCalculationServiceApi.SimulateChatBotRequest.fromPartial({
        chatBot: {
          audit: { updatedAt: item?.observedAt },
          action: { $case: "block", block: { reason: (req?.reason ?? "") } },
          owner: {
            displayName: (reply2?.formSubmission?.subject?.displayName ?? ""),
            email: (req?.details?.contact?.email ?? ""),
          },
        },
        context: req?.context,
      });
      const invoke3: Unary<chatChatBotCalculationServiceApi.SimulateChatBotRequest, chatChatBotCalculationServiceApi.SimulateChatBotResponse> =
        (input, done) => this.chatChatBotCalculationClient.simulateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<chatChatBotCalculationServiceApi.SimulateChatBotRequest, chatChatBotCalculationServiceApi.SimulateChatBotResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: chatChatBotCalculationServiceApi.SimulateChatBotResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? chatChatBotCalculationServiceApi.SimulateChatBotResponse.fromPartial({});
    const request4 = formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsRequest.fromPartial({
      context: req?.context,
      formSubmission: {
        source: (req?.formSubmission?.source ?? ""),
        subject: {
          displayName: (req?.formSubmission?.subject?.displayName ?? ""),
          version: (reply2?.formSubmission?.subject?.version ?? 0),
        },
      },
    });
    const invoke4: Unary<formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsRequest, formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsResponse> =
      (input, done) => this.formsFormSubmissionCalculationClient.recalculateFormSubmissions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsRequest, formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse.fromPartial({
        formSubmission: { kind: (reply2?.formSubmission?.kind ?? "") },
        result: { correlationId: (reply2?.formSubmission?.correlationId ?? "") },
      }),
      formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse.fromPartial({
        formSubmission: { attributes: (reply4?.formSubmission?.attributes ?? {}) },
      }),
      formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          sequence: (req?.formSubmission?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Scores a form submission.
   */
  async scoreFormSubmission(req: formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest): Promise<formsFormSubmissionValidationServiceApi.ScoreFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "ScoreFormSubmission", req);
    this.logger.info("score_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.QuoteFormRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          recipient: (req?.details?.destination?.recipient ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      },
      form: {
        billingAddress: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse> =
      (input, done) => this.formsFormCalculationClient.quoteForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse>(invoke1, request1));
    const tasks2: Array<() => Promise<communityPostQueryServiceApi.CountPostsResponse>> = [];
    for (const item of (req?.formSubmission?.measurements ?? [])) {
      tasks2.push(async () => {
        const request2 = communityPostQueryServiceApi.CountPostsRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: item?.observedAt,
            labels: Object.fromEntries(Object.entries((req?.formSubmission?.attributes ?? {}))),
            ownerId: (req?.formSubmission?.correlationId ?? ""),
            region: (reply1?.form?.billingAddress?.region ?? ""),
          },
        });
        const invoke2: Unary<communityPostQueryServiceApi.CountPostsRequest, communityPostQueryServiceApi.CountPostsResponse> =
          (input, done) => this.communityPostQueryClient.countPosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<communityPostQueryServiceApi.CountPostsRequest, communityPostQueryServiceApi.CountPostsResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? communityPostQueryServiceApi.CountPostsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionValidationServiceApi.ScoreFormSubmissionResponse.fromPartial({ breakdown: { total: reply1?.form?.total } }),
      formsFormSubmissionValidationServiceApi.ScoreFormSubmissionResponse.fromPartial({
        formSubmission: {
          correlationId: (req?.formSubmission?.correlationId ?? ""),
          formSubmissionId: (req?.formSubmissionId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a form submission.
   */
  async validateFormSubmission(req: formsFormSubmissionValidationServiceApi.ValidateFormSubmissionRequest): Promise<formsFormSubmissionValidationServiceApi.ValidateFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "ValidateFormSubmission", req);
    this.logger.info("validate_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysQuestionValidationServiceApi.ValidateQuestionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          phone: (req?.details?.contact?.phone ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
      question: { owner: { email: (req?.details?.contact?.email ?? "") } },
    });
    const invoke1: Unary<surveysQuestionValidationServiceApi.ValidateQuestionRequest, surveysQuestionValidationServiceApi.ValidateQuestionResponse> =
      (input, done) => this.surveysQuestionValidationClient.validateQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ValidateFormSubmission.ValidateQuestion", () => call<surveysQuestionValidationServiceApi.ValidateQuestionRequest, surveysQuestionValidationServiceApi.ValidateQuestionResponse>(invoke1, request1));
    const request2 = formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesRequest.fromPartial({
      context: req?.context,
      formSubmissionId: (req?.formSubmission?.formSubmissionId ?? ""),
    });
    const invoke2: Unary<formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesRequest, formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesResponse> =
      (input, done) => this.formsFormSubmissionCalculationClient.getFormSubmissionRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionValidationServiceApi.ValidateFormSubmissionResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      formsFormSubmissionValidationServiceApi.ValidateFormSubmissionResponse.fromPartial({
        formSubmission: { occurredAt: reply2?.formSubmission?.occurredAt },
        outcome: { message: (reply2?.result?.message ?? "") },
      }),
      formsFormSubmissionValidationServiceApi.ValidateFormSubmissionResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          kind: (req?.formSubmission?.kind ?? ""),
        },
      }),
    );
  }
}
