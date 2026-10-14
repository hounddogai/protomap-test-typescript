/**
 * Routes audience members through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as audiencesAudienceApprovalServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import * as audiencesAudienceMemberApprovalServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as audiencesAudienceMemberCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import * as audiencesAudienceQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import * as audiencesAudienceServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as careplansCarePlanServiceApi from "../../../../.cache/proto/acme/careplans/v1/care_plan_service.js";
import * as dispatchDispatchOrderServiceApi from "../../../../.cache/proto/acme/dispatch/v1/dispatch_order_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
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
  workflow,
} from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toAudienceMemberRecord } from "../data/records.js";
import { AudiencesRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience member operations and persist audit data.
 */
@injectable()
export class AudienceMemberApprovalWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceApprovalService") private readonly audiencesAudienceApprovalClient: audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberCalculationService") private readonly audiencesAudienceMemberCalculationClient: audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceQueryService") private readonly audiencesAudienceQueryClient: audiencesAudienceQueryServiceApi.AudienceQueryServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceService") private readonly audiencesAudienceClient: audiencesAudienceServiceApi.AudienceServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncCalculationService") private readonly audiencesAudienceSyncCalculationClient: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceValidationService") private readonly audiencesAudienceValidationClient: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient,
    @inject("grpc:acme.careplans.v1.CarePlanService") private readonly careplansCarePlanClient: careplansCarePlanServiceApi.CarePlanServiceClient,
    @inject("grpc:acme.dispatch.v1.DispatchOrderService") private readonly dispatchDispatchOrderClient: dispatchDispatchOrderServiceApi.DispatchOrderServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseApprovalService") private readonly surveysSurveyResponseApprovalClient: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves an audience member.
   */
  async approveAudienceMember(req: audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberRequest): Promise<audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "ApproveAudienceMember", req);
    this.logger.info("approve_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.audienceMember?.attributes ?? {}))),
        period: req?.audienceMember?.preferences?.quietHours,
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.summarizeNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ApproveAudienceMember.SummarizeNotificationTemplates", () => call<notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SummarizeNotificationTemplatesResponse>(invoke1, request1));
    const request2 = careplansCarePlanServiceApi.BatchGetCarePlansRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<careplansCarePlanServiceApi.BatchGetCarePlansRequest, careplansCarePlanServiceApi.BatchGetCarePlansResponse> =
      (input, done) => this.careplansCarePlanClient.batchGetCarePlans(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberResponse.fromPartial({
        audienceMember: {
          attributes: (req?.audienceMember?.attributes ?? {}),
          audienceMemberId: (req?.audienceMemberId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments an audience member.
   */
  async commentAudienceMemberApproval(req: audiencesAudienceMemberApprovalServiceApi.CommentAudienceMemberApprovalRequest): Promise<audiencesAudienceMemberApprovalServiceApi.CommentAudienceMemberApprovalResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "CommentAudienceMemberApproval", req);
    this.logger.info("comment_audience_member_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceQueryServiceApi.CountAudiencesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.audienceMember?.primaryAddress?.region ?? "") },
    });
    const reply1 = await this.workQueue.enqueue<audiencesAudienceQueryServiceApi.CountAudiencesRequest, audiencesAudienceQueryServiceApi.CountAudiencesResponse>(
      "acme.audiences.v1.AudienceMemberApprovalService/CommentAudienceMemberApproval:0", request1,
    );
    const request2 = audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncRequest.fromPartial({
      audienceSync: { subject: { displayName: (req?.details?.approver?.displayName ?? "") } },
      context: req?.context,
      details: {
        destination: { countryCode: (req?.audienceMember?.primaryAddress?.countryCode ?? "") },
      },
    });
    const invoke2: Unary<audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.estimateAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncResponse>(invoke2, request2));
    const request3 = audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest.fromPartial({
      audienceSync: {
        subject: { displayName: (reply2?.audienceSync?.subject?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        destination: { countryCode: (req?.audienceMember?.primaryAddress?.countryCode ?? "") },
      },
    });
    const invoke3: Unary<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.simulateAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberApprovalServiceApi.CommentAudienceMemberApprovalResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      audiencesAudienceMemberApprovalServiceApi.CommentAudienceMemberApprovalResponse.fromPartial({
        audienceMember: {
          relationshipManager: { displayName: (reply2?.audienceSync?.subject?.displayName ?? "") },
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      audiencesAudienceMemberApprovalServiceApi.CommentAudienceMemberApprovalResponse.fromPartial({
        audienceMember: {
          relationshipManager: { displayName: (reply3?.audienceSync?.subject?.displayName ?? "") },
        },
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
      }),
      audiencesAudienceMemberApprovalServiceApi.CommentAudienceMemberApprovalResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          contact: req?.audienceMember?.contact,
        },
      }),
    );
  }

  /**
   * Escalates an audience member.
   */
  async escalateAudienceMember(req: audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberRequest): Promise<audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "EscalateAudienceMember", req);
    this.logger.info("escalate_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { userId: (req?.audienceMember?.relationshipManager?.userId ?? "") },
      },
    });
    const invoke1: Unary<surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient.recallSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = audiencesAudienceValidationServiceApi.PreviewAudienceRequest.fromPartial({
      audience: { audit: { createdBy: (req?.audienceMember?.audit?.createdBy ?? "") } },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.previewAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = identityUserServiceApi.SearchUsersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (reply2?.audience?.owner?.userId ?? ""),
        region: (req?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const method3 = "searchUsers" as const;
    const invoke3: Unary<identityUserServiceApi.SearchUsersRequest, identityUserServiceApi.SearchUsersResponse> =
      (input, done) => this.identityUserClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<identityUserServiceApi.SearchUsersRequest, identityUserServiceApi.SearchUsersResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberResponse.fromPartial({
        audienceMember: { audit: { updatedBy: (reply2?.audience?.audit?.updatedBy ?? "") } },
      }),
      audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberResponse.fromPartial({
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
  async getAudienceMemberApprovalStatus(req: audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusRequest): Promise<audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.audienceMemberId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_member_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAudienceMemberApprovalStatus", req);
    this.logger.info("get_audience_member_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceApprovalServiceApi.EscalateAudienceRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const proxy1 = forwarding(this.audiencesAudienceApprovalClient);
    const invoke1: Unary<audiencesAudienceApprovalServiceApi.EscalateAudienceRequest, audiencesAudienceApprovalServiceApi.EscalateAudienceResponse> =
      (input, done) => proxy1.escalateAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceApprovalServiceApi.EscalateAudienceRequest, audiencesAudienceApprovalServiceApi.EscalateAudienceResponse>(invoke1, request1);
    const request2 = notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.audience?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.audience?.parameters ?? {}))),
        ownerId: (reply1?.audience?.audienceId ?? ""),
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.suggestNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesResponse>(invoke2, request2);
    return mergeResponses(
      audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusResponse.fromPartial({
        audienceMember: { contact: { email: (reply1?.audience?.owner?.email ?? "") } },
      }),
      audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusResponse.fromPartial({ audienceMember: { audienceMemberId: (req?.audienceMemberId ?? "") } }),
    );
  }

  /**
   * Lists audience members a page at a time.
   */
  async listPendingAudienceMembers(req: audiencesAudienceMemberApprovalServiceApi.ListPendingAudienceMembersRequest): Promise<audiencesAudienceMemberApprovalServiceApi.ListPendingAudienceMembersResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingAudienceMembers", req);
    this.logger.info("list_pending_audience_members", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncRequest.fromPartial({
      audienceSync: {
        occurredAt: req?.filter?.createdAfter,
        subject: { email: (req?.context?.actor?.email ?? "") },
      },
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.calculateAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = audiencesAudienceQueryServiceApi.BrowseAudiencesRequest.fromPartial({
      context: input2?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((input2?.filter?.labels ?? {}))),
      },
    });
    const invoke2: Unary<audiencesAudienceQueryServiceApi.BrowseAudiencesRequest, audiencesAudienceQueryServiceApi.BrowseAudiencesResponse> =
      (input, done) => this.audiencesAudienceQueryClient.browseAudiences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceQueryServiceApi.BrowseAudiencesRequest, audiencesAudienceQueryServiceApi.BrowseAudiencesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      audiencesAudienceMemberApprovalServiceApi.ListPendingAudienceMembersResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      audiencesAudienceMemberApprovalServiceApi.ListPendingAudienceMembersResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects an audience member.
   */
  async rejectAudienceMember(req: audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberRequest): Promise<audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "RejectAudienceMember", req);
    this.logger.info("reject_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = dispatchDispatchOrderServiceApi.UpdateDispatchOrderRequest.fromPartial({
      context: req?.context,
      dispatchOrder: {
        audit: { updatedAt: req?.audienceMember?.audit?.updatedAt },
        billingAddress: {
          countryCode: (req?.audienceMember?.primaryAddress?.countryCode ?? ""),
          region: (req?.audienceMember?.primaryAddress?.region ?? ""),
        },
        counterparty: {
          displayName: (req?.audienceMember?.relationshipManager?.displayName ?? ""),
        },
      },
    });
    const cloned1: dispatchDispatchOrderServiceApi.UpdateDispatchOrderRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<dispatchDispatchOrderServiceApi.UpdateDispatchOrderRequest, dispatchDispatchOrderServiceApi.UpdateDispatchOrderResponse> =
      (input, done) => this.dispatchDispatchOrderClient.updateDispatchOrder(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<dispatchDispatchOrderServiceApi.UpdateDispatchOrderRequest, dispatchDispatchOrderServiceApi.UpdateDispatchOrderResponse>(invoke1, cloned1);
    const request2 = audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceMember?.audit?.updatedAt,
        region: (req?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const decoded2 = audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest.fromJSON(
      JSON.parse(JSON.stringify(audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest.toJSON(request2))),
    );
    const invoke2: Unary<audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest, audiencesAudienceApprovalServiceApi.ListPendingAudiencesResponse> =
      (input, done) => this.audiencesAudienceApprovalClient.listPendingAudiences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest, audiencesAudienceApprovalServiceApi.ListPendingAudiencesResponse>(invoke2, decoded2);
    const request3 = audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberRequest.fromPartial({
      audienceMember: {
        identityDocument: { $case: "passport", passport: {
          number: ((req?.audienceMember?.identityDocument?.$case === "passport" ? req?.audienceMember?.identityDocument.passport : undefined)?.number ?? ""),
        } },
      },
      context: req?.context,
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.audiences.v1.QuoteAudienceMemberRequest",
      value: Buffer.from(audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberRequest.encode(request3).finish()),
    });
    const unpacked3 = audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberRequest.decode(envelope3.value);
    const invoke3: Unary<audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient.quoteAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberResponse>(invoke3, unpacked3);
    const request4 = surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (reply1?.dispatchOrder?.counterparty?.displayName ?? ""),
          email: (req?.audienceMember?.relationshipManager?.email ?? ""),
          userId: (req?.audienceMember?.relationshipManager?.userId ?? ""),
        },
      },
      surveyResponse: { subject: { email: (req?.audienceMember?.contact?.email ?? "") } },
    });
    const client4 = this.clients.get<surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient>("acme.surveys.v1.SurveyResponseApprovalService");
    const invoke4: Unary<surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse> =
      (input, done) => client4.recallSurveyResponse(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseRequest, surveysSurveyResponseApprovalServiceApi.RecallSurveyResponseResponse>(invoke4, request4);
    const request5 = notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.audienceMember?.audit?.createdAt,
        source: (req?.audienceMember?.audienceMemberId ?? ""),
        subject: {
          displayName: (req?.audienceMember?.relationshipManager?.displayName ?? ""),
        },
      } },
      context: req?.context,
    });
    const stream5 = this.notificationsDeliveryAttemptSyncClient.streamDeliveryAttemptChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberResponse.fromPartial({
        audienceMember: {
          primaryAddress: { lines: (reply1?.dispatchOrder?.billingAddress?.lines ?? []) },
          relationshipManager: { displayName: (reply1?.dispatchOrder?.counterparty?.displayName ?? "") },
        },
      }),
      audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberResponse.fromPartial({ audienceMember: { contact: { name: reply3?.audienceMember?.name } } }),
      audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberResponse.fromPartial({
        outcome: { status: (reply4?.outcome?.status ?? "") },
        result: { correlationId: (reply4?.surveyResponse?.correlationId ?? "") },
      }),
      audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          status: req?.audienceMember?.status,
        },
      }),
    );
  }

  /**
   * Submits an audience member.
   */
  async submitAudienceMember(req: audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberRequest): Promise<audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "SubmitAudienceMember", req);
    this.logger.info("submit_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceMember?.audit?.updatedAt,
        region: (req?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.browseNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = audiencesAudienceServiceApi.CreateAudienceRequest.fromPartial({
      audience: {
        audit: {
          createdAt: req?.audienceMember?.audit?.createdAt,
          updatedBy: (req?.audienceMember?.audit?.updatedBy ?? ""),
        },
        owner: { email: (req?.details?.approver?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceServiceApi.CreateAudienceRequest, audiencesAudienceServiceApi.CreateAudienceResponse> =
      (input, done) => this.audiencesAudienceClient.createAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<audiencesAudienceServiceApi.CreateAudienceRequest, audiencesAudienceServiceApi.CreateAudienceResponse>(invoke2, request2));
    const request3 = searchSearchIndexQueryServiceApi.CountSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.audience?.audit?.updatedAt,
        region: (req?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const invoke3: Unary<searchSearchIndexQueryServiceApi.CountSearchIndexesRequest, searchSearchIndexQueryServiceApi.CountSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.countSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("SubmitAudienceMember.CountSearchIndexes", () => call<searchSearchIndexQueryServiceApi.CountSearchIndexesRequest, searchSearchIndexQueryServiceApi.CountSearchIndexesResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          contact: req?.audienceMember?.contact,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for AudienceMemberApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceMemberApprovalHandler {
  constructor(@inject(AudienceMemberApprovalWorkflow) private readonly workflow: AudienceMemberApprovalWorkflow) {}

  /**
   * Approves an audience member.
   */
  approveAudienceMember = unary<audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.ApproveAudienceMemberResponse>(
    (request) => this.workflow.approveAudienceMember(request),
  );

  /**
   * Comments an audience member.
   */
  commentAudienceMemberApproval = unary<audiencesAudienceMemberApprovalServiceApi.CommentAudienceMemberApprovalRequest, audiencesAudienceMemberApprovalServiceApi.CommentAudienceMemberApprovalResponse>(
    (request) => this.workflow.commentAudienceMemberApproval(request),
  );

  /**
   * Escalates an audience member.
   */
  escalateAudienceMember = (call: ServerUnaryCall<audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberResponse>, done: sendUnaryData<audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberResponse>): void => {
    void this.workflow.escalateAudienceMember(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an audience member.
   */
  getAudienceMemberApprovalStatus = unary<audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusRequest, audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusResponse>(
    (request) => this.workflow.getAudienceMemberApprovalStatus(request),
  );

  /**
   * Lists audience members a page at a time.
   */
  listPendingAudienceMembers = unary<audiencesAudienceMemberApprovalServiceApi.ListPendingAudienceMembersRequest, audiencesAudienceMemberApprovalServiceApi.ListPendingAudienceMembersResponse>(
    (request) => this.workflow.listPendingAudienceMembers(request),
  );

  /**
   * Rejects an audience member.
   */
  rejectAudienceMember = (call: ServerUnaryCall<audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberResponse>, done: sendUnaryData<audiencesAudienceMemberApprovalServiceApi.RejectAudienceMemberResponse>): void => {
    void this.workflow.rejectAudienceMember(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits an audience member.
   */
  submitAudienceMember = unary<audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberResponse>(
    (request) => this.workflow.submitAudienceMember(request),
  );
}

export function implementation(handler: AudienceMemberApprovalHandler): audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceServer {
  return {
    approveAudienceMember: handler.approveAudienceMember,
    commentAudienceMemberApproval: handler.commentAudienceMemberApproval,
    escalateAudienceMember: handler.escalateAudienceMember,
    getAudienceMemberApprovalStatus: handler.getAudienceMemberApprovalStatus,
    listPendingAudienceMembers: handler.listPendingAudienceMembers,
    rejectAudienceMember: handler.rejectAudienceMember,
    submitAudienceMember: handler.submitAudienceMember,
  };
}
