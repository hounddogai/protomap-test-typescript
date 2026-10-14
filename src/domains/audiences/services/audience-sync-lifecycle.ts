/**
 * Moves an audience sync between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as anomaliesAnomalyServiceApi from "../../../../.cache/proto/acme/anomalies/v1/anomaly_service.js";
import * as audiencesAudienceMemberQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_query_service.js";
import * as audiencesAudienceMemberValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as audiencesAudienceQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import * as audiencesAudienceServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as audiencesAudienceSyncLifecycleServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_lifecycle_service.js";
import * as audiencesAudienceSyncValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as collectionsCollectionCaseQueryServiceApi from "../../../../.cache/proto/acme/collections/v1/collection_case_query_service.js";
import * as documentsDocumentValidationServiceApi from "../../../../.cache/proto/acme/documents/v1/document_validation_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as mediaTranscodeJobWorkflowServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_workflow_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toAudienceSyncRecord } from "../data/records.js";
import { AudiencesRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience sync operations and persist audit data.
 */
@injectable()
export class AudienceSyncLifecycleWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.anomalies.v1.AnomalyService") private readonly anomaliesAnomalyClient: anomaliesAnomalyServiceApi.AnomalyServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberQueryService") private readonly audiencesAudienceMemberQueryClient: audiencesAudienceMemberQueryServiceApi.AudienceMemberQueryServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberValidationService") private readonly audiencesAudienceMemberValidationClient: audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceQueryService") private readonly audiencesAudienceQueryClient: audiencesAudienceQueryServiceApi.AudienceQueryServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceService") private readonly audiencesAudienceClient: audiencesAudienceServiceApi.AudienceServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncValidationService") private readonly audiencesAudienceSyncValidationClient: audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceValidationService") private readonly audiencesAudienceValidationClient: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient,
    @inject("grpc:acme.collections.v1.CollectionCaseQueryService") private readonly collectionsCollectionCaseQueryClient: collectionsCollectionCaseQueryServiceApi.CollectionCaseQueryServiceClient,
    @inject("grpc:acme.documents.v1.DocumentValidationService") private readonly documentsDocumentValidationClient: documentsDocumentValidationServiceApi.DocumentValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobWorkflowService") private readonly mediaTranscodeJobWorkflowClient: mediaTranscodeJobWorkflowServiceApi.TranscodeJobWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityApprovalService") private readonly personalizationAffinityApprovalClient: personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates an audience sync.
   */
  async activateAudienceSync(req: audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncRequest): Promise<audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncResponse> {
    validateContext(req.context);
    if (!req.audienceSyncId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_sync_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateAudienceSync", req);
    this.logger.info("activate_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceValidationServiceApi.PreviewAudienceRequest.fromPartial({
      audience: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
        },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notifyContact?.email ?? ""),
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.previewAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = documentsDocumentValidationServiceApi.ValidateDocumentRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      document: {
        counterparty: { displayName: (reply1?.audience?.owner?.displayName ?? "") },
        lines: [{
          amount: (reply1?.audience?.action?.$case === "discount" ? reply1?.audience?.action.discount : undefined)?.amount,
        }],
      },
    });
    const method2 = "validateDocument" as const;
    const invoke2: Unary<documentsDocumentValidationServiceApi.ValidateDocumentRequest, documentsDocumentValidationServiceApi.ValidateDocumentResponse> =
      (input, done) => this.documentsDocumentValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<documentsDocumentValidationServiceApi.ValidateDocumentRequest, documentsDocumentValidationServiceApi.ValidateDocumentResponse>(invoke2, request2);
    const request3 = audiencesAudienceValidationServiceApi.ValidateAudienceRequest.fromPartial({
      audience: {
        audit: {
          createdAt: reply2?.document?.audit?.createdAt,
          createdBy: (reply1?.audience?.audit?.createdBy ?? ""),
        },
        owner: { displayName: (reply2?.document?.counterparty?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.details?.notifyContact?.email ?? "") } },
    });
    const proxy3 = forwarding(this.audiencesAudienceValidationClient);
    const invoke3: Unary<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse> =
      (input, done) => proxy3.validateAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncResponse.fromPartial({
        audienceSync: {
          subject: { displayName: (reply1?.audience?.owner?.displayName ?? "") },
        },
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
      }),
      audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncResponse.fromPartial({
        audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires an audience sync.
   */
  async expireAudienceSync(req: audiencesAudienceSyncLifecycleServiceApi.ExpireAudienceSyncRequest): Promise<audiencesAudienceSyncLifecycleServiceApi.ExpireAudienceSyncResponse> {
    validateContext(req.context);
    if (!req.audienceSyncId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_sync_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireAudienceSync", req);
    this.logger.info("expire_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.CreateUserRequest.fromPartial({
      context: req?.context,
      user: {
        contact: {
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
        relationshipManager: { email: (req?.details?.newOwner?.email ?? "") },
        userId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke1: Unary<identityUserServiceApi.CreateUserRequest, identityUserServiceApi.CreateUserResponse> =
      (input, done) => this.identityUserClient.createUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserServiceApi.CreateUserRequest, identityUserServiceApi.CreateUserResponse>(invoke1, request1);
    const request2 = notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { displayName: (reply1?.user?.relationshipManager?.displayName ?? "") },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.compareNotificationVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncLifecycleServiceApi.ExpireAudienceSyncResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      audiencesAudienceSyncLifecycleServiceApi.ExpireAudienceSyncResponse.fromPartial({ outcome: { effectiveAt: reply2?.outcome?.effectiveAt } }),
      audiencesAudienceSyncLifecycleServiceApi.ExpireAudienceSyncResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          subject: { email: (req?.details?.notifyContact?.email ?? "") },
        },
      }),
    );
  }

  /**
   * Returns an audience sync.
   */
  async getAudienceSyncLifecycle(req: audiencesAudienceSyncLifecycleServiceApi.GetAudienceSyncLifecycleRequest): Promise<audiencesAudienceSyncLifecycleServiceApi.GetAudienceSyncLifecycleResponse> {
    validateContext(req.context);
    if (!req.audienceSyncId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_sync_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAudienceSyncLifecycle", req);
    this.logger.info("get_audience_sync_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.context?.deadline,
        labels: Object.fromEntries(Object.entries((input1?.context?.baggage ?? {}))),
        ownerId: (input1?.audienceSyncId ?? ""),
      },
    });
    const invoke1: Unary<audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersResponse> =
      (input, done) => this.audiencesAudienceMemberQueryClient.browseAudienceMembers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.BrowseAudienceMembersResponse>(invoke1, request1);
    const request2 = anomaliesAnomalyServiceApi.BatchGetAnomaliesRequest.fromPartial({ context: req?.context });
    const cloned2: anomaliesAnomalyServiceApi.BatchGetAnomaliesRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<anomaliesAnomalyServiceApi.BatchGetAnomaliesRequest, anomaliesAnomalyServiceApi.BatchGetAnomaliesResponse> =
      (input, done) => this.anomaliesAnomalyClient.batchGetAnomalies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<anomaliesAnomalyServiceApi.BatchGetAnomaliesRequest, anomaliesAnomalyServiceApi.BatchGetAnomaliesResponse>(invoke2, cloned2);
    return mergeResponses(
      audiencesAudienceSyncLifecycleServiceApi.GetAudienceSyncLifecycleResponse.fromPartial({
        audienceSync: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      audiencesAudienceSyncLifecycleServiceApi.GetAudienceSyncLifecycleResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      audiencesAudienceSyncLifecycleServiceApi.GetAudienceSyncLifecycleResponse.fromPartial({ audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") } }),
    );
  }

  /**
   * Reinstates an audience sync.
   */
  async reinstateAudienceSync(req: audiencesAudienceSyncLifecycleServiceApi.ReinstateAudienceSyncRequest): Promise<audiencesAudienceSyncLifecycleServiceApi.ReinstateAudienceSyncResponse> {
    validateContext(req.context);
    if (!req.audienceSyncId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_sync_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateAudienceSync", req);
    this.logger.info("reinstate_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceValidationServiceApi.PreviewAudienceRequest.fromPartial({
      audience: {
        action: { $case: "block", block: { notifyEmail: (req?.details?.newOwner?.email ?? "") } },
        owner: {
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { phone: (req?.details?.notifyContact?.phone ?? "") } },
    });
    const decoded1 = audiencesAudienceValidationServiceApi.PreviewAudienceRequest.fromJSON(
      JSON.parse(JSON.stringify(audiencesAudienceValidationServiceApi.PreviewAudienceRequest.toJSON(request1))),
    );
    const invoke1: Unary<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.previewAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse>(invoke1, decoded1);
    const request2 = collectionsCollectionCaseQueryServiceApi.BrowseCollectionCasesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.collections.v1.BrowseCollectionCasesRequest",
      value: Buffer.from(collectionsCollectionCaseQueryServiceApi.BrowseCollectionCasesRequest.encode(request2).finish()),
    });
    const unpacked2 = collectionsCollectionCaseQueryServiceApi.BrowseCollectionCasesRequest.decode(envelope2.value);
    const invoke2: Unary<collectionsCollectionCaseQueryServiceApi.BrowseCollectionCasesRequest, collectionsCollectionCaseQueryServiceApi.BrowseCollectionCasesResponse> =
      (input, done) => this.collectionsCollectionCaseQueryClient.browseCollectionCases(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<collectionsCollectionCaseQueryServiceApi.BrowseCollectionCasesRequest, collectionsCollectionCaseQueryServiceApi.BrowseCollectionCasesResponse>(invoke2, unpacked2);
    const request3 = audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.outcome?.effectiveAt,
        ownerId: (reply1?.result?.correlationId ?? ""),
      },
    });
    const stream3 = this.audiencesAudienceMemberQueryClient.exportAudienceMembers(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncLifecycleServiceApi.ReinstateAudienceSyncResponse.fromPartial({
        outcome: { message: (reply1?.outcome?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      audiencesAudienceSyncLifecycleServiceApi.ReinstateAudienceSyncResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      audiencesAudienceSyncLifecycleServiceApi.ReinstateAudienceSyncResponse.fromPartial({
        audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews an audience sync.
   */
  async renewAudienceSync(req: audiencesAudienceSyncLifecycleServiceApi.RenewAudienceSyncRequest): Promise<audiencesAudienceSyncLifecycleServiceApi.RenewAudienceSyncResponse> {
    validateContext(req.context);
    if (!req.audienceSyncId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_sync_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewAudienceSync", req);
    this.logger.info("renew_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityApprovalServiceApi.RejectAffinityRequest.fromPartial({
      affinity: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      context: req?.context,
    });
    const client1 = this.clients.get<personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient>("acme.personalization.v1.AffinityApprovalService");
    const invoke1: Unary<personalizationAffinityApprovalServiceApi.RejectAffinityRequest, personalizationAffinityApprovalServiceApi.RejectAffinityResponse> =
      (input, done) => client1.rejectAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityApprovalServiceApi.RejectAffinityRequest, personalizationAffinityApprovalServiceApi.RejectAffinityResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncLifecycleServiceApi.RenewAudienceSyncResponse.fromPartial({
        audienceSync: {
          attributes: (reply1?.affinity?.attributes ?? {}),
          correlationId: (reply1?.result?.correlationId ?? ""),
        },
      }),
      audiencesAudienceSyncLifecycleServiceApi.RenewAudienceSyncResponse.fromPartial({
        audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules an audience sync.
   */
  async scheduleAudienceSyncExpiry(req: audiencesAudienceSyncLifecycleServiceApi.ScheduleAudienceSyncExpiryRequest): Promise<audiencesAudienceSyncLifecycleServiceApi.ScheduleAudienceSyncExpiryResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "ScheduleAudienceSyncExpiry", req);
    this.logger.info("schedule_audience_sync_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberRequest.fromPartial({
      audienceMember: {
        audienceMemberId: (req?.audienceSync?.subject?.audienceMemberId ?? ""),
        contact: { email: (req?.audienceSync?.subject?.email ?? "") },
        relationshipManager: {
          displayName: (req?.audienceSync?.subject?.displayName ?? ""),
          email: (req?.details?.notify?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient.scoreAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.audienceMember?.contact?.email ?? "") } },
      featureFlag: {
        owner: { email: (reply1?.audienceMember?.relationshipManager?.email ?? "") },
      },
    });
    const invoke2: Unary<featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest, featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.checkFeatureFlagEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest, featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityResponse>(invoke2, request2));
    const request3 = audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberRequest.fromPartial({
      audienceMember: {
        contact: {
          email: (reply1?.audienceMember?.contact?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke3: Unary<audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient.validateAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("ScheduleAudienceSyncExpiry.ValidateAudienceMember", () => call<audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberResponse>(invoke3, request3));
    const request4 = audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncRequest.fromPartial({
      audienceSync: {
        subject: {
          audienceMemberId: (req?.audienceSync?.subject?.audienceMemberId ?? ""),
          email: (reply1?.audienceMember?.relationshipManager?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke4: Unary<audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncValidationClient.scoreAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncLifecycleServiceApi.ScheduleAudienceSyncExpiryResponse.fromPartial({
        audienceSync: {
          subject: { audienceMemberId: (reply1?.audienceMember?.audienceMemberId ?? "") },
        },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      audiencesAudienceSyncLifecycleServiceApi.ScheduleAudienceSyncExpiryResponse.fromPartial({
        outcome: { message: (reply2?.outcome?.message ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      audiencesAudienceSyncLifecycleServiceApi.ScheduleAudienceSyncExpiryResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          status: (reply3?.outcome?.status ?? ""),
        },
      }),
      audiencesAudienceSyncLifecycleServiceApi.ScheduleAudienceSyncExpiryResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (reply4?.audienceSync?.audienceSyncId ?? ""),
          occurredAt: reply4?.audienceSync?.occurredAt,
        },
      }),
      audiencesAudienceSyncLifecycleServiceApi.ScheduleAudienceSyncExpiryResponse.fromPartial({
        audienceSync: {
          correlationId: (req?.audienceSync?.correlationId ?? ""),
          kind: (req?.audienceSync?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Suspends an audience sync.
   */
  async suspendAudienceSync(req: audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncRequest): Promise<audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncResponse> {
    validateContext(req.context);
    if (!req.audienceSyncId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_sync_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendAudienceSync", req);
    this.logger.info("suspend_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserQueryServiceApi.LookupUserRequest.fromPartial({
      context: req?.context,
      userId: (req?.details?.newOwner?.userId ?? ""),
    });
    const reply1 = await this.workQueue.enqueue<identityUserQueryServiceApi.LookupUserRequest, identityUserQueryServiceApi.LookupUserResponse>(
      "acme.audiences.v1.AudienceSyncLifecycleService/SuspendAudienceSync:0", request1,
    );
    const request2 = audiencesAudienceQueryServiceApi.BrowseAudiencesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.user?.audit?.createdAt,
        ownerId: (reply1?.user?.relationshipManager?.userId ?? ""),
        region: (reply1?.user?.primaryAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<audiencesAudienceQueryServiceApi.BrowseAudiencesRequest, audiencesAudienceQueryServiceApi.BrowseAudiencesResponse> =
      (input, done) => this.audiencesAudienceQueryClient.browseAudiences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<audiencesAudienceQueryServiceApi.BrowseAudiencesRequest, audiencesAudienceQueryServiceApi.BrowseAudiencesResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncResponse.fromPartial({
        audienceSync: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncResponse.fromPartial({
        audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates an audience sync.
   */
  async terminateAudienceSync(req: audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncRequest): Promise<audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncResponse> {
    validateContext(req.context);
    if (!req.audienceSyncId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_sync_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateAudienceSync", req);
    this.logger.info("terminate_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { phone: (req?.details?.notifyContact?.phone ?? "") } },
    });
    const invoke1: Unary<mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowResponse> =
      (input, done) => this.mediaTranscodeJobWorkflowClient.advanceTranscodeJobWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = audiencesAudienceServiceApi.WatchAudiencesRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.details?.notifyContact?.email ?? ""),
        name: req?.details?.notifyContact?.name,
        phone: (reply1?.transcodeJob?.requester?.phone ?? ""),
        preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
      },
    });
    const stream2 = this.audiencesAudienceClient.watchAudiences(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? audiencesAudienceServiceApi.WatchAudiencesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncResponse.fromPartial({
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          subject: { email: (req?.details?.notifyContact?.email ?? "") },
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for AudienceSyncLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceSyncLifecycleHandler {
  constructor(@inject(AudienceSyncLifecycleWorkflow) private readonly workflow: AudienceSyncLifecycleWorkflow) {}

  /**
   * Activates an audience sync.
   */
  activateAudienceSync = unary<audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.ActivateAudienceSyncResponse>(
    (request) => this.workflow.activateAudienceSync(request),
  );

  /**
   * Expires an audience sync.
   */
  expireAudienceSync = unary<audiencesAudienceSyncLifecycleServiceApi.ExpireAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.ExpireAudienceSyncResponse>(
    (request) => this.workflow.expireAudienceSync(request),
  );

  /**
   * Returns an audience sync.
   */
  getAudienceSyncLifecycle = (call: ServerUnaryCall<audiencesAudienceSyncLifecycleServiceApi.GetAudienceSyncLifecycleRequest, audiencesAudienceSyncLifecycleServiceApi.GetAudienceSyncLifecycleResponse>, done: sendUnaryData<audiencesAudienceSyncLifecycleServiceApi.GetAudienceSyncLifecycleResponse>): void => {
    void this.workflow.getAudienceSyncLifecycle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reinstates an audience sync.
   */
  reinstateAudienceSync = unary<audiencesAudienceSyncLifecycleServiceApi.ReinstateAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.ReinstateAudienceSyncResponse>(
    (request) => this.workflow.reinstateAudienceSync(request),
  );

  /**
   * Renews an audience sync.
   */
  renewAudienceSync = unary<audiencesAudienceSyncLifecycleServiceApi.RenewAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.RenewAudienceSyncResponse>(
    (request) => this.workflow.renewAudienceSync(request),
  );

  /**
   * Schedules an audience sync.
   */
  scheduleAudienceSyncExpiry = (call: ServerUnaryCall<audiencesAudienceSyncLifecycleServiceApi.ScheduleAudienceSyncExpiryRequest, audiencesAudienceSyncLifecycleServiceApi.ScheduleAudienceSyncExpiryResponse>, done: sendUnaryData<audiencesAudienceSyncLifecycleServiceApi.ScheduleAudienceSyncExpiryResponse>): void => {
    void this.workflow.scheduleAudienceSyncExpiry(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Suspends an audience sync.
   */
  suspendAudienceSync = unary<audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncResponse>(
    (request) => this.workflow.suspendAudienceSync(request),
  );

  /**
   * Terminates an audience sync.
   */
  terminateAudienceSync = unary<audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncResponse>(
    (request) => this.workflow.terminateAudienceSync(request),
  );
}

export function implementation(handler: AudienceSyncLifecycleHandler): audiencesAudienceSyncLifecycleServiceApi.AudienceSyncLifecycleServiceServer {
  return {
    activateAudienceSync: handler.activateAudienceSync,
    expireAudienceSync: handler.expireAudienceSync,
    getAudienceSyncLifecycle: handler.getAudienceSyncLifecycle,
    reinstateAudienceSync: handler.reinstateAudienceSync,
    renewAudienceSync: handler.renewAudienceSync,
    scheduleAudienceSyncExpiry: handler.scheduleAudienceSyncExpiry,
    suspendAudienceSync: handler.suspendAudienceSync,
    terminateAudienceSync: handler.terminateAudienceSync,
  };
}
