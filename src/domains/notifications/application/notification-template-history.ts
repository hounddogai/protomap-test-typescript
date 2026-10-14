/**
 * Keeps every version of a notification template and restores earlier ones. Remote work stays behind typed client
 * ports.
 */

import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toNotificationTemplateRecord } from "../data/records.js";
import { NotificationsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification template operations and persist audit data.
 */
@injectable()
export class NotificationTemplateHistoryWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Annotates a notification template.
   */
  async annotateNotificationTemplateVersion(req: notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionRequest): Promise<notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "AnnotateNotificationTemplateVersion", req);
    this.logger.info("annotate_notification_template_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionResponse.fromPartial({
      notificationTemplate: {
        billingAddress: req?.notificationTemplate?.billingAddress,
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Compares a notification template.
   */
  async compareNotificationTemplateVersions(req: notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest): Promise<notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "CompareNotificationTemplateVersions", req);
    this.logger.info("compare_notification_template_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsResponse.fromPartial({
      notificationTemplate: {
        billingAddress: req?.notificationTemplate?.billingAddress,
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }

  /**
   * Lists notification templates a page at a time.
   */
  async listNotificationTemplateVersions(req: notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsRequest): Promise<notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListNotificationTemplateVersions", req);
    this.logger.info("list_notification_template_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsResponse.fromPartial({});
  }

  /**
   * Deletes a notification template.
   */
  async pruneNotificationTemplateVersions(req: notificationsNotificationTemplateHistoryServiceApi.PruneNotificationTemplateVersionsRequest): Promise<notificationsNotificationTemplateHistoryServiceApi.PruneNotificationTemplateVersionsResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "PruneNotificationTemplateVersions", req);
    this.logger.info("prune_notification_template_versions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest.fromPartial({
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.summarizeFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SummarizeFeatureFlagsResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return notificationsNotificationTemplateHistoryServiceApi.PruneNotificationTemplateVersionsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } });
  }

  /**
   * Records a notification template.
   */
  async recordNotificationTemplateVersion(req: notificationsNotificationTemplateHistoryServiceApi.RecordNotificationTemplateVersionRequest): Promise<notificationsNotificationTemplateHistoryServiceApi.RecordNotificationTemplateVersionResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "RecordNotificationTemplateVersion", req);
    this.logger.info("record_notification_template_version", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateHistoryServiceApi.RecordNotificationTemplateVersionResponse.fromPartial({
      notificationTemplate: {
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
        total: req?.notificationTemplate?.total,
      },
    });
  }

  /**
   * Reverts a notification template.
   */
  async revertNotificationTemplate(req: notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateRequest): Promise<notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateResponse> {
    validateContext(req.context);
    if (req.notificationTemplate) {
      await this.repository.save(toNotificationTemplateRecord(req.context.tenantId, req.notificationTemplate));
    }
    await this.repository.record(req.context.tenantId, "RevertNotificationTemplate", req);
    this.logger.info("revert_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateResponse.fromPartial({
      notificationTemplate: {
        notes: (req?.notificationTemplate?.notes ?? ""),
        notificationTemplateId: (req?.notificationTemplateId ?? ""),
      },
    });
  }
}
