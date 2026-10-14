/**
 * Runs the long-lived workflow that takes an audience member from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as audiencesAudienceMemberCalculationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import * as audiencesAudienceMemberWorkflowServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as audiencesAudienceServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as audiencesAudienceSyncApprovalServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_sync_approval_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as audiencesAudienceWorkflowServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_workflow_service.js";
import * as identityUserServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as mediaRenditionWorkflowServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_workflow_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import * as venuesVenueQueryServiceApi from "../../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import * as googleTimestampApi from "../../../../../.cache/proto/google/protobuf/timestamp.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
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
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toAudienceMemberRecord } from "../../data/records.js";
import { AudiencesRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience member operations and persist audit data.
 */
@injectable()
export class AudienceMemberWorkflowWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberCalculationService") private readonly audiencesAudienceMemberCalculationClient: audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceService") private readonly audiencesAudienceClient: audiencesAudienceServiceApi.AudienceServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncApprovalService") private readonly audiencesAudienceSyncApprovalClient: audiencesAudienceSyncApprovalServiceApi.AudienceSyncApprovalServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncCalculationService") private readonly audiencesAudienceSyncCalculationClient: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceValidationService") private readonly audiencesAudienceValidationClient: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceWorkflowService") private readonly audiencesAudienceWorkflowClient: audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.media.v1.RenditionWorkflowService") private readonly mediaRenditionWorkflowClient: mediaRenditionWorkflowServiceApi.RenditionWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionHistoryService") private readonly notificationsSubscriptionHistoryClient: notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyApprovalService") private readonly surveysSurveyApprovalClient: surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances an audience member.
   */
  async advanceAudienceMemberWorkflow(req: audiencesAudienceMemberWorkflowServiceApi.AdvanceAudienceMemberWorkflowRequest): Promise<audiencesAudienceMemberWorkflowServiceApi.AdvanceAudienceMemberWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "AdvanceAudienceMemberWorkflow", req);
    this.logger.info("advance_audience_member_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { userId: (req?.audienceMember?.relationshipManager?.userId ?? "") },
        audit: { createdAt: req?.audienceMember?.audit?.createdAt },
      },
    });
    const proxy1 = forwarding(this.notificationsNotificationHistoryClient);
    const invoke1: Unary<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse> =
      (input, done) => proxy1.compareNotificationVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse>(invoke1, request1);
    const request2 = notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        billingAddress: {
          countryCode: (req?.audienceMember?.primaryAddress?.countryCode ?? ""),
          locality: (req?.audienceMember?.primaryAddress?.locality ?? ""),
          region: (req?.audienceMember?.primaryAddress?.region ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.simulateNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.SimulateNotificationTemplateResponse>(invoke2, request2);
    const request3 = mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          preferredChannel: (req?.audienceMember?.contact?.preferredChannel ?? ""),
        },
      },
      rendition: {
        audit: { createdAt: reply1?.notification?.audit?.createdAt },
        owner: { email: (reply1?.notification?.requester?.email ?? "") },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowResponse> =
      (input, done) => this.mediaRenditionWorkflowClient.retryRenditionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowRequest, mediaRenditionWorkflowServiceApi.RetryRenditionWorkflowResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = audiencesAudienceValidationServiceApi.NormalizeAudienceRequest.fromPartial({
      audience: {
        owner: {
          displayName: (input4?.audienceMember?.relationshipManager?.displayName ?? ""),
        },
      },
      context: input4?.context,
      details: { contact: { name: input4?.details?.notify?.name } },
    });
    const invoke4: Unary<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.normalizeAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberWorkflowServiceApi.AdvanceAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: {
          audit: { createdAt: reply1?.notification?.audit?.createdAt },
          contact: { email: (reply1?.notification?.assignee?.email ?? "") },
        },
      }),
      audiencesAudienceMemberWorkflowServiceApi.AdvanceAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: { audit: { updatedAt: reply2?.notificationTemplate?.audit?.updatedAt } },
      }),
      audiencesAudienceMemberWorkflowServiceApi.AdvanceAudienceMemberWorkflowResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      audiencesAudienceMemberWorkflowServiceApi.AdvanceAudienceMemberWorkflowResponse.fromPartial({
        outcome: {
          message: (reply4?.result?.message ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      audiencesAudienceMemberWorkflowServiceApi.AdvanceAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          contact: { name: req?.audienceMember?.name },
        },
      }),
    );
  }

  /**
   * Cancels an audience member.
   */
  async cancelAudienceMemberWorkflow(req: audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowRequest): Promise<audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "CancelAudienceMemberWorkflow", req);
    this.logger.info("cancel_audience_member_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceServiceApi.SearchAudiencesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceMember?.audit?.updatedAt,
        ownerId: (req?.audienceMember?.audienceMemberId ?? ""),
        region: (req?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const cloned1: audiencesAudienceServiceApi.SearchAudiencesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<audiencesAudienceServiceApi.SearchAudiencesRequest, audiencesAudienceServiceApi.SearchAudiencesResponse> =
      (input, done) => this.audiencesAudienceClient.searchAudiences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceServiceApi.SearchAudiencesRequest, audiencesAudienceServiceApi.SearchAudiencesResponse>(invoke1, cloned1);
    const request2 = audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationRequest.fromPartial({
      audienceSync: {
        subject: {
          audienceMemberId: (req?.audienceMember?.audienceMemberId ?? ""),
          email: (req?.audienceMember?.contact?.email ?? ""),
        },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.details?.notify?.name,
        },
      },
    });
    const decoded2 = audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationRequest.fromJSON(
      JSON.parse(JSON.stringify(audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationRequest.toJSON(request2))),
    );
    const invoke2: Unary<audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationRequest, audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.explainAudienceSyncCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationRequest, audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationResponse>(invoke2, decoded2);
    const request3 = audiencesAudienceServiceApi.CreateAudienceRequest.fromPartial({
      audience: {
        audit: {
          createdAt: req?.audienceMember?.audit?.createdAt,
          etag: (req?.audienceMember?.audit?.etag ?? ""),
          updatedAt: req?.audienceMember?.audit?.updatedAt,
          updatedBy: (req?.audienceMember?.audit?.updatedBy ?? ""),
        },
      },
      context: req?.context,
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.audiences.v1.CreateAudienceRequest",
      value: Buffer.from(audiencesAudienceServiceApi.CreateAudienceRequest.encode(request3).finish()),
    });
    const unpacked3 = audiencesAudienceServiceApi.CreateAudienceRequest.decode(envelope3.value);
    const invoke3: Unary<audiencesAudienceServiceApi.CreateAudienceRequest, audiencesAudienceServiceApi.CreateAudienceResponse> =
      (input, done) => this.audiencesAudienceClient.createAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<audiencesAudienceServiceApi.CreateAudienceRequest, audiencesAudienceServiceApi.CreateAudienceResponse>(invoke3, unpacked3);
    const request4 = identityUserServiceApi.ListUsersRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.audienceMember?.primaryAddress?.region ?? "") },
    });
    const client4 = this.clients.get<identityUserServiceApi.UserServiceClient>("acme.identity.v1.UserService");
    const invoke4: Unary<identityUserServiceApi.ListUsersRequest, identityUserServiceApi.ListUsersResponse> =
      (input, done) => client4.listUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<identityUserServiceApi.ListUsersRequest, identityUserServiceApi.ListUsersResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse.fromPartial({
        outcome: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse.fromPartial({ result: { status: (reply4?.result?.status ?? "") } }),
      audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          name: req?.audienceMember?.name,
        },
      }),
    );
  }

  /**
   * Returns an audience member.
   */
  async inspectAudienceMemberWorkflow(req: audiencesAudienceMemberWorkflowServiceApi.InspectAudienceMemberWorkflowRequest): Promise<audiencesAudienceMemberWorkflowServiceApi.InspectAudienceMemberWorkflowResponse> {
    validateContext(req.context);
    if (!req.audienceMemberId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_member_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectAudienceMemberWorkflow", req);
    this.logger.info("inspect_audience_member_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberRequest.fromPartial({
      audienceMember: {
        audienceMemberId: (req?.audienceMemberId ?? ""),
        contact: { email: (req?.context?.actor?.email ?? "") },
        relationshipManager: { userId: (req?.context?.actor?.userId ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient.quoteAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    return mergeResponses(
      audiencesAudienceMemberWorkflowServiceApi.InspectAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: {
          preferences: {
            marketingOptIn: (reply1?.audienceMember?.preferences?.marketingOptIn ?? false),
          },
        },
      }),
      audiencesAudienceMemberWorkflowServiceApi.InspectAudienceMemberWorkflowResponse.fromPartial({ audienceMember: { audienceMemberId: (req?.audienceMemberId ?? "") } }),
    );
  }

  /**
   * Lists audience members a page at a time.
   */
  async listAudienceMemberWorkflows(req: audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsRequest): Promise<audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListAudienceMemberWorkflows", req);
    this.logger.info("list_audience_member_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses an audience member.
   */
  async pauseAudienceMemberWorkflow(req: audiencesAudienceMemberWorkflowServiceApi.PauseAudienceMemberWorkflowRequest): Promise<audiencesAudienceMemberWorkflowServiceApi.PauseAudienceMemberWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "PauseAudienceMemberWorkflow", req);
    this.logger.info("pause_audience_member_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest.fromPartial({
      audience: { audit: { etag: (req?.audienceMember?.audit?.etag ?? "") } },
      context: req?.context,
      details: {
        contact: {
          email: (req?.audienceMember?.relationshipManager?.email ?? ""),
          name: req?.audienceMember?.contact?.name,
          phone: (req?.audienceMember?.contact?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest, audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse> =
      (input, done) => this.audiencesAudienceValidationClient.explainAudienceDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest, audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberWorkflowServiceApi.PauseAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: {
          relationshipManager: { userId: (reply1?.audience?.owner?.userId ?? "") },
        },
      }),
      audiencesAudienceMemberWorkflowServiceApi.PauseAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          status: req?.audienceMember?.status,
        },
      }),
    );
  }

  /**
   * Resumes an audience member.
   */
  async resumeAudienceMemberWorkflow(req: audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowRequest): Promise<audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "ResumeAudienceMemberWorkflow", req);
    this.logger.info("resume_audience_member_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: googleTimestampApi.Timestamp | undefined;
    switch (req?.audienceMember?.identityDocument?.$case) {
      case "passport":
        selected1_2 = (req?.audienceMember?.identityDocument?.$case === "passport" ? req?.audienceMember?.identityDocument.passport : undefined)?.expiresAt;
        break;
      default:
        selected1_2 = undefined;
    }
    const request1 = notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: selected1_2,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.audienceMember?.audienceMemberId ?? ""),
        region: (req?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsResponse> =
      (input, done) => this.notificationsSubscriptionHistoryClient.listSubscriptionVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.ListSubscriptionVersionsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          status: req?.audienceMember?.status,
        },
      }),
    );
  }

  /**
   * Retrys an audience member.
   */
  async retryAudienceMemberWorkflow(req: audiencesAudienceMemberWorkflowServiceApi.RetryAudienceMemberWorkflowRequest): Promise<audiencesAudienceMemberWorkflowServiceApi.RetryAudienceMemberWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "RetryAudienceMemberWorkflow", req);
    this.logger.info("retry_audience_member_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueQueryServiceApi.SuggestVenuesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceMember?.audit?.createdAt,
        region: (req?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<venuesVenueQueryServiceApi.SuggestVenuesRequest, venuesVenueQueryServiceApi.SuggestVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient.suggestVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberWorkflowServiceApi.RetryAudienceMemberWorkflowResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      audiencesAudienceMemberWorkflowServiceApi.RetryAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          name: req?.audienceMember?.name,
        },
      }),
    );
  }

  /**
   * Signals an audience member.
   */
  async signalAudienceMemberWorkflow(req: audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowRequest): Promise<audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "SignalAudienceMemberWorkflow", req);
    this.logger.info("signal_audience_member_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.SearchUsersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceMember?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
        ownerId: (req?.audienceMember?.audienceMemberId ?? ""),
        region: (req?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<identityUserServiceApi.SearchUsersRequest, identityUserServiceApi.SearchUsersResponse>(
      "acme.audiences.v1.AudienceMemberWorkflowService/SignalAudienceMemberWorkflow:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: {
          attributes: (req?.audienceMember?.attributes ?? {}),
          audienceMemberId: (req?.audienceMemberId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts an audience member.
   */
  async startAudienceMemberWorkflow(req: audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowRequest): Promise<audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "StartAudienceMemberWorkflow", req);
    this.logger.info("start_audience_member_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyApprovalServiceApi.RejectSurveyRequest.fromPartial({
      context: req?.context,
      survey: {
        billingAddress: {
          countryCode: (req?.audienceMember?.primaryAddress?.countryCode ?? ""),
          locality: (req?.audienceMember?.primaryAddress?.locality ?? ""),
          postalCode: (req?.audienceMember?.primaryAddress?.postalCode ?? ""),
        },
      },
    });
    const invoke1: Unary<surveysSurveyApprovalServiceApi.RejectSurveyRequest, surveysSurveyApprovalServiceApi.RejectSurveyResponse> =
      (input, done) => this.surveysSurveyApprovalClient.rejectSurvey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<surveysSurveyApprovalServiceApi.RejectSurveyRequest, surveysSurveyApprovalServiceApi.RejectSurveyResponse>(invoke1, request1));
    const request2 = audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowRequest.fromPartial({
      audience: { audit: { etag: (req?.audienceMember?.audit?.etag ?? "") } },
      context: req?.context,
      details: {
        notify: { email: (req?.audienceMember?.relationshipManager?.email ?? "") },
      },
    });
    const invoke2: Unary<audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowResponse> =
      (input, done) => this.audiencesAudienceWorkflowClient.startAudienceWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.audienceMember?.contact?.email ?? "") } },
    });
    const invoke3: Unary<audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalRequest, audiencesAudienceSyncApprovalServiceApi.CommentAudienceSyncApprovalResponse> =
      (input, done) => this.audiencesAudienceSyncApprovalClient.commentAudienceSyncApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: { contact: { email: (reply3?.audienceSync?.subject?.email ?? "") } },
        result: { correlationId: (reply3?.audienceSync?.correlationId ?? "") },
      }),
      audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          primaryAddress: req?.audienceMember?.primaryAddress,
        },
      }),
    );
  }
}
