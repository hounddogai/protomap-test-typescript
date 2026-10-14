/**
 * Manages page compositions: creates, reads, changes, and lists them.
 */

import * as webbffPageCompositionServiceApi from "../../../../../.cache/proto/acme/webbff/v1/page_composition_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../../platform/handlers.js";
import { PageCompositionWorkflow } from "./page-composition.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for PageCompositionService; workflows own validation and database transactions.
 */
@injectable()
export class PageCompositionHandler {
  constructor(@inject(PageCompositionWorkflow) private readonly workflow: PageCompositionWorkflow) {}

  /**
   * Takes a stream of page compositions and answers once at the end.
   */
  batchCreatePageCompositions = clientStream<webbffPageCompositionServiceApi.BatchCreatePageCompositionsRequest, webbffPageCompositionServiceApi.BatchCreatePageCompositionsResponse>(
    (request) => this.workflow.batchCreatePageCompositions(request), () => webbffPageCompositionServiceApi.BatchCreatePageCompositionsResponse.fromPartial({}),
  );

  /**
   * Returns several page compositions at once.
   */
  batchGetPageCompositions = (call: ServerUnaryCall<webbffPageCompositionServiceApi.BatchGetPageCompositionsRequest, webbffPageCompositionServiceApi.BatchGetPageCompositionsResponse>, done: sendUnaryData<webbffPageCompositionServiceApi.BatchGetPageCompositionsResponse>): void => {
    void this.workflow.batchGetPageCompositions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Creates a page composition.
   */
  clonePageComposition = unary<webbffPageCompositionServiceApi.ClonePageCompositionRequest, webbffPageCompositionServiceApi.ClonePageCompositionResponse>(
    (request) => this.workflow.clonePageComposition(request),
  );

  /**
   * Creates a page composition.
   */
  createPageComposition = unary<webbffPageCompositionServiceApi.CreatePageCompositionRequest, webbffPageCompositionServiceApi.CreatePageCompositionResponse>(
    (request) => this.workflow.createPageComposition(request),
  );

  /**
   * Deletes a page composition.
   */
  deletePageComposition = (call: ServerUnaryCall<webbffPageCompositionServiceApi.DeletePageCompositionRequest, webbffPageCompositionServiceApi.DeletePageCompositionResponse>, done: sendUnaryData<webbffPageCompositionServiceApi.DeletePageCompositionResponse>): void => {
    void this.workflow.deletePageComposition(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a page composition.
   */
  getPageComposition = unary<webbffPageCompositionServiceApi.GetPageCompositionRequest, webbffPageCompositionServiceApi.GetPageCompositionResponse>(
    (request) => this.workflow.getPageComposition(request),
  );

  /**
   * Lists page compositions a page at a time.
   */
  listPageCompositions = unary<webbffPageCompositionServiceApi.ListPageCompositionsRequest, webbffPageCompositionServiceApi.ListPageCompositionsResponse>(
    (request) => this.workflow.listPageCompositions(request),
  );

  /**
   * Lists page compositions a page at a time.
   */
  searchPageCompositions = (call: ServerUnaryCall<webbffPageCompositionServiceApi.SearchPageCompositionsRequest, webbffPageCompositionServiceApi.SearchPageCompositionsResponse>, done: sendUnaryData<webbffPageCompositionServiceApi.SearchPageCompositionsResponse>): void => {
    void this.workflow.searchPageCompositions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Changes a page composition.
   */
  updatePageComposition = unary<webbffPageCompositionServiceApi.UpdatePageCompositionRequest, webbffPageCompositionServiceApi.UpdatePageCompositionResponse>(
    (request) => this.workflow.updatePageComposition(request),
  );

  /**
   * Streams the changes of page compositions as they happen.
   */
  watchPageCompositions = serverStream<webbffPageCompositionServiceApi.WatchPageCompositionsRequest, webbffPageCompositionServiceApi.WatchPageCompositionsResponse>(
    (request) => this.workflow.watchPageCompositions(request),
  );
}

export function implementation(handler: PageCompositionHandler): webbffPageCompositionServiceApi.PageCompositionServiceServer {
  return {
    batchCreatePageCompositions: handler.batchCreatePageCompositions,
    batchGetPageCompositions: handler.batchGetPageCompositions,
    clonePageComposition: handler.clonePageComposition,
    createPageComposition: handler.createPageComposition,
    deletePageComposition: handler.deletePageComposition,
    getPageComposition: handler.getPageComposition,
    listPageCompositions: handler.listPageCompositions,
    searchPageCompositions: handler.searchPageCompositions,
    updatePageComposition: handler.updatePageComposition,
    watchPageCompositions: handler.watchPageCompositions,
  };
}
