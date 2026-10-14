/**
 * Keeps affinities in step with the systems of record in other regions. Remote work stays behind typed client ports.
 */

import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as communityModerationApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as personalizationProfileServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { duplex, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, type Unary } from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toAffinityRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate affinity operations and persist audit data.
 */
@injectable()
export class AffinitySyncWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileService") private readonly personalizationProfileClient: personalizationProfileServiceApi.ProfileServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns an affinity.
   */
  async getAffinitySyncState(req: personalizationAffinitySyncServiceApi.GetAffinitySyncStateRequest): Promise<personalizationAffinitySyncServiceApi.GetAffinitySyncStateResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAffinitySyncState", req);
    this.logger.info("get_affinity_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationApprovalServiceApi.ListPendingModerationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.affinityId ?? ""),
      },
    });
    const proxy1 = forwarding(this.communityModerationApprovalClient);
    const invoke1: Unary<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse> =
      (input, done) => proxy1.listPendingModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse>(invoke1, request1);
    return mergeResponses(
      personalizationAffinitySyncServiceApi.GetAffinitySyncStateResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      personalizationAffinitySyncServiceApi.GetAffinitySyncStateResponse.fromPartial({ affinity: { affinityId: (req?.affinityId ?? "") } }),
    );
  }

  /**
   * Lists affinities a page at a time.
   */
  async listAffinityConflicts(req: personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest): Promise<personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListAffinityConflicts", req);
    this.logger.info("list_affinity_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse.fromPartial({});
  }

  /**
   * Pulls an affinity.
   */
  async pullAffinities(req: personalizationAffinitySyncServiceApi.PullAffinitiesRequest): Promise<personalizationAffinitySyncServiceApi.PullAffinitiesResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "PullAffinities", req);
    this.logger.info("pull_affinities", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileReportingServiceApi.ListProfileReportsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.affinity?.occurredAt },
    });
    const invoke1: Unary<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse> =
      (input, done) => this.personalizationProfileReportingClient.listProfileReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinitySyncServiceApi.PullAffinitiesResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      personalizationAffinitySyncServiceApi.PullAffinitiesResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          correlationId: (req?.affinity?.correlationId ?? ""),
        },
      }),
    );
  }

  /**
   * Pushs an affinity.
   */
  async pushAffinity(req: personalizationAffinitySyncServiceApi.PushAffinityRequest): Promise<personalizationAffinitySyncServiceApi.PushAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "PushAffinity", req);
    this.logger.info("push_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileServiceApi.WatchProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.affinity?.occurredAt,
        ownerId: (req?.affinity?.subject?.recommendationId ?? ""),
      },
      subscriber: { email: (req?.context?.actor?.email ?? "") },
    });
    const stream1 = this.personalizationProfileClient.watchProfiles(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? personalizationProfileServiceApi.WatchProfilesResponse.fromPartial({});
    const request2 = notificationsNotificationSyncServiceApi.StreamNotificationChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        assignee: {
          displayName: (req?.affinity?.subject?.displayName ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        subject: (req?.affinity?.affinityId ?? ""),
      } },
      context: req?.context,
    });
    const stream2 = this.notificationsNotificationSyncClient.streamNotificationChanges(metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const reading2 = collect(stream2);
    const writing2 = (async () => {
      await write(stream2, request2);
      stream2.end();
    })();
    const [messages2] = await Promise.all([reading2, writing2]);
    const reply2 = messages2.at(-1) ?? notificationsNotificationSyncServiceApi.StreamNotificationChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return personalizationAffinitySyncServiceApi.PushAffinityResponse.fromPartial({
      affinity: {
        affinityId: (req?.affinityId ?? ""),
        correlationId: (req?.affinity?.correlationId ?? ""),
      },
    });
  }

  /**
   * Reconciles an affinity.
   */
  async reconcileAffinities(req: personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest): Promise<personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "ReconcileAffinities", req);
    this.logger.info("reconcile_affinities", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.affinity?.measurements ?? []).map(async (item) => {
      const request1 = personalizationAffinityCalculationServiceApi.EstimateAffinityRequest.fromPartial({
        affinity: {
          measurements: [{
            observedAt: item?.observedAt,
            unit: (item?.unit ?? ""),
          }],
        },
        context: req?.context,
      });
      const invoke1: Unary<personalizationAffinityCalculationServiceApi.EstimateAffinityRequest, personalizationAffinityCalculationServiceApi.EstimateAffinityResponse> =
        (input, done) => this.personalizationAffinityCalculationClient.estimateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<personalizationAffinityCalculationServiceApi.EstimateAffinityRequest, personalizationAffinityCalculationServiceApi.EstimateAffinityResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? personalizationAffinityCalculationServiceApi.EstimateAffinityResponse.fromPartial({});
    const request2 = personalizationProfileReportingServiceApi.ListProfileReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.affinity?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.affinity?.attributes ?? {}))),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse> =
      (input, done) => this.personalizationProfileReportingClient.listProfileReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse.fromPartial({ affinity: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          sequence: (req?.affinity?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Exchanges changes of affinities with a peer.
   */
  async streamAffinityChanges(req: personalizationAffinitySyncServiceApi.StreamAffinityChangesRequest): Promise<personalizationAffinitySyncServiceApi.StreamAffinityChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamAffinityChanges", req);
    this.logger.info("stream_affinity_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled(((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.measurements ?? []).map(async (item) => {
      const request1 = personalizationProfileReportingServiceApi.ListProfileReportsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.observedAt,
          labels: Object.fromEntries(Object.entries(((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.attributes ?? {}))),
          ownerId: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.affinityId ?? ""),
        },
      });
      const invoke1: Unary<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse> =
        (input, done) => this.personalizationProfileReportingClient.listProfileReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: personalizationProfileReportingServiceApi.ListProfileReportsResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? personalizationProfileReportingServiceApi.ListProfileReportsResponse.fromPartial({});
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = communityForumWorkflowServiceApi.StartForumWorkflowRequest.fromPartial({
      context: input2?.context,
      forum: {
        children: [{
          children: [{
            children: [{
              attributes: Object.fromEntries(Object.entries(((input2?.frame?.$case === "change" ? input2?.frame.change : undefined)?.attributes ?? {}))),
            }],
            manager: {
              displayName: ((input2?.frame?.$case === "change" ? input2?.frame.change : undefined)?.subject?.displayName ?? ""),
              email: (input2?.context?.actor?.email ?? ""),
            },
          }],
        }],
      },
    });
    const invoke2: Unary<communityForumWorkflowServiceApi.StartForumWorkflowRequest, communityForumWorkflowServiceApi.StartForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.startForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumWorkflowServiceApi.StartForumWorkflowRequest, communityForumWorkflowServiceApi.StartForumWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      personalizationAffinitySyncServiceApi.StreamAffinityChangesResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      personalizationAffinitySyncServiceApi.StreamAffinityChangesResponse.fromPartial({
        affinity: {
          source: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.source ?? ""),
        },
        sequence: ((req?.frame?.$case === "ack" ? req?.frame.ack : undefined)?.sequence ?? 0),
      }),
    );
  }

  /**
   * Syncs an affinity.
   */
  async syncAffinities(req: personalizationAffinitySyncServiceApi.SyncAffinitiesRequest): Promise<personalizationAffinitySyncServiceApi.SyncAffinitiesResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "SyncAffinities", req);
    this.logger.info("sync_affinities", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.EstimateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        identityDocument: { $case: "nationalId", nationalId: { number: (req?.affinity?.subject?.number ?? "") } },
      },
    });
    const cloned1: personalizationProfileCalculationServiceApi.EstimateProfileRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<personalizationProfileCalculationServiceApi.EstimateProfileRequest, personalizationProfileCalculationServiceApi.EstimateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.estimateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.EstimateProfileRequest, personalizationProfileCalculationServiceApi.EstimateProfileResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinitySyncServiceApi.SyncAffinitiesResponse.fromPartial({
        affinity: {
          subject: {
            number: ((reply1?.profile?.identityDocument?.$case === "passport" ? reply1?.profile?.identityDocument.passport : undefined)?.number ?? ""),
          },
        },
      }),
      personalizationAffinitySyncServiceApi.SyncAffinitiesResponse.fromPartial({
        affinity: { affinityId: (req?.affinityId ?? "") },
        result: { correlationId: (req?.affinity?.correlationId ?? "") },
      }),
    );
  }
}

