/**
 * Moves a participant between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as campaignsCampaignAssetApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_asset_approval_service.js";
import * as concessionsConcessionStandServiceApi from "../../../../.cache/proto/acme/concessions/v1/concession_stand_service.js";
import * as corporateeventsCorporateEventQueryServiceApi from "../../../../.cache/proto/acme/corporateevents/v1/corporate_event_query_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as mediaMediaAssetWorkflowServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_workflow_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingConversationQueryServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as messagingConversationReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as messagingParticipantImportServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_import_service.js";
import * as messagingParticipantLifecycleServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_lifecycle_service.js";
import * as messagingParticipantReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_reporting_service.js";
import * as messagingParticipantSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import * as routingRouteQueryServiceApi from "../../../../.cache/proto/acme/routing/v1/route_query_service.js";
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
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toParticipantRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate participant operations and persist audit data.
 */
@injectable()
export class ParticipantLifecycleWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.campaigns.v1.CampaignAssetApprovalService") private readonly campaignsCampaignAssetApprovalClient: campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceClient,
    @inject("grpc:acme.concessions.v1.ConcessionStandService") private readonly concessionsConcessionStandClient: concessionsConcessionStandServiceApi.ConcessionStandServiceClient,
    @inject("grpc:acme.corporateevents.v1.CorporateEventQueryService") private readonly corporateeventsCorporateEventQueryClient: corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentApprovalService") private readonly experimentsExperimentApprovalClient: experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetWorkflowService") private readonly mediaMediaAssetWorkflowClient: mediaMediaAssetWorkflowServiceApi.MediaAssetWorkflowServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelCalculationService") private readonly messagingChannelCalculationClient: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationQueryService") private readonly messagingConversationQueryClient: messagingConversationQueryServiceApi.ConversationQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationReportingService") private readonly messagingConversationReportingClient: messagingConversationReportingServiceApi.ConversationReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantImportService") private readonly messagingParticipantImportClient: messagingParticipantImportServiceApi.ParticipantImportServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantReportingService") private readonly messagingParticipantReportingClient: messagingParticipantReportingServiceApi.ParticipantReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantSyncService") private readonly messagingParticipantSyncClient: messagingParticipantSyncServiceApi.ParticipantSyncServiceClient,
    @inject("grpc:acme.routing.v1.RouteQueryService") private readonly routingRouteQueryClient: routingRouteQueryServiceApi.RouteQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a participant.
   */
  async activateParticipant(req: messagingParticipantLifecycleServiceApi.ActivateParticipantRequest): Promise<messagingParticipantLifecycleServiceApi.ActivateParticipantResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateParticipant", req);
    this.logger.info("activate_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationQueryServiceApi.ResolveConversationsRequest.fromPartial({ context: req?.context });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<messagingConversationQueryServiceApi.ResolveConversationsRequest, messagingConversationQueryServiceApi.ResolveConversationsResponse> =
      (input, done) => this.messagingConversationQueryClient.resolveConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationQueryServiceApi.ResolveConversationsRequest, messagingConversationQueryServiceApi.ResolveConversationsResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantLifecycleServiceApi.ActivateParticipantResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      messagingParticipantLifecycleServiceApi.ActivateParticipantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        participant: { participantId: (req?.participantId ?? "") },
      }),
    );
  }

  /**
   * Returns a participant.
   */
  async getParticipantLifecycle(req: messagingParticipantLifecycleServiceApi.GetParticipantLifecycleRequest): Promise<messagingParticipantLifecycleServiceApi.GetParticipantLifecycleResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetParticipantLifecycle", req);
    this.logger.info("get_participant_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowRequest.fromPartial({
      context: input1?.context,
      details: { notify: { email: (input1?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowResponse> =
      (input, done) => this.mediaMediaAssetWorkflowClient.retryMediaAssetWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.RetryMediaAssetWorkflowResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (reply1?.mediaAsset?.locator?.$case) {
      case "address":
        selected2_1 = ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = routingRouteQueryServiceApi.SuggestRoutesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.mediaAsset?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
        region: (selected2_1 ?? ""),
      },
    });
    const invoke2: Unary<routingRouteQueryServiceApi.SuggestRoutesRequest, routingRouteQueryServiceApi.SuggestRoutesResponse> =
      (input, done) => this.routingRouteQueryClient.suggestRoutes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<routingRouteQueryServiceApi.SuggestRoutesRequest, routingRouteQueryServiceApi.SuggestRoutesResponse>(invoke2, request2);
    return mergeResponses(
      messagingParticipantLifecycleServiceApi.GetParticipantLifecycleResponse.fromPartial({
        participant: { audit: { updatedAt: reply1?.mediaAsset?.audit?.updatedAt } },
      }),
      messagingParticipantLifecycleServiceApi.GetParticipantLifecycleResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      messagingParticipantLifecycleServiceApi.GetParticipantLifecycleResponse.fromPartial({ participant: { participantId: (req?.participantId ?? "") } }),
    );
  }

  /**
   * Reinstates a participant.
   */
  async reinstateParticipant(req: messagingParticipantLifecycleServiceApi.ReinstateParticipantRequest): Promise<messagingParticipantLifecycleServiceApi.ReinstateParticipantResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateParticipant", req);
    this.logger.info("reinstate_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureSyncServiceApi.PushExposureRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      exposure: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
    });
    const decoded1 = experimentsExposureSyncServiceApi.PushExposureRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExposureSyncServiceApi.PushExposureRequest.toJSON(request1))),
    );
    const invoke1: Unary<experimentsExposureSyncServiceApi.PushExposureRequest, experimentsExposureSyncServiceApi.PushExposureResponse> =
      (input, done) => this.experimentsExposureSyncClient.pushExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureSyncServiceApi.PushExposureRequest, experimentsExposureSyncServiceApi.PushExposureResponse>(invoke1, decoded1);
    const request2 = campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.exposure?.subject?.startsAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.exposure?.correlationId ?? ""),
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.campaigns.v1.ListPendingCampaignAssetsRequest",
      value: Buffer.from(campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsRequest.encode(request2).finish()),
    });
    const unpacked2 = campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsRequest.decode(envelope2.value);
    const invoke2: Unary<campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsRequest, campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsResponse> =
      (input, done) => this.campaignsCampaignAssetApprovalClient.listPendingCampaignAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsRequest, campaignsCampaignAssetApprovalServiceApi.ListPendingCampaignAssetsResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantLifecycleServiceApi.ReinstateParticipantResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      messagingParticipantLifecycleServiceApi.ReinstateParticipantResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      messagingParticipantLifecycleServiceApi.ReinstateParticipantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        participant: { participantId: (req?.participantId ?? "") },
      }),
    );
  }

  /**
   * Renews a participant.
   */
  async renewParticipant(req: messagingParticipantLifecycleServiceApi.RenewParticipantRequest): Promise<messagingParticipantLifecycleServiceApi.RenewParticipantResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewParticipant", req);
    this.logger.info("renew_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = concessionsConcessionStandServiceApi.CloneConcessionStandRequest.fromPartial({
      concessionStand: { owner: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      context: req?.context,
    });
    const client1 = this.clients.get<concessionsConcessionStandServiceApi.ConcessionStandServiceClient>("acme.concessions.v1.ConcessionStandService");
    const invoke1: Unary<concessionsConcessionStandServiceApi.CloneConcessionStandRequest, concessionsConcessionStandServiceApi.CloneConcessionStandResponse> =
      (input, done) => client1.cloneConcessionStand(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<concessionsConcessionStandServiceApi.CloneConcessionStandRequest, concessionsConcessionStandServiceApi.CloneConcessionStandResponse>(invoke1, request1);
    const request2 = messagingChannelCalculationServiceApi.CompareChannelOptionsRequest.fromPartial({
      channel: {
        dimensions: { weight: (reply1?.concessionStand?.dimensions?.weight ?? 0) },
      },
      context: req?.context,
      details: {
        destination: {
          recipient: ((reply1?.concessionStand?.locator?.$case === "address" ? reply1?.concessionStand?.locator.address : undefined)?.recipient ?? ""),
          region: ((reply1?.concessionStand?.locator?.$case === "address" ? reply1?.concessionStand?.locator.address : undefined)?.region ?? ""),
        },
      },
    });
    const invoke2: Unary<messagingChannelCalculationServiceApi.CompareChannelOptionsRequest, messagingChannelCalculationServiceApi.CompareChannelOptionsResponse> =
      (input, done) => this.messagingChannelCalculationClient.compareChannelOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<messagingChannelCalculationServiceApi.CompareChannelOptionsRequest, messagingChannelCalculationServiceApi.CompareChannelOptionsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest.fromPartial({
      context: req?.context,
      conversation: {
        audit: {
          createdAt: reply1?.concessionStand?.audit?.createdAt,
          updatedAt: reply1?.concessionStand?.audit?.updatedAt,
        },
      },
    });
    const invoke3: Unary<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse> =
      (input, done) => this.messagingConversationCalculationClient.explainConversationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse>(invoke3, request3));
    let selected4_1: string | undefined;
    switch (reply1?.concessionStand?.locator?.$case) {
      case "address":
        selected4_1 = ((reply1?.concessionStand?.locator?.$case === "address" ? reply1?.concessionStand?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = messagingParticipantSyncServiceApi.ListParticipantConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.concessionStand?.audit?.updatedAt,
        region: (selected4_1 ?? ""),
      },
    });
    const invoke4: Unary<messagingParticipantSyncServiceApi.ListParticipantConflictsRequest, messagingParticipantSyncServiceApi.ListParticipantConflictsResponse> =
      (input, done) => this.messagingParticipantSyncClient.listParticipantConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingParticipantSyncServiceApi.ListParticipantConflictsRequest, messagingParticipantSyncServiceApi.ListParticipantConflictsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantLifecycleServiceApi.RenewParticipantResponse.fromPartial({
        participant: {
          primaryAddress: {
            recipient: ((reply1?.concessionStand?.locator?.$case === "address" ? reply1?.concessionStand?.locator.address : undefined)?.recipient ?? ""),
          },
          relationshipManager: { displayName: (reply1?.concessionStand?.owner?.displayName ?? "") },
        },
      }),
      messagingParticipantLifecycleServiceApi.RenewParticipantResponse.fromPartial({
        participant: {
          primaryAddress: {
            region: ((reply2?.channel?.locator?.$case === "address" ? reply2?.channel?.locator.address : undefined)?.region ?? ""),
          },
        },
      }),
      messagingParticipantLifecycleServiceApi.RenewParticipantResponse.fromPartial({ outcome: { nextSteps: (reply3?.outcome?.nextSteps ?? []) } }),
      messagingParticipantLifecycleServiceApi.RenewParticipantResponse.fromPartial({ result: { message: (reply4?.result?.message ?? "") } }),
      messagingParticipantLifecycleServiceApi.RenewParticipantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        participant: { participantId: (req?.participantId ?? "") },
      }),
    );
  }

  /**
   * Schedules a participant.
   */
  async scheduleParticipantExpiry(req: messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryRequest): Promise<messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "ScheduleParticipantExpiry", req);
    this.logger.info("schedule_participant_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentApprovalServiceApi.RejectExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { etag: (req?.participant?.audit?.etag ?? "") },
        location: { locality: (req?.participant?.primaryAddress?.locality ?? "") },
        participants: [{
          contact: {
            email: (req?.details?.notify?.email ?? ""),
            preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
          },
        }],
      },
    });
    const invoke1: Unary<experimentsExperimentApprovalServiceApi.RejectExperimentRequest, experimentsExperimentApprovalServiceApi.RejectExperimentResponse> =
      (input, done) => this.experimentsExperimentApprovalClient.rejectExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = auditAuditEventValidationServiceApi.CheckAuditEventEligibilityRequest.fromPartial({
      auditEvent: {
        subject: { displayName: (reply1?.experiment?.organizer?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.participant?.relationshipManager?.email ?? ""),
          name: req?.details?.notify?.name,
          preferredChannel: (req?.participant?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<auditAuditEventValidationServiceApi.CheckAuditEventEligibilityRequest, auditAuditEventValidationServiceApi.CheckAuditEventEligibilityResponse>(
      "acme.messaging.v1.ParticipantLifecycleService/ScheduleParticipantExpiry:1", request2,
    );
    const request3 = messagingParticipantImportServiceApi.MapParticipantImportColumnsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.participant?.contact?.preferredChannel ?? "") },
      },
      participant: {
        audit: { createdAt: req?.participant?.audit?.createdAt },
        primaryAddress: {
          lines: (reply1?.experiment?.location?.lines ?? []).map((value) => value),
          recipient: (req?.participant?.primaryAddress?.recipient ?? ""),
        },
      },
    });
    const invoke3: Unary<messagingParticipantImportServiceApi.MapParticipantImportColumnsRequest, messagingParticipantImportServiceApi.MapParticipantImportColumnsResponse> =
      (input, done) => this.messagingParticipantImportClient.mapParticipantImportColumns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<messagingParticipantImportServiceApi.MapParticipantImportColumnsRequest, messagingParticipantImportServiceApi.MapParticipantImportColumnsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryResponse.fromPartial({ outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") } }),
      messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryResponse.fromPartial({
        participant: {
          preferences: { channels: (reply3?.participant?.preferences?.channels ?? []) },
        },
      }),
      messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryResponse.fromPartial({
        participant: {
          contact: { name: req?.participant?.name },
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Suspends a participant.
   */
  async suspendParticipant(req: messagingParticipantLifecycleServiceApi.SuspendParticipantRequest): Promise<messagingParticipantLifecycleServiceApi.SuspendParticipantResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendParticipant", req);
    this.logger.info("suspend_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationValidationServiceApi.ScoreConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: {
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
        origin: { $case: "customer", customer: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
        requester: { phone: (req?.details?.notifyContact?.phone ?? "") },
      },
    });
    const invoke1: Unary<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.scoreConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<messagingConversationValidationServiceApi.ScoreConversationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = corporateeventsCorporateEventQueryServiceApi.CountCorporateEventsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.conversation?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply1?.conversation?.sla?.policyId ?? ""),
      },
    });
    const invoke2: Unary<corporateeventsCorporateEventQueryServiceApi.CountCorporateEventsRequest, corporateeventsCorporateEventQueryServiceApi.CountCorporateEventsResponse> =
      (input, done) => this.corporateeventsCorporateEventQueryClient.countCorporateEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantLifecycleServiceApi.SuspendParticipantResponse.fromPartial({
        participant: {
          relationshipManager: { email: (reply1?.conversation?.assignee?.email ?? "") },
        },
      }),
      messagingParticipantLifecycleServiceApi.SuspendParticipantResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      messagingParticipantLifecycleServiceApi.SuspendParticipantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        participant: { participantId: (req?.participantId ?? "") },
      }),
    );
  }

  /**
   * Terminates a participant.
   */
  async terminateParticipant(req: messagingParticipantLifecycleServiceApi.TerminateParticipantRequest): Promise<messagingParticipantLifecycleServiceApi.TerminateParticipantResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateParticipant", req);
    this.logger.info("terminate_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentApprovalServiceApi.ListPendingExperimentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.participantId ?? ""),
      },
    });
    const invoke1: Unary<experimentsExperimentApprovalServiceApi.ListPendingExperimentsRequest, experimentsExperimentApprovalServiceApi.ListPendingExperimentsResponse> =
      (input, done) => this.experimentsExperimentApprovalClient.listPendingExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = messagingParticipantReportingServiceApi.ShareParticipantReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.newOwner?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const method2 = "shareParticipantReport" as const;
    const invoke2: Unary<messagingParticipantReportingServiceApi.ShareParticipantReportRequest, messagingParticipantReportingServiceApi.ShareParticipantReportResponse> =
      (input, done) => this.messagingParticipantReportingClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingParticipantReportingServiceApi.ShareParticipantReportRequest, messagingParticipantReportingServiceApi.ShareParticipantReportResponse>(invoke2, request2);
    const request3 = messagingChatMessageSyncServiceApi.PushChatMessageRequest.fromPartial({
      chatMessage: {
        attributes: Object.fromEntries(Object.entries((reply2?.participant?.attributes ?? {}))),
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
      context: req?.context,
    });
    const proxy3 = forwarding(this.messagingChatMessageSyncClient);
    const invoke3: Unary<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse> =
      (input, done) => proxy3.pushChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse>(invoke3, request3);
    const request4 = messagingConversationReportingServiceApi.ShareConversationReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (reply2?.participant?.contact?.email ?? ""),
          phone: (reply2?.participant?.contact?.phone ?? ""),
          preferredChannel: (reply2?.participant?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke4: Unary<messagingConversationReportingServiceApi.ShareConversationReportRequest, messagingConversationReportingServiceApi.ShareConversationReportResponse> =
      (input, done) => this.messagingConversationReportingClient.shareConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingConversationReportingServiceApi.ShareConversationReportRequest, messagingConversationReportingServiceApi.ShareConversationReportResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantLifecycleServiceApi.TerminateParticipantResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingParticipantLifecycleServiceApi.TerminateParticipantResponse.fromPartial({
        participant: {
          audit: { etag: (reply2?.participant?.audit?.etag ?? "") },
          primaryAddress: { postalCode: (reply2?.participant?.primaryAddress?.postalCode ?? "") },
        },
      }),
      messagingParticipantLifecycleServiceApi.TerminateParticipantResponse.fromPartial({
        result: {
          correlationId: (reply3?.chatMessage?.correlationId ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      messagingParticipantLifecycleServiceApi.TerminateParticipantResponse.fromPartial({ result: { correlationId: (reply4?.result?.correlationId ?? "") } }),
      messagingParticipantLifecycleServiceApi.TerminateParticipantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        participant: { participantId: (req?.participantId ?? "") },
      }),
    );
  }
}

/**
 * The gRPC boundary for ParticipantLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class ParticipantLifecycleHandler {
  constructor(@inject(ParticipantLifecycleWorkflow) private readonly workflow: ParticipantLifecycleWorkflow) {}

  /**
   * Activates a participant.
   */
  activateParticipant = unary<messagingParticipantLifecycleServiceApi.ActivateParticipantRequest, messagingParticipantLifecycleServiceApi.ActivateParticipantResponse>(
    (request) => this.workflow.activateParticipant(request),
  );

  /**
   * Returns a participant.
   */
  getParticipantLifecycle = unary<messagingParticipantLifecycleServiceApi.GetParticipantLifecycleRequest, messagingParticipantLifecycleServiceApi.GetParticipantLifecycleResponse>(
    (request) => this.workflow.getParticipantLifecycle(request),
  );

  /**
   * Reinstates a participant.
   */
  reinstateParticipant = (call: ServerUnaryCall<messagingParticipantLifecycleServiceApi.ReinstateParticipantRequest, messagingParticipantLifecycleServiceApi.ReinstateParticipantResponse>, done: sendUnaryData<messagingParticipantLifecycleServiceApi.ReinstateParticipantResponse>): void => {
    void this.workflow.reinstateParticipant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Renews a participant.
   */
  renewParticipant = unary<messagingParticipantLifecycleServiceApi.RenewParticipantRequest, messagingParticipantLifecycleServiceApi.RenewParticipantResponse>(
    (request) => this.workflow.renewParticipant(request),
  );

  /**
   * Schedules a participant.
   */
  scheduleParticipantExpiry = unary<messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryRequest, messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryResponse>(
    (request) => this.workflow.scheduleParticipantExpiry(request),
  );

  /**
   * Suspends a participant.
   */
  suspendParticipant = (call: ServerUnaryCall<messagingParticipantLifecycleServiceApi.SuspendParticipantRequest, messagingParticipantLifecycleServiceApi.SuspendParticipantResponse>, done: sendUnaryData<messagingParticipantLifecycleServiceApi.SuspendParticipantResponse>): void => {
    void this.workflow.suspendParticipant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates a participant.
   */
  terminateParticipant = unary<messagingParticipantLifecycleServiceApi.TerminateParticipantRequest, messagingParticipantLifecycleServiceApi.TerminateParticipantResponse>(
    (request) => this.workflow.terminateParticipant(request),
  );
}

export function implementation(handler: ParticipantLifecycleHandler): messagingParticipantLifecycleServiceApi.ParticipantLifecycleServiceServer {
  return {
    activateParticipant: handler.activateParticipant,
    getParticipantLifecycle: handler.getParticipantLifecycle,
    reinstateParticipant: handler.reinstateParticipant,
    renewParticipant: handler.renewParticipant,
    scheduleParticipantExpiry: handler.scheduleParticipantExpiry,
    suspendParticipant: handler.suspendParticipant,
    terminateParticipant: handler.terminateParticipant,
  };
}
