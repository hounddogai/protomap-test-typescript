/**
 * Computes the figures of a notification template, such as totals, taxes, and estimates. Remote work stays behind
 * typed client ports.
 */

import * as metricsMetricSeriesQueryServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toNotificationTemplateRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification template operations and persist audit data.
 */
@injectable()
export class NotificationTemplateCalculationWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a notification template.
   */
  async calculateNotificationTemplate(req: notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateRequest): Promise<notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "CalculateNotificationTemplate", req);
    this.logger.info("calculate_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateResponse.fromPartial({
      notificationTemplate: {
        counterparty: req?.notificationTemplate?.counterparty,
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Compares a notification template.
   */
  async compareNotificationTemplateOptions(req: notificationsNotificationTemplateCalculationServiceApi.CompareNotificationTemplateOptionsRequest): Promise<notificationsNotificationTemplateCalculationServiceApi.CompareNotificationTemplateOptionsResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "CompareNotificationTemplateOptions", req);
    this.logger.info("compare_notification_template_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateCalculationServiceApi.CompareNotificationTemplateOptionsResponse.fromPartial({
      notificationTemplate: {
        notes: (req?.notificationTemplate?.notes ?? ""),
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Estimates a notification template.
   */
  async estimateNotificationTemplate(req: notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest): Promise<notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "EstimateNotificationTemplate", req);
    this.logger.info("estimate_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateResponse.fromPartial({
      notificationTemplate: {
        issuedAt: req?.notificationTemplate?.issuedAt,
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Explains a notification template.
   */
  async explainNotificationTemplateCalculation(req: notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest): Promise<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "ExplainNotificationTemplateCalculation", req);
    this.logger.info("explain_notification_template_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.GetNotificationRatesRequest.fromPartial({
      context: req?.context,
      notificationId: (req?.notificationTemplate?.counterparty?.notificationId ?? ""),
    });
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.GetNotificationRatesRequest, notificationsNotificationCalculationServiceApi.GetNotificationRatesResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.getNotificationRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse.fromPartial({
        notificationTemplate: {
          notificationTemplateId: (req?.notificationTemplateId ?? ""),
          number: (req?.notificationTemplate?.number ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a notification template.
   */
  async getNotificationTemplateRates(req: notificationsNotificationTemplateCalculationServiceApi.GetNotificationTemplateRatesRequest): Promise<notificationsNotificationTemplateCalculationServiceApi.GetNotificationTemplateRatesResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetNotificationTemplateRates", req);
    this.logger.info("get_notification_template_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.context?.actor?.userId ?? "") } },
      subscription: { owner: { email: (req?.context?.actor?.email ?? "") } },
    });
    const method1 = "commentSubscriptionApproval" as const;
    const invoke1: Unary<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse> =
      (input, done) => this.notificationsSubscriptionApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse>(invoke1, request1);
    return mergeResponses(
      notificationsNotificationTemplateCalculationServiceApi.GetNotificationTemplateRatesResponse.fromPartial({
        notificationTemplate: {
          audit: { createdAt: reply1?.subscription?.audit?.createdAt },
          counterparty: { displayName: (reply1?.subscription?.owner?.displayName ?? "") },
        },
      }),
      notificationsNotificationTemplateCalculationServiceApi.GetNotificationTemplateRatesResponse.fromPartial({
        notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
      }),
    );
  }

  /**
   * Recalculates a notification template.
   */
  async recalculateNotificationTemplates(req: notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest): Promise<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "RecalculateNotificationTemplates", req);
    this.logger.info("recalculate_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse.fromPartial({
      notificationTemplate: {
        counterparty: req?.notificationTemplate?.counterparty,
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Simulates a notification template.
   */
  async simulateNotificationTemplate(req: notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateRequest): Promise<notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "SimulateNotificationTemplate", req);
    this.logger.info("simulate_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.notificationTemplate?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.notificationTemplate?.metadata ?? {}))),
        ownerId: (req?.notificationTemplate?.counterparty?.notificationId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const proxy1 = forwarding(this.metricsMetricSeriesQueryClient);
    const invoke1: Unary<metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesResponse> =
      (input, done) => proxy1.suggestMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateResponse.fromPartial({
        notificationTemplate: {
          billingAddress: req?.notificationTemplate?.billingAddress,
          notificationTemplateId: (req?.notificationTemplateId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for NotificationTemplateCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationTemplateCalculationHandler {
  constructor(@inject(NotificationTemplateCalculationWorkflow) private readonly workflow: NotificationTemplateCalculationWorkflow) {}

  /**
   * Calculates a notification template.
   */
  calculateNotificationTemplate = unary<notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateResponse>(
    (request) => this.workflow.calculateNotificationTemplate(request),
  );

  /**
   * Compares a notification template.
   */
  compareNotificationTemplateOptions = unary<notificationsNotificationTemplateCalculationServiceApi.CompareNotificationTemplateOptionsRequest, notificationsNotificationTemplateCalculationServiceApi.CompareNotificationTemplateOptionsResponse>(
    (request) => this.workflow.compareNotificationTemplateOptions(request),
  );

  /**
   * Estimates a notification template.
   */
  estimateNotificationTemplate = (call: ServerUnaryCall<notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateResponse>, done: sendUnaryData<notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateResponse>): void => {
    void this.workflow.estimateNotificationTemplate(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a notification template.
   */
  explainNotificationTemplateCalculation = unary<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest, notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse>(
    (request) => this.workflow.explainNotificationTemplateCalculation(request),
  );

  /**
   * Returns a notification template.
   */
  getNotificationTemplateRates = unary<notificationsNotificationTemplateCalculationServiceApi.GetNotificationTemplateRatesRequest, notificationsNotificationTemplateCalculationServiceApi.GetNotificationTemplateRatesResponse>(
    (request) => this.workflow.getNotificationTemplateRates(request),
  );

  /**
   * Recalculates a notification template.
   */
  recalculateNotificationTemplates = (call: ServerUnaryCall<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse>, done: sendUnaryData<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse>): void => {
    void this.workflow.recalculateNotificationTemplates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a notification template.
   */
  simulateNotificationTemplate = unary<notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateResponse>(
    (request) => this.workflow.simulateNotificationTemplate(request),
  );
}

export function implementation(handler: NotificationTemplateCalculationHandler): notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceServer {
  return {
    calculateNotificationTemplate: handler.calculateNotificationTemplate,
    compareNotificationTemplateOptions: handler.compareNotificationTemplateOptions,
    estimateNotificationTemplate: handler.estimateNotificationTemplate,
    explainNotificationTemplateCalculation: handler.explainNotificationTemplateCalculation,
    getNotificationTemplateRates: handler.getNotificationTemplateRates,
    recalculateNotificationTemplates: handler.recalculateNotificationTemplates,
    simulateNotificationTemplate: handler.simulateNotificationTemplate,
  };
}
