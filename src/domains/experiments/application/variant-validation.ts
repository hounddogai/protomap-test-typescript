/**
 * Checks variants against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as maintenanceWorkOrderCalculationServiceApi from "../../../../.cache/proto/acme/maintenance/v1/work_order_calculation_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as toursTourQueryServiceApi from "../../../../.cache/proto/acme/tours/v1/tour_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { requireReply } from "../../../platform/errors.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toVariantRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate variant operations and persist audit data.
 */
@injectable()
export class VariantValidationWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.maintenance.v1.WorkOrderCalculationService") private readonly maintenanceWorkOrderCalculationClient: maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.tours.v1.TourQueryService") private readonly toursTourQueryClient: toursTourQueryServiceApi.TourQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a variant.
   */
  async checkVariantEligibility(req: experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest): Promise<experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "CheckVariantEligibility", req);
    this.logger.info("check_variant_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantCalculationServiceApi.GetVariantRatesRequest.fromPartial({
      context: req?.context,
      variantId: (req?.variant?.variantId ?? ""),
    });
    const invoke1: Unary<experimentsVariantCalculationServiceApi.GetVariantRatesRequest, experimentsVariantCalculationServiceApi.GetVariantRatesResponse> =
      (input, done) => this.experimentsVariantCalculationClient.getVariantRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<experimentsVariantCalculationServiceApi.GetVariantRatesRequest, experimentsVariantCalculationServiceApi.GetVariantRatesResponse>(invoke1, request1));
    const request2 = experimentsExperimentValidationServiceApi.LintExperimentsRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
      experiment: {
        organizer: { displayName: (reply1?.variant?.owner?.displayName ?? "") },
        participants: [{
          contact: {
            email: (req?.variant?.owner?.email ?? ""),
            phone: (req?.details?.contact?.phone ?? ""),
          },
        }],
      },
    });
    const invoke2: Unary<experimentsExperimentValidationServiceApi.LintExperimentsRequest, experimentsExperimentValidationServiceApi.LintExperimentsResponse> =
      (input, done) => this.experimentsExperimentValidationClient.lintExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("CheckVariantEligibility.LintExperiments", () => call<experimentsExperimentValidationServiceApi.LintExperimentsRequest, experimentsExperimentValidationServiceApi.LintExperimentsResponse>(invoke2, request2));
    const request3 = notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        counterparty: { displayName: (reply2?.experiment?.organizer?.displayName ?? "") },
      },
    });
    const invoke3: Unary<notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.retryNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse.fromPartial({ variant: { owner: reply1?.variant?.owner } }),
      experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse.fromPartial({
        variant: {
          audit: { etag: (reply3?.notificationTemplate?.audit?.etag ?? "") },
          owner: {
            displayName: (reply3?.notificationTemplate?.counterparty?.displayName ?? ""),
          },
        },
      }),
      experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse.fromPartial({
        variant: {
          description: (req?.variant?.description ?? ""),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a variant.
   */
  async explainVariantDecision(req: experimentsVariantValidationServiceApi.ExplainVariantDecisionRequest): Promise<experimentsVariantValidationServiceApi.ExplainVariantDecisionResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "ExplainVariantDecision", req);
    this.logger.info("explain_variant_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = toursTourQueryServiceApi.CountToursRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.variant?.audit?.createdAt },
    });
    const reply1 = await this.workQueue.enqueue<toursTourQueryServiceApi.CountToursRequest, toursTourQueryServiceApi.CountToursResponse>(
      "acme.experiments.v1.VariantValidationService/ExplainVariantDecision:0", request1,
    );
    const request2 = maintenanceWorkOrderCalculationServiceApi.CalculateWorkOrderRequest.fromPartial({
      context: req?.context,
      workOrder: {
        audit: { updatedBy: (req?.variant?.audit?.updatedBy ?? "") },
        origin: { $case: "customer", customer: {
          displayName: (req?.variant?.owner?.displayName ?? ""),
          email: (req?.variant?.owner?.email ?? ""),
        } },
        requester: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const invoke2: Unary<maintenanceWorkOrderCalculationServiceApi.CalculateWorkOrderRequest, maintenanceWorkOrderCalculationServiceApi.CalculateWorkOrderResponse> =
      (input, done) => this.maintenanceWorkOrderCalculationClient.calculateWorkOrder(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<maintenanceWorkOrderCalculationServiceApi.CalculateWorkOrderRequest, maintenanceWorkOrderCalculationServiceApi.CalculateWorkOrderResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantValidationServiceApi.ExplainVariantDecisionResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      experimentsVariantValidationServiceApi.ExplainVariantDecisionResponse.fromPartial({
        variant: {
          audit: { updatedBy: (reply2?.workOrder?.audit?.updatedBy ?? "") },
          owner: { userId: (reply2?.workOrder?.assignee?.userId ?? "") },
        },
      }),
      experimentsVariantValidationServiceApi.ExplainVariantDecisionResponse.fromPartial({
        variant: {
          variantId: (req?.variantId ?? ""),
          version: (req?.variant?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Lints a variant.
   */
  async lintVariants(req: experimentsVariantValidationServiceApi.LintVariantsRequest): Promise<experimentsVariantValidationServiceApi.LintVariantsResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "LintVariants", req);
    this.logger.info("lint_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.ExplainPostDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      post: {
        audit: {
          createdAt: req?.variant?.audit?.createdAt,
          updatedAt: req?.variant?.audit?.updatedAt,
        },
        lines: [{
          tax: {
            amount: (req?.variant?.action?.$case === "discount" ? req?.variant?.action.discount : undefined)?.amount,
          },
        }],
      },
    });
    const invoke1: Unary<communityPostValidationServiceApi.ExplainPostDecisionRequest, communityPostValidationServiceApi.ExplainPostDecisionResponse> =
      (input, done) => this.communityPostValidationClient.explainPostDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<communityPostValidationServiceApi.ExplainPostDecisionResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = experimentsVariantCalculationServiceApi.CalculateVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        audit: { createdAt: req?.variant?.audit?.createdAt },
        action: { $case: "discount", discount: {
          amount: (req?.variant?.action?.$case === "discount" ? req?.variant?.action.discount : undefined)?.amount,
        } },
      },
    });
    const invoke2: Unary<experimentsVariantCalculationServiceApi.CalculateVariantRequest, experimentsVariantCalculationServiceApi.CalculateVariantResponse> =
      (input, done) => this.experimentsVariantCalculationClient.calculateVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantValidationServiceApi.LintVariantsResponse.fromPartial({
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      experimentsVariantValidationServiceApi.LintVariantsResponse.fromPartial({
        result: { details: (reply2?.result?.details ?? {}) },
        variant: { parameters: (reply2?.variant?.parameters ?? {}) },
      }),
      experimentsVariantValidationServiceApi.LintVariantsResponse.fromPartial({
        variant: {
          description: (req?.variant?.description ?? ""),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a variant.
   */
  async normalizeVariant(req: experimentsVariantValidationServiceApi.NormalizeVariantRequest): Promise<experimentsVariantValidationServiceApi.NormalizeVariantResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "NormalizeVariant", req);
    this.logger.info("normalize_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.variant?.action?.$case) {
      case "block":
        selected1_2 = ((req?.variant?.action?.$case === "block" ? req?.variant?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      exposure: { subject: { displayName: (req?.variant?.owner?.displayName ?? "") } },
      reason: (selected1_2 ?? ""),
    });
    const invoke1: Unary<experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest, experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse> =
      (input, done) => this.experimentsExposureCalculationClient.compareExposureOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest, experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse>(invoke1, request1);
    const request2 = experimentsVariantCalculationServiceApi.GetVariantRatesRequest.fromPartial({
      context: req?.context,
      variantId: (req?.variant?.variantId ?? ""),
    });
    const method2 = "getVariantRates" as const;
    const invoke2: Unary<experimentsVariantCalculationServiceApi.GetVariantRatesRequest, experimentsVariantCalculationServiceApi.GetVariantRatesResponse> =
      (input, done) => this.experimentsVariantCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantCalculationServiceApi.GetVariantRatesRequest, experimentsVariantCalculationServiceApi.GetVariantRatesResponse>(invoke2, request2);
    const request3 = experimentsExposureCalculationServiceApi.CalculateExposureRequest.fromPartial({
      context: req?.context,
      exposure: {
        correlationId: (reply2?.result?.correlationId ?? ""),
        subject: { startsAt: reply1?.exposure?.subject?.startsAt },
      },
    });
    const proxy3 = forwarding(this.experimentsExposureCalculationClient);
    const invoke3: Unary<experimentsExposureCalculationServiceApi.CalculateExposureRequest, experimentsExposureCalculationServiceApi.CalculateExposureResponse> =
      (input, done) => proxy3.calculateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureCalculationServiceApi.CalculateExposureRequest, experimentsExposureCalculationServiceApi.CalculateExposureResponse>(invoke3, request3);
    const request4 = experimentsExposureCalculationServiceApi.SimulateExposureRequest.fromPartial({
      context: req?.context,
      exposure: {
        correlationId: (reply2?.result?.correlationId ?? ""),
        subject: {
          displayName: (reply3?.exposure?.subject?.displayName ?? ""),
          experimentId: (reply3?.exposure?.subject?.experimentId ?? ""),
          startsAt: reply1?.exposure?.subject?.startsAt,
        },
      },
    });
    const invoke4: Unary<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse> =
      (input, done) => this.experimentsExposureCalculationClient.simulateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantValidationServiceApi.NormalizeVariantResponse.fromPartial({
        result: {
          correlationId: (reply1?.exposure?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      experimentsVariantValidationServiceApi.NormalizeVariantResponse.fromPartial({ variant: { status: reply2?.variant?.status } }),
      experimentsVariantValidationServiceApi.NormalizeVariantResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          message: (reply3?.result?.message ?? ""),
        },
      }),
      experimentsVariantValidationServiceApi.NormalizeVariantResponse.fromPartial({ outcome: { message: (reply4?.result?.message ?? "") } }),
      experimentsVariantValidationServiceApi.NormalizeVariantResponse.fromPartial({
        variant: {
          description: (req?.variant?.description ?? ""),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a variant.
   */
  async previewVariant(req: experimentsVariantValidationServiceApi.PreviewVariantRequest): Promise<experimentsVariantValidationServiceApi.PreviewVariantResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "PreviewVariant", req);
    this.logger.info("preview_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.variant?.audit?.updatedAt },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.listDeliveryAttemptConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest.fromPartial({
      context: input2?.context,
      details: {
        contact: {
          name: input2?.details?.contact?.name,
          preferredChannel: (input2?.details?.contact?.preferredChannel ?? ""),
        },
        strict: (input2?.details?.strict ?? false),
      },
    });
    const invoke2: Unary<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse> =
      (input, done) => this.experimentsExposureCalculationClient.explainExposureCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantValidationServiceApi.PreviewVariantResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      experimentsVariantValidationServiceApi.PreviewVariantResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      experimentsVariantValidationServiceApi.PreviewVariantResponse.fromPartial({
        variant: {
          variantId: (req?.variantId ?? ""),
          version: (req?.variant?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Scores a variant.
   */
  async scoreVariant(req: experimentsVariantValidationServiceApi.ScoreVariantRequest): Promise<experimentsVariantValidationServiceApi.ScoreVariantResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "ScoreVariant", req);
    this.logger.info("score_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.variant?.action?.$case) {
      case "block":
        selected1_1 = ((req?.variant?.action?.$case === "block" ? req?.variant?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.variant?.parameters ?? {}))),
        period: req?.variant?.effective,
      },
      reason: (selected1_1 ?? ""),
    });
    const invoke1: Unary<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.scheduleNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse>(invoke1, request1);
    const request2 = ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.variant?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const decoded2 = ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest.fromJSON(
      JSON.parse(JSON.stringify(ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest.toJSON(request2))),
    );
    const invoke2: Unary<ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountQueryClient.findLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsResponse>(invoke2, decoded2);
    const request3 = communityPostValidationServiceApi.PreviewPostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: {
          createdBy: (req?.variant?.audit?.createdBy ?? ""),
          updatedAt: req?.variant?.audit?.updatedAt,
          updatedBy: (req?.variant?.audit?.updatedBy ?? ""),
        },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.PreviewPostRequest",
      value: Buffer.from(communityPostValidationServiceApi.PreviewPostRequest.encode(request3).finish()),
    });
    const unpacked3 = communityPostValidationServiceApi.PreviewPostRequest.decode(envelope3.value);
    const invoke3: Unary<communityPostValidationServiceApi.PreviewPostRequest, communityPostValidationServiceApi.PreviewPostResponse> =
      (input, done) => this.communityPostValidationClient.previewPost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityPostValidationServiceApi.PreviewPostRequest, communityPostValidationServiceApi.PreviewPostResponse>(invoke3, unpacked3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantValidationServiceApi.ScoreVariantResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      experimentsVariantValidationServiceApi.ScoreVariantResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      experimentsVariantValidationServiceApi.ScoreVariantResponse.fromPartial({ breakdown: { total: reply3?.post?.total } }),
      experimentsVariantValidationServiceApi.ScoreVariantResponse.fromPartial({
        variant: {
          status: req?.variant?.status,
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a variant.
   */
  async validateVariant(req: experimentsVariantValidationServiceApi.ValidateVariantRequest): Promise<experimentsVariantValidationServiceApi.ValidateVariantResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "ValidateVariant", req);
    this.logger.info("validate_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.variant?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.variant?.parameters ?? {}))),
        ownerId: (req?.variant?.owner?.userId ?? ""),
      },
    });
    const client1 = this.clients.get<ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient>("acme.ledger.v1.LedgerAccountQueryService");
    const invoke1: Unary<ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsResponse> =
      (input, done) => client1.findLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.FindLedgerAccountsResponse>(invoke1, request1);
    const request2 = experimentsExperimentValidationServiceApi.LintExperimentsRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { updatedAt: req?.variant?.audit?.updatedAt },
        participants: [{ contact: { email: (req?.variant?.owner?.email ?? "") } }],
      },
    });
    const invoke2: Unary<experimentsExperimentValidationServiceApi.LintExperimentsRequest, experimentsExperimentValidationServiceApi.LintExperimentsResponse> =
      (input, done) => this.experimentsExperimentValidationClient.lintExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<experimentsExperimentValidationServiceApi.LintExperimentsRequest, experimentsExperimentValidationServiceApi.LintExperimentsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantValidationServiceApi.ValidateVariantResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      experimentsVariantValidationServiceApi.ValidateVariantResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      experimentsVariantValidationServiceApi.ValidateVariantResponse.fromPartial({
        variant: {
          variantId: (req?.variantId ?? ""),
          version: (req?.variant?.version ?? 0),
        },
      }),
    );
  }
}
