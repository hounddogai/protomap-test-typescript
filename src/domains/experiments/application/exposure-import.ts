/**
 * Takes exposures in bulk from partners and legacy systems. Remote work stays behind typed client ports.
 */

import * as commonContactApi from "../../../../.cache/proto/acme/common/v1/contact.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsExposureImportServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as personalizationRecommendationApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_approval_service.js";
import * as routingRouteCalculationServiceApi from "../../../../.cache/proto/acme/routing/v1/route_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toExposureRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate exposure operations and persist audit data.
 */
@injectable()
export class ExposureImportWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantValidationService") private readonly experimentsVariantValidationClient: experimentsVariantValidationServiceApi.VariantValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationApprovalService") private readonly personalizationRecommendationApprovalClient: personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceClient,
    @inject("grpc:acme.routing.v1.RouteCalculationService") private readonly routingRouteCalculationClient: routingRouteCalculationServiceApi.RouteCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Cancels an exposure.
   */
  async cancelExposureImport(req: experimentsExposureImportServiceApi.CancelExposureImportRequest): Promise<experimentsExposureImportServiceApi.CancelExposureImportResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "CancelExposureImport", req);
    this.logger.info("cancel_exposure_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureCalculationServiceApi.CalculateExposureRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      exposure: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
    });
    const invoke1: Unary<experimentsExposureCalculationServiceApi.CalculateExposureRequest, experimentsExposureCalculationServiceApi.CalculateExposureResponse> =
      (input, done) => this.experimentsExposureCalculationClient.calculateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<experimentsExposureCalculationServiceApi.CalculateExposureRequest, experimentsExposureCalculationServiceApi.CalculateExposureResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureImportServiceApi.CancelExposureImportResponse.fromPartial({
        exposure: {
          source: (reply1?.exposure?.source ?? ""),
          subject: { startsAt: reply1?.exposure?.subject?.startsAt },
        },
      }),
      experimentsExposureImportServiceApi.CancelExposureImportResponse.fromPartial({
        exposure: { exposureId: (req?.exposureId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns an exposure.
   */
  async getExposureImportStatus(req: experimentsExposureImportServiceApi.GetExposureImportStatusRequest): Promise<experimentsExposureImportServiceApi.GetExposureImportStatusResponse> {
    validateContext(req.context);
    if (!req.exposureId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "exposure_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetExposureImportStatus", req);
    this.logger.info("get_exposure_import_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = routingRouteCalculationServiceApi.ExplainRouteCalculationRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      route: {
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        dueAt: req?.context?.deadline,
        metadata: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const invoke1: Unary<routingRouteCalculationServiceApi.ExplainRouteCalculationRequest, routingRouteCalculationServiceApi.ExplainRouteCalculationResponse> =
      (input, done) => this.routingRouteCalculationClient.explainRouteCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<routingRouteCalculationServiceApi.ExplainRouteCalculationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest.fromPartial({
      context: req?.context,
      exposure: {
        subject: { displayName: (reply1?.route?.counterparty?.displayName ?? "") },
      },
    });
    const invoke2: Unary<experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest, experimentsExposureValidationServiceApi.CheckExposureEligibilityResponse> =
      (input, done) => this.experimentsExposureValidationClient.checkExposureEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    return mergeResponses(
      experimentsExposureImportServiceApi.GetExposureImportStatusResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      experimentsExposureImportServiceApi.GetExposureImportStatusResponse.fromPartial({
        exposure: {
          subject: { displayName: (reply2?.exposure?.subject?.displayName ?? "") },
        },
      }),
      experimentsExposureImportServiceApi.GetExposureImportStatusResponse.fromPartial({ exposure: { exposureId: (req?.exposureId ?? "") } }),
    );
  }

  /**
   * Takes a stream of exposures and answers once at the end.
   */
  async importExposures(req: experimentsExposureImportServiceApi.ImportExposuresRequest): Promise<experimentsExposureImportServiceApi.ImportExposuresResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ImportExposures", req);
    this.logger.info("import_exposures", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected1_1 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? "");
        break;
      default:
        selected1_1 = "";
    }
    let selected1_2: commonContactApi.PersonName | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected1_2 = (req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.name;
        break;
      default:
        selected1_2 = undefined;
    }
    let selected1_3: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected1_3 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.preferredChannel ?? "");
        break;
      default:
        selected1_3 = "";
    }
    let selected1_4: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected1_4 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.phone ?? "");
        break;
      default:
        selected1_4 = "";
    }
    const request1 = experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{
          contact: {
            email: (selected1_1 ?? ""),
            name: selected1_2,
            phone: (selected1_4 ?? ""),
            preferredChannel: (selected1_3 ?? ""),
          },
        }],
      },
    });
    const invoke1: Unary<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse> =
      (input, done) => this.experimentsExperimentValidationClient.checkExperimentEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>(invoke1, request1);
    const results2 = await Promise.all(((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.measurements ?? []).map(async (item) => {
      const request2 = experimentsExposureCalculationServiceApi.QuoteExposureRequest.fromPartial({
        context: req?.context,
        exposure: {
          measurements: [{
            metric: (item?.metric ?? ""),
            observedAt: item?.observedAt,
            unit: (item?.unit ?? ""),
            value: (item?.value ?? 0),
          }],
        },
      });
      const invoke2: Unary<experimentsExposureCalculationServiceApi.QuoteExposureRequest, experimentsExposureCalculationServiceApi.QuoteExposureResponse> =
        (input, done) => this.experimentsExposureCalculationClient.quoteExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<experimentsExposureCalculationServiceApi.QuoteExposureRequest, experimentsExposureCalculationServiceApi.QuoteExposureResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? experimentsExposureCalculationServiceApi.QuoteExposureResponse.fromPartial({});
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.correlationId ?? "") });
    return experimentsExposureImportServiceApi.ImportExposuresResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } });
  }

  /**
   * Lists exposures a page at a time.
   */
  async listExposureImports(req: experimentsExposureImportServiceApi.ListExposureImportsRequest): Promise<experimentsExposureImportServiceApi.ListExposureImportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListExposureImports", req);
    this.logger.info("list_exposure_imports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureValidationServiceApi.ValidateExposureRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
    });
    const method1 = "validateExposure" as const;
    const invoke1: Unary<experimentsExposureValidationServiceApi.ValidateExposureRequest, experimentsExposureValidationServiceApi.ValidateExposureResponse> =
      (input, done) => this.experimentsExposureValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureValidationServiceApi.ValidateExposureRequest, experimentsExposureValidationServiceApi.ValidateExposureResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsExposureImportServiceApi.ListExposureImportsResponse.fromPartial({
      exposures: [{ attributes: (reply1?.exposure?.attributes ?? {}) }],
      result: { status: (reply1?.outcome?.status ?? "") },
    });
  }

  /**
   * Maps an exposure.
   */
  async mapExposureImportColumns(req: experimentsExposureImportServiceApi.MapExposureImportColumnsRequest): Promise<experimentsExposureImportServiceApi.MapExposureImportColumnsResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "MapExposureImportColumns", req);
    this.logger.info("map_exposure_import_columns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.NormalizeExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{ contact: { phone: (req?.details?.contact?.phone ?? "") } }],
      },
    });
    const proxy1 = forwarding(this.experimentsExperimentValidationClient);
    const invoke1: Unary<experimentsExperimentValidationServiceApi.NormalizeExperimentRequest, experimentsExperimentValidationServiceApi.NormalizeExperimentResponse> =
      (input, done) => proxy1.normalizeExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentValidationServiceApi.NormalizeExperimentRequest, experimentsExperimentValidationServiceApi.NormalizeExperimentResponse>(invoke1, request1);
    const request2 = experimentsVariantValidationServiceApi.ValidateVariantRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
    });
    const invoke2: Unary<experimentsVariantValidationServiceApi.ValidateVariantRequest, experimentsVariantValidationServiceApi.ValidateVariantResponse> =
      (input, done) => this.experimentsVariantValidationClient.validateVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantValidationServiceApi.ValidateVariantRequest, experimentsVariantValidationServiceApi.ValidateVariantResponse>(invoke2, request2);
    const request3 = ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: { audit: { updatedBy: (reply2?.variant?.audit?.updatedBy ?? "") } },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.scoreLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest.fromPartial({
      context: input4?.context,
      experiment: {
        participants: [{ contact: { name: reply3?.ledgerAccount?.contact?.name } }],
      },
    });
    const invoke4: Unary<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest, experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse> =
      (input, done) => this.experimentsExperimentValidationClient.explainExperimentDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest, experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureImportServiceApi.MapExposureImportColumnsResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      experimentsExposureImportServiceApi.MapExposureImportColumnsResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      experimentsExposureImportServiceApi.MapExposureImportColumnsResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      experimentsExposureImportServiceApi.MapExposureImportColumnsResponse.fromPartial({
        exposure: { correlationId: (reply4?.result?.correlationId ?? "") },
        outcome: { effectiveAt: reply4?.outcome?.effectiveAt },
      }),
      experimentsExposureImportServiceApi.MapExposureImportColumnsResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          subject: req?.exposure?.subject,
        },
      }),
    );
  }

  /**
   * Retrys an exposure.
   */
  async retryExposureImport(req: experimentsExposureImportServiceApi.RetryExposureImportRequest): Promise<experimentsExposureImportServiceApi.RetryExposureImportResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "RetryExposureImport", req);
    this.logger.info("retry_exposure_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.NormalizeExperimentRequest.fromPartial({
      context: req?.context,
      experiment: { participants: [{ contact: { name: req?.details?.notify?.name } }] },
    });
    const cloned1: experimentsExperimentValidationServiceApi.NormalizeExperimentRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<experimentsExperimentValidationServiceApi.NormalizeExperimentRequest, experimentsExperimentValidationServiceApi.NormalizeExperimentResponse> =
      (input, done) => this.experimentsExperimentValidationClient.normalizeExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentValidationServiceApi.NormalizeExperimentRequest, experimentsExperimentValidationServiceApi.NormalizeExperimentResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureImportServiceApi.RetryExposureImportResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      experimentsExposureImportServiceApi.RetryExposureImportResponse.fromPartial({
        exposure: {
          correlationId: (req?.exposure?.correlationId ?? ""),
          exposureId: (req?.exposureId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates an exposure.
   */
  async validateExposureImport(req: experimentsExposureImportServiceApi.ValidateExposureImportRequest): Promise<experimentsExposureImportServiceApi.ValidateExposureImportResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "ValidateExposureImport", req);
    this.logger.info("validate_exposure_import", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.QuoteExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{
          contact: {
            email: (req?.details?.contact?.email ?? ""),
            name: req?.details?.contact?.name,
            phone: (req?.details?.contact?.phone ?? ""),
          },
        }],
      },
    });
    const decoded1 = experimentsExperimentCalculationServiceApi.QuoteExperimentRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExperimentCalculationServiceApi.QuoteExperimentRequest.toJSON(request1))),
    );
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.QuoteExperimentRequest, experimentsExperimentCalculationServiceApi.QuoteExperimentResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.quoteExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentCalculationServiceApi.QuoteExperimentRequest, experimentsExperimentCalculationServiceApi.QuoteExperimentResponse>(invoke1, decoded1);
    const request2 = experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (reply1?.experiment?.organizer?.email ?? ""),
          name: req?.details?.contact?.name,
        },
      },
      exposure: {
        subject: { displayName: (reply1?.experiment?.organizer?.displayName ?? "") },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.experiments.v1.ExplainExposureDecisionRequest",
      value: Buffer.from(experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest.encode(request2).finish()),
    });
    const unpacked2 = experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest.decode(envelope2.value);
    const invoke2: Unary<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse> =
      (input, done) => this.experimentsExposureValidationClient.explainExposureDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse>(invoke2, unpacked2);
    const request3 = personalizationRecommendationApprovalServiceApi.EscalateRecommendationRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (reply1?.experiment?.organizer?.userId ?? "") } },
      recommendation: {
        billingAddress: {
          lines: (reply1?.experiment?.location?.lines ?? []).map((value) => value),
        },
      },
    });
    const client3 = this.clients.get<personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceClient>("acme.personalization.v1.RecommendationApprovalService");
    const invoke3: Unary<personalizationRecommendationApprovalServiceApi.EscalateRecommendationRequest, personalizationRecommendationApprovalServiceApi.EscalateRecommendationResponse> =
      (input, done) => client3.escalateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationRecommendationApprovalServiceApi.EscalateRecommendationRequest, personalizationRecommendationApprovalServiceApi.EscalateRecommendationResponse>(invoke3, request3);
    const request4 = notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        billingAddress: { region: (reply3?.recommendation?.billingAddress?.region ?? "") },
      },
    });
    const invoke4: Unary<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest, notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.explainNotificationTemplateCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest, notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureImportServiceApi.ValidateExposureImportResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      experimentsExposureImportServiceApi.ValidateExposureImportResponse.fromPartial({
        exposure: {
          kind: (reply2?.exposure?.kind ?? ""),
          subject: reply2?.exposure?.subject,
        },
      }),
      experimentsExposureImportServiceApi.ValidateExposureImportResponse.fromPartial({
        outcome: { message: (reply3?.outcome?.message ?? "") },
        result: { status: (reply3?.outcome?.status ?? "") },
      }),
      experimentsExposureImportServiceApi.ValidateExposureImportResponse.fromPartial({ result: { correlationId: (reply4?.result?.correlationId ?? "") } }),
      experimentsExposureImportServiceApi.ValidateExposureImportResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          sequence: (req?.exposure?.sequence ?? 0),
        },
      }),
    );
  }
}
