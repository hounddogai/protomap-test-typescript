/**
 * Keeps every version of a delivery attempt and restores earlier ones. Remote work stays behind typed client ports.
 */

import * as metricsMetricSeriesQueryServiceApi from "../../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as venuesVenueServiceApi from "../../../../../.cache/proto/acme/venues/v1/venue_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, operation, type Unary, workflow } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toDeliveryAttemptRecord } from "../../data/records.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate delivery attempt operations and persist audit data.
 */
@injectable()
export class DeliveryAttemptHistoryWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.venues.v1.VenueService") private readonly venuesVenueClient: venuesVenueServiceApi.VenueServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Annotates a delivery attempt.
   */
  async annotateDeliveryAttemptVersion(req: notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionRequest): Promise<notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "AnnotateDeliveryAttemptVersion", req);
    this.logger.info("annotate_delivery_attempt_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        sequence: (req?.deliveryAttempt?.sequence ?? 0),
      },
    });
  }

  /**
   * Compares a delivery attempt.
   */
  async compareDeliveryAttemptVersions(req: notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsRequest): Promise<notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "CompareDeliveryAttemptVersions", req);
    this.logger.info("compare_delivery_attempt_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsResponse.fromPartial({
      deliveryAttempt: {
        attributes: (req?.deliveryAttempt?.attributes ?? {}),
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
      },
    });
  }

  /**
   * Returns a delivery attempt.
   */
  async getDeliveryAttemptVersion(req: notificationsDeliveryAttemptHistoryServiceApi.GetDeliveryAttemptVersionRequest): Promise<notificationsDeliveryAttemptHistoryServiceApi.GetDeliveryAttemptVersionResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetDeliveryAttemptVersion", req);
    this.logger.info("get_delivery_attempt_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueServiceApi.CloneVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        audit: { updatedAt: req?.context?.deadline },
        components: { primary: { componentId: (req?.deliveryAttemptId ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<venuesVenueServiceApi.CloneVenueRequest, venuesVenueServiceApi.CloneVenueResponse> =
      (input, done) => this.venuesVenueClient.cloneVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("GetDeliveryAttemptVersion.CloneVenue", () => call<venuesVenueServiceApi.CloneVenueRequest, venuesVenueServiceApi.CloneVenueResponse>(invoke1, request1));
    return mergeResponses(
      notificationsDeliveryAttemptHistoryServiceApi.GetDeliveryAttemptVersionResponse.fromPartial({
        deliveryAttempt: { subject: { displayName: (reply1?.venue?.owner?.displayName ?? "") } },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      notificationsDeliveryAttemptHistoryServiceApi.GetDeliveryAttemptVersionResponse.fromPartial({
        deliveryAttempt: { deliveryAttemptId: (req?.deliveryAttemptId ?? "") },
      }),
    );
  }

  /**
   * Lists delivery attempts a page at a time.
   */
  async listDeliveryAttemptVersions(req: notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsRequest): Promise<notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListDeliveryAttemptVersions", req);
    this.logger.info("list_delivery_attempt_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsDeliveryAttemptHistoryServiceApi.ListDeliveryAttemptVersionsResponse.fromPartial({});
  }

  /**
   * Deletes a delivery attempt.
   */
  async pruneDeliveryAttemptVersions(req: notificationsDeliveryAttemptHistoryServiceApi.PruneDeliveryAttemptVersionsRequest): Promise<notificationsDeliveryAttemptHistoryServiceApi.PruneDeliveryAttemptVersionsResponse> {
    validateContext(req.context);
    if (!req.deliveryAttemptId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "delivery_attempt_id is required");
    }
    await this.repository.record(req.context.tenantId, "PruneDeliveryAttemptVersions", req);
    this.logger.info("prune_delivery_attempt_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesQueryServiceApi.SummarizeMetricSeriesesRequest.fromPartial({
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<metricsMetricSeriesQueryServiceApi.SummarizeMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.SummarizeMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesQueryClient.summarizeMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return notificationsDeliveryAttemptHistoryServiceApi.PruneDeliveryAttemptVersionsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } });
  }

  /**
   * Records a delivery attempt.
   */
  async recordDeliveryAttemptVersion(req: notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest): Promise<notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "RecordDeliveryAttemptVersion", req);
    this.logger.info("record_delivery_attempt_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        subject: req?.deliveryAttempt?.subject,
      },
    });
  }

  /**
   * Reverts a delivery attempt.
   */
  async revertDeliveryAttempt(req: notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest): Promise<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse> {
    validateContext(req.context);
    if (req.deliveryAttempt) {
      await this.repository.save(toDeliveryAttemptRecord(req.context.tenantId, req.deliveryAttempt));
    }
    await this.repository.record(req.context.tenantId, "RevertDeliveryAttempt", req);
    this.logger.info("revert_delivery_attempt", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse.fromPartial({
      deliveryAttempt: {
        deliveryAttemptId: (req?.deliveryAttemptId ?? ""),
        kind: (req?.deliveryAttempt?.kind ?? ""),
      },
    });
  }
}
