/**
 * Answers read-only questions about translation keys, for screens and reports.
 */

import * as localizationTranslationKeyQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { TranslationKeyQueryWorkflow } from "../application/translation-key-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranslationKeyQueryService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationKeyQueryHandler {
  constructor(@inject(TranslationKeyQueryWorkflow) private readonly workflow: TranslationKeyQueryWorkflow) {}

  /**
   * Lists translation keys a page at a time.
   */
  browseTranslationKeys = (call: ServerUnaryCall<localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysResponse>, done: sendUnaryData<localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysResponse>): void => {
    void this.workflow.browseTranslationKeys(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts translation keys by status.
   */
  countTranslationKeys = unary<localizationTranslationKeyQueryServiceApi.CountTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.CountTranslationKeysResponse>(
    (request) => this.workflow.countTranslationKeys(request),
  );

  /**
   * Streams every matching translation key.
   */
  exportTranslationKeys = serverStream<localizationTranslationKeyQueryServiceApi.ExportTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.ExportTranslationKeysResponse>(
    (request) => this.workflow.exportTranslationKeys(request),
  );

  /**
   * Lists translation keys a page at a time.
   */
  findTranslationKeys = (call: ServerUnaryCall<localizationTranslationKeyQueryServiceApi.FindTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.FindTranslationKeysResponse>, done: sendUnaryData<localizationTranslationKeyQueryServiceApi.FindTranslationKeysResponse>): void => {
    void this.workflow.findTranslationKeys(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a translation key.
   */
  lookupTranslationKey = unary<localizationTranslationKeyQueryServiceApi.LookupTranslationKeyRequest, localizationTranslationKeyQueryServiceApi.LookupTranslationKeyResponse>(
    (request) => this.workflow.lookupTranslationKey(request),
  );

  /**
   * Returns a translation key.
   */
  peekTranslationKey = unary<localizationTranslationKeyQueryServiceApi.PeekTranslationKeyRequest, localizationTranslationKeyQueryServiceApi.PeekTranslationKeyResponse>(
    (request) => this.workflow.peekTranslationKey(request),
  );

  /**
   * Returns several translation keys at once.
   */
  resolveTranslationKeys = (call: ServerUnaryCall<localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysResponse>, done: sendUnaryData<localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysResponse>): void => {
    void this.workflow.resolveTranslationKeys(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists translation keys a page at a time.
   */
  suggestTranslationKeys = unary<localizationTranslationKeyQueryServiceApi.SuggestTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.SuggestTranslationKeysResponse>(
    (request) => this.workflow.suggestTranslationKeys(request),
  );

  /**
   * Summarizes a translation key.
   */
  summarizeTranslationKeys = unary<localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysResponse>(
    (request) => this.workflow.summarizeTranslationKeys(request),
  );
}

export function implementation(handler: TranslationKeyQueryHandler): localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceServer {
  return {
    browseTranslationKeys: handler.browseTranslationKeys,
    countTranslationKeys: handler.countTranslationKeys,
    exportTranslationKeys: handler.exportTranslationKeys,
    findTranslationKeys: handler.findTranslationKeys,
    lookupTranslationKey: handler.lookupTranslationKey,
    peekTranslationKey: handler.peekTranslationKey,
    resolveTranslationKeys: handler.resolveTranslationKeys,
    suggestTranslationKeys: handler.suggestTranslationKeys,
    summarizeTranslationKeys: handler.summarizeTranslationKeys,
  };
}
