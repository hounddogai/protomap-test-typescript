/**
 * Answers read-only questions about notification templates, for screens and reports.
 */

import * as notificationsNotificationTemplateQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { NotificationTemplateQueryWorkflow } from "./notification-template-query.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for NotificationTemplateQueryService; workflows own validation and database transactions.
 */
@injectable()
export class NotificationTemplateQueryHandler {
  constructor(@inject(NotificationTemplateQueryWorkflow) private readonly workflow: NotificationTemplateQueryWorkflow) {}

  /**
   * Lists notification templates a page at a time.
   */
  browseNotificationTemplates = unary<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse>(
    (request) => this.workflow.browseNotificationTemplates(request),
  );

  /**
   * Counts notification templates by status.
   */
  countNotificationTemplates = (call: ServerUnaryCall<notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse>, done: sendUnaryData<notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse>): void => {
    void this.workflow.countNotificationTemplates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams every matching notification template.
   */
  exportNotificationTemplates = serverStream<notificationsNotificationTemplateQueryServiceApi.ExportNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.ExportNotificationTemplatesResponse>(
    (request) => this.workflow.exportNotificationTemplates(request),
  );

  /**
   * Lists notification templates a page at a time.
   */
  findNotificationTemplates = unary<notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.FindNotificationTemplatesResponse>(
    (request) => this.workflow.findNotificationTemplates(request),
  );

  /**
   * Returns a notification template.
   */
  lookupNotificationTemplate = (call: ServerUnaryCall<notificationsNotificationTemplateQueryServiceApi.LookupNotificationTemplateRequest, notificationsNotificationTemplateQueryServiceApi.LookupNotificationTemplateResponse>, done: sendUnaryData<notificationsNotificationTemplateQueryServiceApi.LookupNotificationTemplateResponse>): void => {
    void this.workflow.lookupNotificationTemplate(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a notification template.
   */
  peekNotificationTemplate = unary<notificationsNotificationTemplateQueryServiceApi.PeekNotificationTemplateRequest, notificationsNotificationTemplateQueryServiceApi.PeekNotificationTemplateResponse>(
    (request) => this.workflow.peekNotificationTemplate(request),
  );

  /**
   * Returns several notification templates at once.
   */
  resolveNotificationTemplates = unary<notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesResponse>(
    (request) => this.workflow.resolveNotificationTemplates(request),
  );

  /**
   * Lists notification templates a page at a time.
   */
  suggestNotificationTemplates = (call: ServerUnaryCall<notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesResponse>, done: sendUnaryData<notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesResponse>): void => {
    void this.workflow.suggestNotificationTemplates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Summarizes a notification template.
   */
  summarizeNotificationTemplates = unary<notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesResponse>(
    (request) => this.workflow.summarizeNotificationTemplates(request),
  );
}

export function implementation(handler: NotificationTemplateQueryHandler): notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceServer {
  return {
    browseNotificationTemplates: handler.browseNotificationTemplates,
    countNotificationTemplates: handler.countNotificationTemplates,
    exportNotificationTemplates: handler.exportNotificationTemplates,
    findNotificationTemplates: handler.findNotificationTemplates,
    lookupNotificationTemplate: handler.lookupNotificationTemplate,
    peekNotificationTemplate: handler.peekNotificationTemplate,
    resolveNotificationTemplates: handler.resolveNotificationTemplates,
    suggestNotificationTemplates: handler.suggestNotificationTemplates,
    summarizeNotificationTemplates: handler.summarizeNotificationTemplates,
  };
}
