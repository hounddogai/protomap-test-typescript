/**
 * Answers read-only questions about widget layouts, for screens and reports.
 */

import * as webbffWidgetLayoutQueryServiceApi from "../../../../../.cache/proto/acme/webbff/v1/widget_layout_query_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { WidgetLayoutQueryWorkflow } from "./widget-layout-query.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WidgetLayoutQueryService; workflows own validation and database transactions.
 */
@injectable()
export class WidgetLayoutQueryHandler {
  constructor(@inject(WidgetLayoutQueryWorkflow) private readonly workflow: WidgetLayoutQueryWorkflow) {}

  /**
   * Lists widget layouts a page at a time.
   */
  browseWidgetLayouts = unary<webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.BrowseWidgetLayoutsResponse>(
    (request) => this.workflow.browseWidgetLayouts(request),
  );

  /**
   * Counts widget layouts by status.
   */
  countWidgetLayouts = (call: ServerUnaryCall<webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsResponse>, done: sendUnaryData<webbffWidgetLayoutQueryServiceApi.CountWidgetLayoutsResponse>): void => {
    void this.workflow.countWidgetLayouts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams every matching widget layout.
   */
  exportWidgetLayouts = serverStream<webbffWidgetLayoutQueryServiceApi.ExportWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.ExportWidgetLayoutsResponse>(
    (request) => this.workflow.exportWidgetLayouts(request),
  );

  /**
   * Lists widget layouts a page at a time.
   */
  findWidgetLayouts = unary<webbffWidgetLayoutQueryServiceApi.FindWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.FindWidgetLayoutsResponse>(
    (request) => this.workflow.findWidgetLayouts(request),
  );

  /**
   * Returns a widget layout.
   */
  lookupWidgetLayout = (call: ServerUnaryCall<webbffWidgetLayoutQueryServiceApi.LookupWidgetLayoutRequest, webbffWidgetLayoutQueryServiceApi.LookupWidgetLayoutResponse>, done: sendUnaryData<webbffWidgetLayoutQueryServiceApi.LookupWidgetLayoutResponse>): void => {
    void this.workflow.lookupWidgetLayout(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a widget layout.
   */
  peekWidgetLayout = unary<webbffWidgetLayoutQueryServiceApi.PeekWidgetLayoutRequest, webbffWidgetLayoutQueryServiceApi.PeekWidgetLayoutResponse>(
    (request) => this.workflow.peekWidgetLayout(request),
  );

  /**
   * Lists widget layouts a page at a time.
   */
  suggestWidgetLayouts = unary<webbffWidgetLayoutQueryServiceApi.SuggestWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.SuggestWidgetLayoutsResponse>(
    (request) => this.workflow.suggestWidgetLayouts(request),
  );

  /**
   * Summarizes a widget layout.
   */
  summarizeWidgetLayouts = (call: ServerUnaryCall<webbffWidgetLayoutQueryServiceApi.SummarizeWidgetLayoutsRequest, webbffWidgetLayoutQueryServiceApi.SummarizeWidgetLayoutsResponse>, done: sendUnaryData<webbffWidgetLayoutQueryServiceApi.SummarizeWidgetLayoutsResponse>): void => {
    void this.workflow.summarizeWidgetLayouts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: WidgetLayoutQueryHandler): webbffWidgetLayoutQueryServiceApi.WidgetLayoutQueryServiceServer {
  return {
    browseWidgetLayouts: handler.browseWidgetLayouts,
    countWidgetLayouts: handler.countWidgetLayouts,
    exportWidgetLayouts: handler.exportWidgetLayouts,
    findWidgetLayouts: handler.findWidgetLayouts,
    lookupWidgetLayout: handler.lookupWidgetLayout,
    peekWidgetLayout: handler.peekWidgetLayout,
    suggestWidgetLayouts: handler.suggestWidgetLayouts,
    summarizeWidgetLayouts: handler.summarizeWidgetLayouts,
  };
}
