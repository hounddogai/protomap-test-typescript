/**
 * Manages forums: creates, reads, changes, and lists them.
 */

import * as communityForumServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../../platform/handlers.js";
import { ForumWorkflow } from "./forum.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ForumService; workflows own validation and database transactions.
 */
@injectable()
export class ForumHandler {
  constructor(@inject(ForumWorkflow) private readonly workflow: ForumWorkflow) {}

  /**
   * Takes a stream of forums and answers once at the end.
   */
  batchCreateForums = clientStream<communityForumServiceApi.BatchCreateForumsRequest, communityForumServiceApi.BatchCreateForumsResponse>(
    (request) => this.workflow.batchCreateForums(request), () => communityForumServiceApi.BatchCreateForumsResponse.fromPartial({}),
  );

  /**
   * Creates a forum.
   */
  cloneForum = (call: ServerUnaryCall<communityForumServiceApi.CloneForumRequest, communityForumServiceApi.CloneForumResponse>, done: sendUnaryData<communityForumServiceApi.CloneForumResponse>): void => {
    void this.workflow.cloneForum(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Creates a forum.
   */
  createForum = unary<communityForumServiceApi.CreateForumRequest, communityForumServiceApi.CreateForumResponse>(
    (request) => this.workflow.createForum(request),
  );

  /**
   * Deletes a forum.
   */
  deleteForum = unary<communityForumServiceApi.DeleteForumRequest, communityForumServiceApi.DeleteForumResponse>(
    (request) => this.workflow.deleteForum(request),
  );

  /**
   * Returns a forum.
   */
  getForum = (call: ServerUnaryCall<communityForumServiceApi.GetForumRequest, communityForumServiceApi.GetForumResponse>, done: sendUnaryData<communityForumServiceApi.GetForumResponse>): void => {
    void this.workflow.getForum(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists forums a page at a time.
   */
  listForums = unary<communityForumServiceApi.ListForumsRequest, communityForumServiceApi.ListForumsResponse>(
    (request) => this.workflow.listForums(request),
  );

  /**
   * Lists forums a page at a time.
   */
  searchForums = unary<communityForumServiceApi.SearchForumsRequest, communityForumServiceApi.SearchForumsResponse>(
    (request) => this.workflow.searchForums(request),
  );

  /**
   * Changes a forum.
   */
  updateForum = (call: ServerUnaryCall<communityForumServiceApi.UpdateForumRequest, communityForumServiceApi.UpdateForumResponse>, done: sendUnaryData<communityForumServiceApi.UpdateForumResponse>): void => {
    void this.workflow.updateForum(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of forums as they happen.
   */
  watchForums = serverStream<communityForumServiceApi.WatchForumsRequest, communityForumServiceApi.WatchForumsResponse>(
    (request) => this.workflow.watchForums(request),
  );
}

export function implementation(handler: ForumHandler): communityForumServiceApi.ForumServiceServer {
  return {
    batchCreateForums: handler.batchCreateForums,
    cloneForum: handler.cloneForum,
    createForum: handler.createForum,
    deleteForum: handler.deleteForum,
    getForum: handler.getForum,
    listForums: handler.listForums,
    searchForums: handler.searchForums,
    updateForum: handler.updateForum,
    watchForums: handler.watchForums,
  };
}
