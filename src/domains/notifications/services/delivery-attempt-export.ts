/**
 * Exports delivery attempts to files and other systems. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { GrpcAdapter, call, metadataFor, retry, type RequestPort, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toDeliveryAttemptRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate delivery attempt operations and persist audit data.
 */
@injectable()
export class DeliveryAttemptExportWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Cancels a delivery attempt.
   */
  async cancelDeliveryAttemptExport(req: notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportRequest): Promise<notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "CancelDeliveryAttemptExport", req);
    this.logger.info("cancel_delivery_attempt_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      outcome: { effectiveAt: req?.details?.effectiveAt },
    });
  }

  /**
   * Returns a delivery attempt.
   */
  async getDeliveryAttemptExport(req: notificationsDeliveryAttemptExportServiceApi.GetDeliveryAttemptExportRequest): Promise<notificationsDeliveryAttemptExportServiceApi.GetDeliveryAttemptExportResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetDeliveryAttemptExport", req);
    this.logger.info("get_delivery_attempt_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsDeliveryAttemptExportServiceApi.GetDeliveryAttemptExportResponse.fromPartial({
      deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
    });
  }

  /**
   * Lists delivery attempts a page at a time.
   */
  async listDeliveryAttemptExports(req: notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest): Promise<notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListDeliveryAttemptExports", req);
    this.logger.info("list_delivery_attempt_exports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationSyncServiceApi.ReconcileNotificationsRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        audit: { updatedAt: req?.filter?.createdAfter },
      },
    });
    const invoke1: Unary<notificationsNotificationSyncServiceApi.ReconcileNotificationsRequest, notificationsNotificationSyncServiceApi.ReconcileNotificationsResponse> =
      (input, done) => this.notificationsNotificationSyncClient.reconcileNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsNotificationSyncServiceApi.ReconcileNotificationsRequest, notificationsNotificationSyncServiceApi.ReconcileNotificationsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsResponse.fromPartial({
      result: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        referenceIds: (reply1?.result?.referenceIds ?? []),
      },
    });
  }

  /**
   * Retrys a delivery attempt.
   */
  async retryDeliveryAttemptExport(req: notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest): Promise<notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "RetryDeliveryAttemptExport", req);
    this.logger.info("retry_delivery_attempt_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        sequence: (req?.deliveryAttempt?.sequence ?? 0),
      },
    });
  }

  /**
   * Shares a delivery attempt.
   */
  async shareDeliveryAttemptExport(req: notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest): Promise<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareDeliveryAttemptExport", req);
    this.logger.info("share_delivery_attempt_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.recipient?.email ?? "") } },
    });
    const invoke1: Unary<authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.normalizeAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse.fromPartial({
        deliveryAttempt: {
          subject: { displayName: (reply1?.accessPolicy?.owner?.displayName ?? "") },
        },
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
      }),
      notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse.fromPartial({
        deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      }),
    );
  }

  /**
   * Streams every matching delivery attempt.
   */
  async streamDeliveryAttemptExport(req: notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportRequest): Promise<notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamDeliveryAttemptExport", req);
    this.logger.info("stream_delivery_attempt_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportResponse.fromPartial({});
  }
}

/**
 * The gRPC boundary for DeliveryAttemptExportService; workflows own validation and database transactions.
 */
@injectable()
export class DeliveryAttemptExportHandler {
  constructor(@inject(DeliveryAttemptExportWorkflow) private readonly workflow: DeliveryAttemptExportWorkflow) {}

  /**
   * Cancels a delivery attempt.
   */
  cancelDeliveryAttemptExport = unary<notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportResponse>(
    (request) => this.workflow.cancelDeliveryAttemptExport(request),
  );

  /**
   * Returns a delivery attempt.
   */
  getDeliveryAttemptExport = unary<notificationsDeliveryAttemptExportServiceApi.GetDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.GetDeliveryAttemptExportResponse>(
    (request) => this.workflow.getDeliveryAttemptExport(request),
  );

  /**
   * Lists delivery attempts a page at a time.
   */
  listDeliveryAttemptExports = (call: ServerUnaryCall<notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsRequest, notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsResponse>, done: sendUnaryData<notificationsDeliveryAttemptExportServiceApi.ListDeliveryAttemptExportsResponse>): void => {
    void this.workflow.listDeliveryAttemptExports(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a delivery attempt.
   */
  retryDeliveryAttemptExport = unary<notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportResponse>(
    (request) => this.workflow.retryDeliveryAttemptExport(request),
  );

  /**
   * Shares a delivery attempt.
   */
  shareDeliveryAttemptExport = unary<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse>(
    (request) => this.workflow.shareDeliveryAttemptExport(request),
  );

  /**
   * Streams every matching delivery attempt.
   */
  streamDeliveryAttemptExport = serverStream<notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.StreamDeliveryAttemptExportResponse>(
    (request) => this.workflow.streamDeliveryAttemptExport(request),
  );
}

export function implementation(handler: DeliveryAttemptExportHandler): notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceServer {
  return {
    cancelDeliveryAttemptExport: handler.cancelDeliveryAttemptExport,
    getDeliveryAttemptExport: handler.getDeliveryAttemptExport,
    listDeliveryAttemptExports: handler.listDeliveryAttemptExports,
    retryDeliveryAttemptExport: handler.retryDeliveryAttemptExport,
    shareDeliveryAttemptExport: handler.shareDeliveryAttemptExport,
    streamDeliveryAttemptExport: handler.streamDeliveryAttemptExport,
  };
}
