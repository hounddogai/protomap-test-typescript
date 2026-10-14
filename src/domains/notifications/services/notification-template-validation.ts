/**
 * Checks notification templates against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as notificationsNotificationTemplateSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toNotificationTemplateRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification template operations and persist audit data.
 */
@injectable()
export class NotificationTemplateValidationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a notification template.
   */
  async checkNotificationTemplateEligibility(req: notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityRequest): Promise<notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "CheckNotificationTemplateEligibility", req);
    this.logger.info("check_notification_template_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.notificationTemplate?.settlement?.$case) {
      case "bank":
        selected1_2 = ((req?.notificationTemplate?.settlement?.$case === "bank" ? req?.notificationTemplate?.settlement.bank : undefined)?.iban ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = notificationsNotificationTemplateSyncServiceApi.ResolveNotificationTemplateConflictRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: { updatedAt: req?.notificationTemplate?.audit?.updatedAt },
        settlement: { $case: "bank", bank: { iban: (selected1_2 ?? "") } },
        counterparty: {
          notificationId: (req?.notificationTemplate?.counterparty?.notificationId ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateSyncServiceApi.ResolveNotificationTemplateConflictRequest, notificationsNotificationTemplateSyncServiceApi.ResolveNotificationTemplateConflictResponse> =
      (input, done) => this.notificationsNotificationTemplateSyncClient.resolveNotificationTemplateConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateSyncServiceApi.ResolveNotificationTemplateConflictRequest, notificationsNotificationTemplateSyncServiceApi.ResolveNotificationTemplateConflictResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityResponse.fromPartial({
        notificationTemplate: {
          billingAddress: {
            lines: (reply1?.notificationTemplate?.billingAddress?.lines ?? []),
            recipient: (reply1?.notificationTemplate?.billingAddress?.recipient ?? ""),
          },
        },
      }),
      notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityResponse.fromPartial({
        notificationTemplate: {
          notificationTemplateId: (req?.notificationTemplateId ?? ""),
          status: req?.notificationTemplate?.status,
        },
      }),
    );
  }

  /**
   * Explains a notification template.
   */
  async explainNotificationTemplateDecision(req: notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionRequest): Promise<notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "ExplainNotificationTemplateDecision", req);
    this.logger.info("explain_notification_template_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionResponse.fromPartial({
      notificationTemplate: {
        metadata: (req?.notificationTemplate?.metadata ?? {}),
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Returns a notification template.
   */
  async getNotificationTemplateRules(req: notificationsNotificationTemplateValidationServiceApi.GetNotificationTemplateRulesRequest): Promise<notificationsNotificationTemplateValidationServiceApi.GetNotificationTemplateRulesResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotificationTemplateRules", req);
    this.logger.info("get_notification_template_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationTemplateValidationServiceApi.GetNotificationTemplateRulesResponse.fromPartial({
      notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
    });
  }

  /**
   * Lints a notification template.
   */
  async lintNotificationTemplates(req: notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest): Promise<notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "LintNotificationTemplates", req);
    this.logger.info("lint_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse.fromPartial({
      notificationTemplate: {
        notes: (req?.notificationTemplate?.notes ?? ""),
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Previews a notification template.
   */
  async previewNotificationTemplate(req: notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateRequest): Promise<notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "PreviewNotificationTemplate", req);
    this.logger.info("preview_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateResponse.fromPartial({
      notificationTemplate: {
        billingAddress: req?.notificationTemplate?.billingAddress,
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Scores a notification template.
   */
  async scoreNotificationTemplate(req: notificationsNotificationTemplateValidationServiceApi.ScoreNotificationTemplateRequest): Promise<notificationsNotificationTemplateValidationServiceApi.ScoreNotificationTemplateResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "ScoreNotificationTemplate", req);
    this.logger.info("score_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateValidationServiceApi.ScoreNotificationTemplateResponse.fromPartial({
      notificationTemplate: {
        billingAddress: req?.notificationTemplate?.billingAddress,
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Validates a notification template.
   */
  async validateNotificationTemplate(req: notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest): Promise<notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "ValidateNotificationTemplate", req);
    this.logger.info("validate_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.notificationTemplate?.lines ?? []).map(async (item) => {
      const request1 = notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesRequest.fromPartial({
        context: req?.context,
        notificationTemplate: {
          lines: [{
            quantity: (item?.quantity ?? 0),
            tax: {
              amount: item?.amount,
              jurisdiction: (item?.tax?.jurisdiction ?? ""),
            },
          }],
        },
      });
      const invoke1: Unary<notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesResponse> =
        (input, done) => this.notificationsNotificationTemplateSyncClient.pullNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse.fromPartial({
      notificationTemplate: {
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
        number: (req?.notificationTemplate?.number ?? ""),
      },
    });
  }
}

/**
 * The gRPC boundary for NotificationTemplateValidationService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationTemplateValidationHandler {
  constructor(@inject(NotificationTemplateValidationWorkflow) private readonly workflow: NotificationTemplateValidationWorkflow) {}

  /**
   * Checks a notification template.
   */
  checkNotificationTemplateEligibility = unary<notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityRequest, notificationsNotificationTemplateValidationServiceApi.CheckNotificationTemplateEligibilityResponse>(
    (request) => this.workflow.checkNotificationTemplateEligibility(request),
  );

  /**
   * Explains a notification template.
   */
  explainNotificationTemplateDecision = unary<notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionRequest, notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionResponse>(
    (request) => this.workflow.explainNotificationTemplateDecision(request),
  );

  /**
   * Returns a notification template.
   */
  getNotificationTemplateRules = (call: ServerUnaryCall<notificationsNotificationTemplateValidationServiceApi.GetNotificationTemplateRulesRequest, notificationsNotificationTemplateValidationServiceApi.GetNotificationTemplateRulesResponse>, done: sendUnaryData<notificationsNotificationTemplateValidationServiceApi.GetNotificationTemplateRulesResponse>): void => {
    void this.workflow.getNotificationTemplateRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints a notification template.
   */
  lintNotificationTemplates = unary<notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest, notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse>(
    (request) => this.workflow.lintNotificationTemplates(request),
  );

  /**
   * Previews a notification template.
   */
  previewNotificationTemplate = unary<notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateResponse>(
    (request) => this.workflow.previewNotificationTemplate(request),
  );

  /**
   * Scores a notification template.
   */
  scoreNotificationTemplate = (call: ServerUnaryCall<notificationsNotificationTemplateValidationServiceApi.ScoreNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.ScoreNotificationTemplateResponse>, done: sendUnaryData<notificationsNotificationTemplateValidationServiceApi.ScoreNotificationTemplateResponse>): void => {
    void this.workflow.scoreNotificationTemplate(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a notification template.
   */
  validateNotificationTemplate = unary<notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse>(
    (request) => this.workflow.validateNotificationTemplate(request),
  );
}

export function implementation(handler: NotificationTemplateValidationHandler): notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceServer {
  return {
    checkNotificationTemplateEligibility: handler.checkNotificationTemplateEligibility,
    explainNotificationTemplateDecision: handler.explainNotificationTemplateDecision,
    getNotificationTemplateRules: handler.getNotificationTemplateRules,
    lintNotificationTemplates: handler.lintNotificationTemplates,
    previewNotificationTemplate: handler.previewNotificationTemplate,
    scoreNotificationTemplate: handler.scoreNotificationTemplate,
    validateNotificationTemplate: handler.validateNotificationTemplate,
  };
}
