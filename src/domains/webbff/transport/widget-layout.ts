/**
 * Manages widget layouts: creates, reads, changes, and lists them.
 */

import * as webbffWidgetLayoutServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { WidgetLayoutWorkflow } from "../application/widget-layout.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WidgetLayoutService; workflows own validation and database transactions.
 */
@injectable()
export class WidgetLayoutHandler {
  constructor(@inject(WidgetLayoutWorkflow) private readonly workflow: WidgetLayoutWorkflow) {}

  /**
   * Creates a widget layout.
   */
  cloneWidgetLayout = (call: ServerUnaryCall<webbffWidgetLayoutServiceApi.CloneWidgetLayoutRequest, webbffWidgetLayoutServiceApi.CloneWidgetLayoutResponse>, done: sendUnaryData<webbffWidgetLayoutServiceApi.CloneWidgetLayoutResponse>): void => {
    void this.workflow.cloneWidgetLayout(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Creates a widget layout.
   */
  createWidgetLayout = unary<webbffWidgetLayoutServiceApi.CreateWidgetLayoutRequest, webbffWidgetLayoutServiceApi.CreateWidgetLayoutResponse>(
    (request) => this.workflow.createWidgetLayout(request),
  );

  /**
   * Returns a widget layout.
   */
  getWidgetLayout = unary<webbffWidgetLayoutServiceApi.GetWidgetLayoutRequest, webbffWidgetLayoutServiceApi.GetWidgetLayoutResponse>(
    (request) => this.workflow.getWidgetLayout(request),
  );

  /**
   * Lists widget layouts a page at a time.
   */
  listWidgetLayouts = (call: ServerUnaryCall<webbffWidgetLayoutServiceApi.ListWidgetLayoutsRequest, webbffWidgetLayoutServiceApi.ListWidgetLayoutsResponse>, done: sendUnaryData<webbffWidgetLayoutServiceApi.ListWidgetLayoutsResponse>): void => {
    void this.workflow.listWidgetLayouts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists widget layouts a page at a time.
   */
  searchWidgetLayouts = unary<webbffWidgetLayoutServiceApi.SearchWidgetLayoutsRequest, webbffWidgetLayoutServiceApi.SearchWidgetLayoutsResponse>(
    (request) => this.workflow.searchWidgetLayouts(request),
  );

  /**
   * Changes a widget layout.
   */
  updateWidgetLayout = unary<webbffWidgetLayoutServiceApi.UpdateWidgetLayoutRequest, webbffWidgetLayoutServiceApi.UpdateWidgetLayoutResponse>(
    (request) => this.workflow.updateWidgetLayout(request),
  );

  /**
   * Streams the changes of widget layouts as they happen.
   */
  watchWidgetLayouts = serverStream<webbffWidgetLayoutServiceApi.WatchWidgetLayoutsRequest, webbffWidgetLayoutServiceApi.WatchWidgetLayoutsResponse>(
    (request) => this.workflow.watchWidgetLayouts(request),
  );
}

export function implementation(handler: WidgetLayoutHandler): webbffWidgetLayoutServiceApi.WidgetLayoutServiceServer {
  return {
    cloneWidgetLayout: handler.cloneWidgetLayout,
    createWidgetLayout: handler.createWidgetLayout,
    getWidgetLayout: handler.getWidgetLayout,
    listWidgetLayouts: handler.listWidgetLayouts,
    searchWidgetLayouts: handler.searchWidgetLayouts,
    updateWidgetLayout: handler.updateWidgetLayout,
    watchWidgetLayouts: handler.watchWidgetLayouts,
  };
}
