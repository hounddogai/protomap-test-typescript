/**
 * Exports subscriptions to files and other systems. Remote work stays behind typed client ports.
 */

import * as featureflagsFeatureFlagServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsSubscriptionExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { metadataFor, operation, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate subscription operations and persist audit data.
 */
@injectable()
export class SubscriptionExportWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Cancels a subscription.
   */
  async cancelSubscriptionExport(req: notificationsSubscriptionExportServiceApi.CancelSubscriptionExportRequest): Promise<notificationsSubscriptionExportServiceApi.CancelSubscriptionExportResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "CancelSubscriptionExport", req);
    this.logger.info("cancel_subscription_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionExportServiceApi.CancelSubscriptionExportResponse.fromPartial({
      outcome: { effectiveAt: req?.details?.effectiveAt },
      subscription: { subscriptionId: (req?.subscriptionId ?? "") },
    });
  }

  /**
   * Returns a subscription.
   */
  async getSubscriptionExport(req: notificationsSubscriptionExportServiceApi.GetSubscriptionExportRequest): Promise<notificationsSubscriptionExportServiceApi.GetSubscriptionExportResponse> {
    validateContext(req.context);
    if (!req.subscriptionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "subscription_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetSubscriptionExport", req);
    this.logger.info("get_subscription_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        correlationId: (req?.context?.traceId ?? ""),
        source: (req?.subscriptionId ?? ""),
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.simulateDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return mergeResponses(
      notificationsSubscriptionExportServiceApi.GetSubscriptionExportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      notificationsSubscriptionExportServiceApi.GetSubscriptionExportResponse.fromPartial({ subscription: { subscriptionId: (req?.subscriptionId ?? "") } }),
    );
  }

  /**
   * Lists subscriptions a page at a time.
   */
  async listSubscriptionExports(req: notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest): Promise<notificationsSubscriptionExportServiceApi.ListSubscriptionExportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListSubscriptionExports", req);
    this.logger.info("list_subscription_exports", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsSubscriptionExportServiceApi.ListSubscriptionExportsResponse.fromPartial({});
  }

  /**
   * Schedules a subscription.
   */
  async scheduleSubscriptionExport(req: notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportRequest): Promise<notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleSubscriptionExport", req);
    this.logger.info("schedule_subscription_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportResponse.fromPartial({ period: req?.details?.period });
  }

  /**
   * Shares a subscription.
   */
  async shareSubscriptionExport(req: notificationsSubscriptionExportServiceApi.ShareSubscriptionExportRequest): Promise<notificationsSubscriptionExportServiceApi.ShareSubscriptionExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareSubscriptionExport", req);
    this.logger.info("share_subscription_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest.fromPartial({ context: req?.context });
    const reply1 = await this.workQueue.enqueue<featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsResponse>(
      "acme.notifications.v1.SubscriptionExportService/ShareSubscriptionExport:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      notificationsSubscriptionExportServiceApi.ShareSubscriptionExportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      notificationsSubscriptionExportServiceApi.ShareSubscriptionExportResponse.fromPartial({
        subscription: {
          owner: { email: (req?.details?.recipient?.email ?? "") },
          subscriptionId: (req?.subscriptionId ?? ""),
        },
      }),
    );
  }

  /**
   * Streams every matching subscription.
   */
  async streamSubscriptionExport(req: notificationsSubscriptionExportServiceApi.StreamSubscriptionExportRequest): Promise<notificationsSubscriptionExportServiceApi.StreamSubscriptionExportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamSubscriptionExport", req);
    this.logger.info("stream_subscription_export", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return notificationsSubscriptionExportServiceApi.StreamSubscriptionExportResponse.fromPartial({});
  }
}