/**
 * The gRPC boundary for AffinitySyncService; workflows own validation and database transactions.
 */
@injectable()
export class AffinitySyncHandler {
  constructor(@inject(AffinitySyncWorkflow) private readonly workflow: AffinitySyncWorkflow) {}

  /**
   * Returns an affinity.
   */
  getAffinitySyncState = unary<personalizationAffinitySyncServiceApi.GetAffinitySyncStateRequest, personalizationAffinitySyncServiceApi.GetAffinitySyncStateResponse>(
    (request) => this.workflow.getAffinitySyncState(request),
  );

  /**
   * Lists affinities a page at a time.
   */
  listAffinityConflicts = unary<personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest, personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse>(
    (request) => this.workflow.listAffinityConflicts(request),
  );

  /**
   * Pulls an affinity.
   */
  pullAffinities = (call: ServerUnaryCall<personalizationAffinitySyncServiceApi.PullAffinitiesRequest, personalizationAffinitySyncServiceApi.PullAffinitiesResponse>, done: sendUnaryData<personalizationAffinitySyncServiceApi.PullAffinitiesResponse>): void => {
    void this.workflow.pullAffinities(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pushs an affinity.
   */
  pushAffinity = unary<personalizationAffinitySyncServiceApi.PushAffinityRequest, personalizationAffinitySyncServiceApi.PushAffinityResponse>(
    (request) => this.workflow.pushAffinity(request),
  );

  /**
   * Reconciles an affinity.
   */
  reconcileAffinities = unary<personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest, personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse>(
    (request) => this.workflow.reconcileAffinities(request),
  );

  /**
   * Exchanges changes of affinities with a peer.
   */
  streamAffinityChanges = duplex<personalizationAffinitySyncServiceApi.StreamAffinityChangesRequest, personalizationAffinitySyncServiceApi.StreamAffinityChangesResponse>(
    (request) => this.workflow.streamAffinityChanges(request),
  );

  /**
   * Syncs an affinity.
   */
  syncAffinities = unary<personalizationAffinitySyncServiceApi.SyncAffinitiesRequest, personalizationAffinitySyncServiceApi.SyncAffinitiesResponse>(
    (request) => this.workflow.syncAffinities(request),
  );
}

export function implementation(handler: AffinitySyncHandler): personalizationAffinitySyncServiceApi.AffinitySyncServiceServer {
  return {
    getAffinitySyncState: handler.getAffinitySyncState,
    listAffinityConflicts: handler.listAffinityConflicts,
    pullAffinities: handler.pullAffinities,
    pushAffinity: handler.pushAffinity,
    reconcileAffinities: handler.reconcileAffinities,
    streamAffinityChanges: handler.streamAffinityChanges,
    syncAffinities: handler.syncAffinities,
  };
}
