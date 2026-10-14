/**
 * Exports subscriptions to files and other systems.
 */

import * as notificationsSubscriptionExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { SubscriptionExportWorkflow } from "../application/subscription-export.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for SubscriptionExportService; workflows own validation and database transactions.
 */
@injectable()
export class SubscriptionExportHandler {
  constructor(@inject(SubscriptionExportWorkflow) private readonly workflow: SubscriptionExportWorkflow) {}

  /**
   * Cancels a subscription.
   */
  cancelSubscriptionExport = (call: ServerUnaryCall<notificationsSubscriptionExportServiceApi.CancelSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.CancelSubscriptionExportResponse>, done: sendUnaryData<notificationsSubscriptionExportServiceApi.CancelSubscriptionExportResponse>): void => {
    void this.workflow.cancelSubscriptionExport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a subscription.
   */
  getSubscriptionExport = unary<notificationsSubscriptionExportServiceApi.GetSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.GetSubscriptionExportResponse>(
    (request) => this.workflow.getSubscriptionExport(request),
  );

  /**
   * Lists subscriptions a page at a time.
   */
  listSubscriptionExports = unary<notificationsSubscriptionExportServiceApi.ListSubscriptionExportsRequest, notificationsSubscriptionExportServiceApi.ListSubscriptionExportsResponse>(
    (request) => this.workflow.listSubscriptionExports(request),
  );

  /**
   * Schedules a subscription.
   */
  scheduleSubscriptionExport = (call: ServerUnaryCall<notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportResponse>, done: sendUnaryData<notificationsSubscriptionExportServiceApi.ScheduleSubscriptionExportResponse>): void => {
    void this.workflow.scheduleSubscriptionExport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Shares a subscription.
   */
  shareSubscriptionExport = unary<notificationsSubscriptionExportServiceApi.ShareSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.ShareSubscriptionExportResponse>(
    (request) => this.workflow.shareSubscriptionExport(request),
  );

  /**
   * Streams every matching subscription.
   */
  streamSubscriptionExport = serverStream<notificationsSubscriptionExportServiceApi.StreamSubscriptionExportRequest, notificationsSubscriptionExportServiceApi.StreamSubscriptionExportResponse>(
    (request) => this.workflow.streamSubscriptionExport(request),
  );
}

export function implementation(handler: SubscriptionExportHandler): notificationsSubscriptionExportServiceApi.SubscriptionExportServiceServer {
  return {
    cancelSubscriptionExport: handler.cancelSubscriptionExport,
    getSubscriptionExport: handler.getSubscriptionExport,
    listSubscriptionExports: handler.listSubscriptionExports,
    scheduleSubscriptionExport: handler.scheduleSubscriptionExport,
    shareSubscriptionExport: handler.shareSubscriptionExport,
    streamSubscriptionExport: handler.streamSubscriptionExport,
  };
}
