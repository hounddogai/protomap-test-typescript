/**
 * Answers read-only questions about notification templates, for screens and reports. Remote work stays behind typed
 * client ports.
 */

import * as notificationsNotificationHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, metadataFor, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { NotificationsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate notification template operations and persist audit data.
 */
@injectable()
export class NotificationTemplateQueryWorkflow {
  constructor(
    @inject(NotificationsRepository) private readonly repository: NotificationsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists notification templates a page at a time.
   */
  async browseNotificationTemplates(req: notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest): Promise<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseNotificationTemplates", req);
    this.logger.info("browse_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse.fromPartial({});
  }

  /**
   * Counts notification templates by status.
   */
  async countNotificationTemplates(req: notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest): Promise<notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountNotificationTemplates", req);
    this.logger.info("count_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse.fromPartial({});
  }

  /**
   * Streams every matching notification template.
   */
  async exportNotificationTemplates(req: notificationsNotificationTemplateQueryServiceApi.ExportNotificationTemplatesRequest): Promise<notificationsNotificationTemplateQueryServiceApi.ExportNotificationTemplatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportNotificationTemplates", req);
    this.logger.info("export_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return notificationsNotificationTemplateQueryServiceApi.ExportNotificationTemplatesResponse.fromPartial({
      notificationTemplate: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
  }

  /**
   * Lists notification templates a page at a time.
   */
  async findNotificationTemplates(req: notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest): Promise<notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindNotificationTemplates", req);
    this.logger.info("find_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        region: (req?.filter?.region ?? ""),
      },
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.ListNotificationVersionsRequest",
      value: Buffer.from(notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.ListNotificationVersionsResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.listNotificationVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.ListNotificationVersionsResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesResponse.fromPartial({
      pageInfo: { nextPageToken: (reply1?.pageInfo?.nextPageToken ?? "") },
      result: { message: (reply1?.result?.message ?? "") },
    });
  }

  /**
   * Returns a notification template.
   */
  async lookupNotificationTemplate(req: notificationsNotificationTemplateQueryServiceApi.LookupNotificationTemplateRequest): Promise<notificationsNotificationTemplateQueryServiceApi.LookupNotificationTemplateResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupNotificationTemplate", req);
    this.logger.info("lookup_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationTemplateQueryServiceApi.LookupNotificationTemplateResponse.fromPartial({
      notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
    });
  }

  /**
   * Returns a notification template.
   */
  async peekNotificationTemplate(req: notificationsNotificationTemplateQueryServiceApi.PeekNotificationTemplateRequest): Promise<notificationsNotificationTemplateQueryServiceApi.PeekNotificationTemplateResponse> {
    validateContext(req.context);
    if (!req.notificationTemplateId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "notification_template_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekNotificationTemplate", req);
    this.logger.info("peek_notification_template", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationTemplateQueryServiceApi.PeekNotificationTemplateResponse.fromPartial({
      notificationTemplate: { notificationTemplateId: (req?.notificationTemplateId ?? "") },
    });
  }

  /**
   * Returns several notification templates at once.
   */
  async resolveNotificationTemplates(req: notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesRequest): Promise<notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveNotificationTemplates", req);
    this.logger.info("resolve_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    return notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesResponse.fromPartial({});
  }

  /**
   * Lists notification templates a page at a time.
   */
  async suggestNotificationTemplates(req: notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesRequest): Promise<notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestNotificationTemplates", req);
    this.logger.info("suggest_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesResponse.fromPartial({});
  }

  /**
   * Summarizes a notification template.
   */
  async summarizeNotificationTemplates(req: notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesRequest): Promise<notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeNotificationTemplates", req);
    this.logger.info("summarize_notification_templates", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesResponse.fromPartial({ period: req?.details?.period });
  }
}
