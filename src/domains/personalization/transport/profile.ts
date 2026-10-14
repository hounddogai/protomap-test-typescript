/**
 * Manages profiles: creates, reads, changes, and lists them.
 */

import * as personalizationProfileServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import { serviceError } from "../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../platform/handlers.js";
import { ProfileWorkflow } from "../application/profile.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ProfileService; workflows own validation and database transactions.
 */
@injectable()
export class ProfileHandler {
  constructor(@inject(ProfileWorkflow) private readonly workflow: ProfileWorkflow) {}

  /**
   * Takes a stream of profiles and answers once at the end.
   */
  batchCreateProfiles = clientStream<personalizationProfileServiceApi.BatchCreateProfilesRequest, personalizationProfileServiceApi.BatchCreateProfilesResponse>(
    (request) => this.workflow.batchCreateProfiles(request), () => personalizationProfileServiceApi.BatchCreateProfilesResponse.fromPartial({}),
  );

  /**
   * Returns several profiles at once.
   */
  batchGetProfiles = unary<personalizationProfileServiceApi.BatchGetProfilesRequest, personalizationProfileServiceApi.BatchGetProfilesResponse>(
    (request) => this.workflow.batchGetProfiles(request),
  );

  /**
   * Creates a profile.
   */
  cloneProfile = unary<personalizationProfileServiceApi.CloneProfileRequest, personalizationProfileServiceApi.CloneProfileResponse>(
    (request) => this.workflow.cloneProfile(request),
  );

  /**
   * Creates a profile.
   */
  createProfile = (call: ServerUnaryCall<personalizationProfileServiceApi.CreateProfileRequest, personalizationProfileServiceApi.CreateProfileResponse>, done: sendUnaryData<personalizationProfileServiceApi.CreateProfileResponse>): void => {
    void this.workflow.createProfile(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Deletes a profile.
   */
  deleteProfile = unary<personalizationProfileServiceApi.DeleteProfileRequest, personalizationProfileServiceApi.DeleteProfileResponse>(
    (request) => this.workflow.deleteProfile(request),
  );

  /**
   * Returns a profile.
   */
  getProfile = unary<personalizationProfileServiceApi.GetProfileRequest, personalizationProfileServiceApi.GetProfileResponse>(
    (request) => this.workflow.getProfile(request),
  );

  /**
   * Lists profiles a page at a time.
   */
  listProfiles = (call: ServerUnaryCall<personalizationProfileServiceApi.ListProfilesRequest, personalizationProfileServiceApi.ListProfilesResponse>, done: sendUnaryData<personalizationProfileServiceApi.ListProfilesResponse>): void => {
    void this.workflow.listProfiles(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists profiles a page at a time.
   */
  searchProfiles = unary<personalizationProfileServiceApi.SearchProfilesRequest, personalizationProfileServiceApi.SearchProfilesResponse>(
    (request) => this.workflow.searchProfiles(request),
  );

  /**
   * Changes a profile.
   */
  updateProfile = unary<personalizationProfileServiceApi.UpdateProfileRequest, personalizationProfileServiceApi.UpdateProfileResponse>(
    (request) => this.workflow.updateProfile(request),
  );

  /**
   * Streams the changes of profiles as they happen.
   */
  watchProfiles = serverStream<personalizationProfileServiceApi.WatchProfilesRequest, personalizationProfileServiceApi.WatchProfilesResponse>(
    (request) => this.workflow.watchProfiles(request),
  );
}

export function implementation(handler: ProfileHandler): personalizationProfileServiceApi.ProfileServiceServer {
  return {
    batchCreateProfiles: handler.batchCreateProfiles,
    batchGetProfiles: handler.batchGetProfiles,
    cloneProfile: handler.cloneProfile,
    createProfile: handler.createProfile,
    deleteProfile: handler.deleteProfile,
    getProfile: handler.getProfile,
    listProfiles: handler.listProfiles,
    searchProfiles: handler.searchProfiles,
    updateProfile: handler.updateProfile,
    watchProfiles: handler.watchProfiles,
  };
}
