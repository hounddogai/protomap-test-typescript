/**
 * Keeps every version of a delivery attempt and restores earlier ones.
 */

import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { DeliveryAttemptHistoryWorkflow } from "./delivery-attempt-history.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for DeliveryAttemptHistoryService; workflows own validation and database transactions.
 */
@injectable()
export class DeliveryAttemptHistoryHandler {
  constructor(@inject(DeliveryAttemptHistoryWorkflow) private readonly workflow: DeliveryAttemptHistoryWorkflow) {}

  /**
   * Annotates a delivery attempt.
   */
  annotateDeliveryAttemptVersion = unary<notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionResponse>(
    (request) => this.workflow.annotateDeliveryAttemptVersion(request),
  );

  /**
   * Compares a delivery attempt.
   */
  compareDeliveryAttemptVersions = (call: ServerUnaryCall<notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsResponse>, done: sendUnaryData<notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsResponse>): void => {
    void this.workflow.compareDeliveryAttemptVersions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a delivery attempt.
   */
  getDeliveryAttemptVersion = unary<notificationsDeliveryAttemptHistoryServiceApi.GetDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.GetDeliveryAttemptVersionResponse>(
    (request) => this.workflow.getDeliveryAttemptVersion(request),
  );

  /**
   * Lists delivery attempts a page at a time.
   */
  listDeliveryAttemptVersions = unary<notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsResponse>(
    (request) => this.workflow.listDeliveryAttemptVersions(request),
  );

  /**
   * Deletes a delivery attempt.
   */
  pruneDeliveryAttemptVersions = (call: ServerUnaryCall<notificationsDeliveryAttemptHistoryServiceApi.PruneDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.PruneDeliveryAttemptVersionsResponse>, done: sendUnaryData<notificationsDeliveryAttemptHistoryServiceApi.PruneDeliveryAttemptVersionsResponse>): void => {
    void this.workflow.pruneDeliveryAttemptVersions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Records a delivery attempt.
   */
  recordDeliveryAttemptVersion = unary<notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionResponse>(
    (request) => this.workflow.recordDeliveryAttemptVersion(request),
  );

  /**
   * Reverts a delivery attempt.
   */
  revertDeliveryAttempt = unary<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse>(
    (request) => this.workflow.revertDeliveryAttempt(request),
  );
}

export function implementation(handler: DeliveryAttemptHistoryHandler): notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceServer {
  return {
    annotateDeliveryAttemptVersion: handler.annotateDeliveryAttemptVersion,
    compareDeliveryAttemptVersions: handler.compareDeliveryAttemptVersions,
    getDeliveryAttemptVersion: handler.getDeliveryAttemptVersion,
    listDeliveryAttemptVersions: handler.listDeliveryAttemptVersions,
    pruneDeliveryAttemptVersions: handler.pruneDeliveryAttemptVersions,
    recordDeliveryAttemptVersion: handler.recordDeliveryAttemptVersion,
    revertDeliveryAttempt: handler.revertDeliveryAttempt,
  };
}
