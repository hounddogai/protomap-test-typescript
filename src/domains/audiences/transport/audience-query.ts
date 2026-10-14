/**
 * Answers read-only questions about audiences, for screens and reports.
 */

import * as audiencesAudienceQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { AudienceQueryWorkflow } from "../application/audience-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AudienceQueryService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceQueryHandler {
  constructor(@inject(AudienceQueryWorkflow) private readonly workflow: AudienceQueryWorkflow) {}

  /**
   * Lists audiences a page at a time.
   */
  browseAudiences = (call: ServerUnaryCall<audiencesAudienceQueryServiceApi.BrowseAudiencesRequest, audiencesAudienceQueryServiceApi.BrowseAudiencesResponse>, done: sendUnaryData<audiencesAudienceQueryServiceApi.BrowseAudiencesResponse>): void => {
    void this.workflow.browseAudiences(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts audiences by status.
   */
  countAudiences = unary<audiencesAudienceQueryServiceApi.CountAudiencesRequest, audiencesAudienceQueryServiceApi.CountAudiencesResponse>(
    (request) => this.workflow.countAudiences(request),
  );

  /**
   * Streams every matching audience.
   */
  exportAudiences = serverStream<audiencesAudienceQueryServiceApi.ExportAudiencesRequest, audiencesAudienceQueryServiceApi.ExportAudiencesResponse>(
    (request) => this.workflow.exportAudiences(request),
  );

  /**
   * Returns an audience.
   */
  lookupAudience = (call: ServerUnaryCall<audiencesAudienceQueryServiceApi.LookupAudienceRequest, audiencesAudienceQueryServiceApi.LookupAudienceResponse>, done: sendUnaryData<audiencesAudienceQueryServiceApi.LookupAudienceResponse>): void => {
    void this.workflow.lookupAudience(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an audience.
   */
  peekAudience = unary<audiencesAudienceQueryServiceApi.PeekAudienceRequest, audiencesAudienceQueryServiceApi.PeekAudienceResponse>(
    (request) => this.workflow.peekAudience(request),
  );

  /**
   * Returns several audiences at once.
   */
  resolveAudiences = unary<audiencesAudienceQueryServiceApi.ResolveAudiencesRequest, audiencesAudienceQueryServiceApi.ResolveAudiencesResponse>(
    (request) => this.workflow.resolveAudiences(request),
  );

  /**
   * Lists audiences a page at a time.
   */
  suggestAudiences = (call: ServerUnaryCall<audiencesAudienceQueryServiceApi.SuggestAudiencesRequest, audiencesAudienceQueryServiceApi.SuggestAudiencesResponse>, done: sendUnaryData<audiencesAudienceQueryServiceApi.SuggestAudiencesResponse>): void => {
    void this.workflow.suggestAudiences(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: AudienceQueryHandler): audiencesAudienceQueryServiceApi.AudienceQueryServiceServer {
  return {
    browseAudiences: handler.browseAudiences,
    countAudiences: handler.countAudiences,
    exportAudiences: handler.exportAudiences,
    lookupAudience: handler.lookupAudience,
    peekAudience: handler.peekAudience,
    resolveAudiences: handler.resolveAudiences,
    suggestAudiences: handler.suggestAudiences,
  };
}
