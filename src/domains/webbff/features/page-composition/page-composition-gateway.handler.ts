/**
 * The edge API that apps call for page compositions.
 */

import * as webbffPageCompositionGatewayServiceApi from "../../../../../.cache/proto/acme/webbff/v1/page_composition_gateway_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../../platform/handlers.js";
import { PageCompositionGatewayWorkflow } from "./page-composition-gateway.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for PageCompositionGatewayService; workflows own validation and database transactions.
 */
@injectable()
export class PageCompositionGatewayHandler {
  constructor(@inject(PageCompositionGatewayWorkflow) private readonly workflow: PageCompositionGatewayWorkflow) {}

  /**
   * Composes a page composition.
   */
  composePageCompositionPage = unary<webbffPageCompositionGatewayServiceApi.ComposePageCompositionPageRequest, webbffPageCompositionGatewayServiceApi.ComposePageCompositionPageResponse>(
    (request) => this.workflow.composePageCompositionPage(request),
  );

  /**
   * Fetchs a page composition.
   */
  fetchPageCompositionView = (call: ServerUnaryCall<webbffPageCompositionGatewayServiceApi.FetchPageCompositionViewRequest, webbffPageCompositionGatewayServiceApi.FetchPageCompositionViewResponse>, done: sendUnaryData<webbffPageCompositionGatewayServiceApi.FetchPageCompositionViewResponse>): void => {
    void this.workflow.fetchPageCompositionView(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a page composition.
   */
  getPageCompositionSummary = unary<webbffPageCompositionGatewayServiceApi.GetPageCompositionSummaryRequest, webbffPageCompositionGatewayServiceApi.GetPageCompositionSummaryResponse>(
    (request) => this.workflow.getPageCompositionSummary(request),
  );

  /**
   * Refreshs a page composition.
   */
  refreshPageComposition = unary<webbffPageCompositionGatewayServiceApi.RefreshPageCompositionRequest, webbffPageCompositionGatewayServiceApi.RefreshPageCompositionResponse>(
    (request) => this.workflow.refreshPageComposition(request),
  );

  /**
   * Lists page compositions a page at a time.
   */
  searchPageCompositionCatalog = (call: ServerUnaryCall<webbffPageCompositionGatewayServiceApi.SearchPageCompositionCatalogRequest, webbffPageCompositionGatewayServiceApi.SearchPageCompositionCatalogResponse>, done: sendUnaryData<webbffPageCompositionGatewayServiceApi.SearchPageCompositionCatalogResponse>): void => {
    void this.workflow.searchPageCompositionCatalog(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts a page composition.
   */
  startPageCompositionCheckout = unary<webbffPageCompositionGatewayServiceApi.StartPageCompositionCheckoutRequest, webbffPageCompositionGatewayServiceApi.StartPageCompositionCheckoutResponse>(
    (request) => this.workflow.startPageCompositionCheckout(request),
  );

  /**
   * Streams the changes of page compositions as they happen.
   */
  streamPageCompositionUpdates = serverStream<webbffPageCompositionGatewayServiceApi.StreamPageCompositionUpdatesRequest, webbffPageCompositionGatewayServiceApi.StreamPageCompositionUpdatesResponse>(
    (request) => this.workflow.streamPageCompositionUpdates(request),
  );

  /**
   * Submits a page composition.
   */
  submitPageCompositionForm = (call: ServerUnaryCall<webbffPageCompositionGatewayServiceApi.SubmitPageCompositionFormRequest, webbffPageCompositionGatewayServiceApi.SubmitPageCompositionFormResponse>, done: sendUnaryData<webbffPageCompositionGatewayServiceApi.SubmitPageCompositionFormResponse>): void => {
    void this.workflow.submitPageCompositionForm(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Tracks a page composition.
   */
  trackPageComposition = unary<webbffPageCompositionGatewayServiceApi.TrackPageCompositionRequest, webbffPageCompositionGatewayServiceApi.TrackPageCompositionResponse>(
    (request) => this.workflow.trackPageComposition(request),
  );

  /**
   * Takes a stream of page compositions and answers once at the end.
   */
  uploadPageCompositionAttachments = clientStream<webbffPageCompositionGatewayServiceApi.UploadPageCompositionAttachmentsRequest, webbffPageCompositionGatewayServiceApi.UploadPageCompositionAttachmentsResponse>(
    (request) => this.workflow.uploadPageCompositionAttachments(request), () => webbffPageCompositionGatewayServiceApi.UploadPageCompositionAttachmentsResponse.fromPartial({}),
  );
}

export function implementation(handler: PageCompositionGatewayHandler): webbffPageCompositionGatewayServiceApi.PageCompositionGatewayServiceServer {
  return {
    composePageCompositionPage: handler.composePageCompositionPage,
    fetchPageCompositionView: handler.fetchPageCompositionView,
    getPageCompositionSummary: handler.getPageCompositionSummary,
    refreshPageComposition: handler.refreshPageComposition,
    searchPageCompositionCatalog: handler.searchPageCompositionCatalog,
    startPageCompositionCheckout: handler.startPageCompositionCheckout,
    streamPageCompositionUpdates: handler.streamPageCompositionUpdates,
    submitPageCompositionForm: handler.submitPageCompositionForm,
    trackPageComposition: handler.trackPageComposition,
    uploadPageCompositionAttachments: handler.uploadPageCompositionAttachments,
  };
}
