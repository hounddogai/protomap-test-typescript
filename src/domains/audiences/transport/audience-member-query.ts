/**
 * Answers read-only questions about audience members, for screens and reports.
 */

import * as audiencesAudienceMemberQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { AudienceMemberQueryWorkflow } from "../application/audience-member-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AudienceMemberQueryService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceMemberQueryHandler {
  constructor(@inject(AudienceMemberQueryWorkflow) private readonly workflow: AudienceMemberQueryWorkflow) {}

  /**
   * Lists audience members a page at a time.
   */
  browseAudienceMembers = (call: ServerUnaryCall<audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersResponse>, done: sendUnaryData<audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersResponse>): void => {
    void this.workflow.browseAudienceMembers(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts audience members by status.
   */
  countAudienceMembers = unary<audiencesAudienceMemberQueryServiceApi.CountAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.CountAudienceMembersResponse>(
    (request) => this.workflow.countAudienceMembers(request),
  );

  /**
   * Streams every matching audience member.
   */
  exportAudienceMembers = serverStream<audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse>(
    (request) => this.workflow.exportAudienceMembers(request),
  );

  /**
   * Lists audience members a page at a time.
   */
  findAudienceMembers = (call: ServerUnaryCall<audiencesAudienceMemberQueryServiceApi.FindAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.FindAudienceMembersResponse>, done: sendUnaryData<audiencesAudienceMemberQueryServiceApi.FindAudienceMembersResponse>): void => {
    void this.workflow.findAudienceMembers(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an audience member.
   */
  lookupAudienceMember = unary<audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberRequest, audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberResponse>(
    (request) => this.workflow.lookupAudienceMember(request),
  );

  /**
   * Returns an audience member.
   */
  peekAudienceMember = unary<audiencesAudienceMemberQueryServiceApi.PeekAudienceMemberRequest, audiencesAudienceMemberQueryServiceApi.PeekAudienceMemberResponse>(
    (request) => this.workflow.peekAudienceMember(request),
  );

  /**
   * Returns several audience members at once.
   */
  resolveAudienceMembers = (call: ServerUnaryCall<audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse>, done: sendUnaryData<audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse>): void => {
    void this.workflow.resolveAudienceMembers(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists audience members a page at a time.
   */
  suggestAudienceMembers = unary<audiencesAudienceMemberQueryServiceApi.SuggestAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.SuggestAudienceMembersResponse>(
    (request) => this.workflow.suggestAudienceMembers(request),
  );

  /**
   * Summarizes an audience member.
   */
  summarizeAudienceMembers = unary<audiencesAudienceMemberQueryServiceApi.SummarizeAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.SummarizeAudienceMembersResponse>(
    (request) => this.workflow.summarizeAudienceMembers(request),
  );
}

export function implementation(handler: AudienceMemberQueryHandler): audiencesAudienceMemberQueryServiceApi.AudienceMemberQueryServiceServer {
  return {
    browseAudienceMembers: handler.browseAudienceMembers,
    countAudienceMembers: handler.countAudienceMembers,
    exportAudienceMembers: handler.exportAudienceMembers,
    findAudienceMembers: handler.findAudienceMembers,
    lookupAudienceMember: handler.lookupAudienceMember,
    peekAudienceMember: handler.peekAudienceMember,
    resolveAudienceMembers: handler.resolveAudienceMembers,
    suggestAudienceMembers: handler.suggestAudienceMembers,
    summarizeAudienceMembers: handler.summarizeAudienceMembers,
  };
}
