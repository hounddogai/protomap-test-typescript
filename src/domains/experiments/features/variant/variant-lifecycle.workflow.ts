/**
 * Moves a variant between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as experimentsExperimentReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as experimentsExperimentServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsVariantLifecycleServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_lifecycle_service.js";
import * as experimentsVariantReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as personalizationAffinityWorkflowServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_workflow_service.js";
import * as prescriptionsPrescriptionQueryServiceApi from "../../../../../.cache/proto/acme/prescriptions/v1/prescription_query_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../../platform/rpc.js";
import { collect, write } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { ExperimentsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate variant operations and persist audit data.
 */
@injectable()
export class VariantLifecycleWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExperimentReportingService") private readonly experimentsExperimentReportingClient: experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantReportingService") private readonly experimentsVariantReportingClient: experimentsVariantReportingServiceApi.VariantReportingServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityWorkflowService") private readonly personalizationAffinityWorkflowClient: personalizationAffinityWorkflowServiceApi.AffinityWorkflowServiceClient,
    @inject("grpc:acme.prescriptions.v1.PrescriptionQueryService") private readonly prescriptionsPrescriptionQueryClient: prescriptionsPrescriptionQueryServiceApi.PrescriptionQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a variant.
   */
  async activateVariant(req: experimentsVariantLifecycleServiceApi.ActivateVariantRequest): Promise<experimentsVariantLifecycleServiceApi.ActivateVariantResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateVariant", req);
    this.logger.info("activate_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentReportingServiceApi.ScheduleExperimentReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const reply1 = await this.workQueue.enqueue<experimentsExperimentReportingServiceApi.ScheduleExperimentReportRequest, experimentsExperimentReportingServiceApi.ScheduleExperimentReportResponse>(
      "acme.experiments.v1.VariantLifecycleService/ActivateVariant:0", request1,
    );
    const request2 = experimentsExperimentReportingServiceApi.ShareExperimentReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.notifyContact?.email ?? ""),
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<experimentsExperimentReportingServiceApi.ShareExperimentReportRequest, experimentsExperimentReportingServiceApi.ShareExperimentReportResponse> =
      (input, done) => this.experimentsExperimentReportingClient.shareExperimentReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<experimentsExperimentReportingServiceApi.ShareExperimentReportRequest, experimentsExperimentReportingServiceApi.ShareExperimentReportResponse>(invoke2, request2));
    const request3 = experimentsVariantSyncServiceApi.StreamVariantChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "block", block: {
          notifyEmail: (req?.context?.actor?.email ?? ""),
          reason: (req?.reason ?? ""),
        } },
        variantId: (req?.variantId ?? ""),
      } },
      context: req?.context,
    });
    const stream3 = this.experimentsVariantSyncClient.streamVariantChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? experimentsVariantSyncServiceApi.StreamVariantChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.newOwner?.email ?? "") });
    return mergeResponses(
      experimentsVariantLifecycleServiceApi.ActivateVariantResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      experimentsVariantLifecycleServiceApi.ActivateVariantResponse.fromPartial({
        result: { message: (reply2?.result?.message ?? "") },
        variant: { audit: { createdBy: (reply2?.experiment?.audit?.createdBy ?? "") } },
      }),
      experimentsVariantLifecycleServiceApi.ActivateVariantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        variant: { variantId: (req?.variantId ?? "") },
      }),
    );
  }

  /**
   * Expires a variant.
   */
  async expireVariant(req: experimentsVariantLifecycleServiceApi.ExpireVariantRequest): Promise<experimentsVariantLifecycleServiceApi.ExpireVariantResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireVariant", req);
    this.logger.info("expire_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantSyncServiceApi.PushVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse> =
      (input, done) => this.experimentsVariantSyncClient.pushVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsVariantSyncServiceApi.PushVariantResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      experimentsVariantLifecycleServiceApi.ExpireVariantResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      experimentsVariantLifecycleServiceApi.ExpireVariantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        variant: { variantId: (req?.variantId ?? "") },
      }),
    );
  }

  /**
   * Returns a variant.
   */
  async getVariantLifecycle(req: experimentsVariantLifecycleServiceApi.GetVariantLifecycleRequest): Promise<experimentsVariantLifecycleServiceApi.GetVariantLifecycleResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetVariantLifecycle", req);
    this.logger.info("get_variant_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.CompareNotificationOptionsRequest.fromPartial({
      context: req?.context,
      notification: { assignee: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.CompareNotificationOptionsRequest, notificationsNotificationCalculationServiceApi.CompareNotificationOptionsResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.compareNotificationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      experimentsVariantLifecycleServiceApi.GetVariantLifecycleResponse.fromPartial({
        variant: { audit: { updatedBy: (reply1?.notification?.audit?.updatedBy ?? "") } },
      }),
      experimentsVariantLifecycleServiceApi.GetVariantLifecycleResponse.fromPartial({ variant: { variantId: (req?.variantId ?? "") } }),
    );
  }

  /**
   * Reinstates a variant.
   */
  async reinstateVariant(req: experimentsVariantLifecycleServiceApi.ReinstateVariantRequest): Promise<experimentsVariantLifecycleServiceApi.ReinstateVariantResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateVariant", req);
    this.logger.info("reinstate_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationServiceApi.SearchNotificationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationServiceApi.SearchNotificationsRequest, notificationsNotificationServiceApi.SearchNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient.searchNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = experimentsVariantReportingServiceApi.ShareVariantReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.newOwner?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const method2 = "shareVariantReport" as const;
    const invoke2: Unary<experimentsVariantReportingServiceApi.ShareVariantReportRequest, experimentsVariantReportingServiceApi.ShareVariantReportResponse> =
      (input, done) => this.experimentsVariantReportingClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantReportingServiceApi.ShareVariantReportRequest, experimentsVariantReportingServiceApi.ShareVariantReportResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantLifecycleServiceApi.ReinstateVariantResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      experimentsVariantLifecycleServiceApi.ReinstateVariantResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      experimentsVariantLifecycleServiceApi.ReinstateVariantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        variant: { variantId: (req?.variantId ?? "") },
      }),
    );
  }

  /**
   * Renews a variant.
   */
  async renewVariant(req: experimentsVariantLifecycleServiceApi.RenewVariantRequest): Promise<experimentsVariantLifecycleServiceApi.RenewVariantResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewVariant", req);
    this.logger.info("renew_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notifyContact?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.experimentsExposureCalculationClient);
    const invoke1: Unary<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse> =
      (input, done) => proxy1.explainExposureCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantLifecycleServiceApi.RenewVariantResponse.fromPartial({
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      experimentsVariantLifecycleServiceApi.RenewVariantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        variant: { variantId: (req?.variantId ?? "") },
      }),
    );
  }

  /**
   * Suspends a variant.
   */
  async suspendVariant(req: experimentsVariantLifecycleServiceApi.SuspendVariantRequest): Promise<experimentsVariantLifecycleServiceApi.SuspendVariantResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendVariant", req);
    this.logger.info("suspend_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.details?.notifyContact?.email ?? ""),
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      notificationTemplate: {
        counterparty: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.retryNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportResponse>(invoke1, request1);
    const request2 = personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowRequest.fromPartial({
      affinity: {
        subject: {
          displayName: (reply1?.notificationTemplate?.counterparty?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: {
        notify: {
          email: (req?.details?.notifyContact?.email ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowResponse> =
      (input, done) => this.personalizationAffinityWorkflowClient.advanceAffinityWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = prescriptionsPrescriptionQueryServiceApi.CountPrescriptionsRequest.fromPartial({
      context: input3?.context,
      filter: { region: (reply1?.notificationTemplate?.billingAddress?.region ?? "") },
    });
    const invoke3: Unary<prescriptionsPrescriptionQueryServiceApi.CountPrescriptionsRequest, prescriptionsPrescriptionQueryServiceApi.CountPrescriptionsResponse> =
      (input, done) => this.prescriptionsPrescriptionQueryClient.countPrescriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<prescriptionsPrescriptionQueryServiceApi.CountPrescriptionsRequest, prescriptionsPrescriptionQueryServiceApi.CountPrescriptionsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantLifecycleServiceApi.SuspendVariantResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      experimentsVariantLifecycleServiceApi.SuspendVariantResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      experimentsVariantLifecycleServiceApi.SuspendVariantResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      experimentsVariantLifecycleServiceApi.SuspendVariantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        variant: { variantId: (req?.variantId ?? "") },
      }),
    );
  }

  /**
   * Terminates a variant.
   */
  async terminateVariant(req: experimentsVariantLifecycleServiceApi.TerminateVariantRequest): Promise<experimentsVariantLifecycleServiceApi.TerminateVariantResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateVariant", req);
    this.logger.info("terminate_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesRequest.fromPartial({
      context: req?.context,
      subscriber: {
        preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.notificationsDeliveryAttemptNotificationClient.streamDeliveryAttemptNotices(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsDeliveryAttemptNotificationServiceApi.StreamDeliveryAttemptNoticesResponse.fromPartial({});
    const request2 = experimentsExperimentServiceApi.CreateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        organizer: { userId: (req?.details?.newOwner?.userId ?? "") },
        participants: [{ contact: { email: (req?.details?.notifyContact?.email ?? "") } }],
      },
    });
    const cloned2: experimentsExperimentServiceApi.CreateExperimentRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<experimentsExperimentServiceApi.CreateExperimentRequest, experimentsExperimentServiceApi.CreateExperimentResponse> =
      (input, done) => this.experimentsExperimentClient.createExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentServiceApi.CreateExperimentRequest, experimentsExperimentServiceApi.CreateExperimentResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantLifecycleServiceApi.TerminateVariantResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        variant: { owner: { email: (reply2?.experiment?.organizer?.email ?? "") } },
      }),
      experimentsVariantLifecycleServiceApi.TerminateVariantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        variant: { variantId: (req?.variantId ?? "") },
      }),
    );
  }
}
