/**
 * Answers read-only questions about variants, for screens and reports.
 */

import * as experimentsVariantQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { VariantQueryWorkflow } from "../application/variant-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for VariantQueryService; workflows own validation and database transactions.
 */
@injectable()
export class VariantQueryHandler {
  constructor(@inject(VariantQueryWorkflow) private readonly workflow: VariantQueryWorkflow) {}

  /**
   * Lists variants a page at a time.
   */
  browseVariants = (call: ServerUnaryCall<experimentsVariantQueryServiceApi.BrowseVariantsRequest, experimentsVariantQueryServiceApi.BrowseVariantsResponse>, done: sendUnaryData<experimentsVariantQueryServiceApi.BrowseVariantsResponse>): void => {
    void this.workflow.browseVariants(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts variants by status.
   */
  countVariants = unary<experimentsVariantQueryServiceApi.CountVariantsRequest, experimentsVariantQueryServiceApi.CountVariantsResponse>(
    (request) => this.workflow.countVariants(request),
  );

  /**
   * Streams every matching variant.
   */
  exportVariants = serverStream<experimentsVariantQueryServiceApi.ExportVariantsRequest, experimentsVariantQueryServiceApi.ExportVariantsResponse>(
    (request) => this.workflow.exportVariants(request),
  );

  /**
   * Lists variants a page at a time.
   */
  findVariants = (call: ServerUnaryCall<experimentsVariantQueryServiceApi.FindVariantsRequest, experimentsVariantQueryServiceApi.FindVariantsResponse>, done: sendUnaryData<experimentsVariantQueryServiceApi.FindVariantsResponse>): void => {
    void this.workflow.findVariants(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a variant.
   */
  lookupVariant = unary<experimentsVariantQueryServiceApi.LookupVariantRequest, experimentsVariantQueryServiceApi.LookupVariantResponse>(
    (request) => this.workflow.lookupVariant(request),
  );

  /**
   * Returns a variant.
   */
  peekVariant = unary<experimentsVariantQueryServiceApi.PeekVariantRequest, experimentsVariantQueryServiceApi.PeekVariantResponse>(
    (request) => this.workflow.peekVariant(request),
  );

  /**
   * Returns several variants at once.
   */
  resolveVariants = (call: ServerUnaryCall<experimentsVariantQueryServiceApi.ResolveVariantsRequest, experimentsVariantQueryServiceApi.ResolveVariantsResponse>, done: sendUnaryData<experimentsVariantQueryServiceApi.ResolveVariantsResponse>): void => {
    void this.workflow.resolveVariants(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists variants a page at a time.
   */
  suggestVariants = unary<experimentsVariantQueryServiceApi.SuggestVariantsRequest, experimentsVariantQueryServiceApi.SuggestVariantsResponse>(
    (request) => this.workflow.suggestVariants(request),
  );

  /**
   * Summarizes a variant.
   */
  summarizeVariants = unary<experimentsVariantQueryServiceApi.SummarizeVariantsRequest, experimentsVariantQueryServiceApi.SummarizeVariantsResponse>(
    (request) => this.workflow.summarizeVariants(request),
  );
}

export function implementation(handler: VariantQueryHandler): experimentsVariantQueryServiceApi.VariantQueryServiceServer {
  return {
    browseVariants: handler.browseVariants,
    countVariants: handler.countVariants,
    exportVariants: handler.exportVariants,
    findVariants: handler.findVariants,
    lookupVariant: handler.lookupVariant,
    peekVariant: handler.peekVariant,
    resolveVariants: handler.resolveVariants,
    suggestVariants: handler.suggestVariants,
    summarizeVariants: handler.summarizeVariants,
  };
}
