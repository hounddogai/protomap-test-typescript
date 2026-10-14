/**
 * Routes audiences through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceApprovalServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import * as audiencesAudienceMemberQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_query_service.js";
import * as audiencesAudienceQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import * as audiencesAudienceServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceSyncValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as authorizationAccessPolicyValidationServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as chatChatRoomServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as datasetsDatasetServiceApi from "../../../../.cache/proto/acme/datasets/v1/dataset_service.js";
import * as formsFormSubmissionWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_workflow_service.js";
import * as maintenanceWorkOrderQueryServiceApi from "../../../../.cache/proto/acme/maintenance/v1/work_order_query_service.js";
import * as mediaRenditionSyncServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as messagingConversationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_service.js";
import * as venuesVenueQueryServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { collect, upload, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toAudienceRecord } from "../data/records.js";
import { AudiencesRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience operations and persist audit data.
 */
@injectable()
export class AudienceApprovalWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberQueryService") private readonly audiencesAudienceMemberQueryClient: audiencesAudienceMemberQueryServiceApi.AudienceMemberQueryServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceQueryService") private readonly audiencesAudienceQueryClient: audiencesAudienceQueryServiceApi.AudienceQueryServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceService") private readonly audiencesAudienceClient: audiencesAudienceServiceApi.AudienceServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncCalculationService") private readonly audiencesAudienceSyncCalculationClient: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncValidationService") private readonly audiencesAudienceSyncValidationClient: audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceValidationService") private readonly audiencesAudienceValidationClient: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.datasets.v1.DatasetService") private readonly datasetsDatasetClient: datasetsDatasetServiceApi.DatasetServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionWorkflowService") private readonly formsFormSubmissionWorkflowClient: formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient,
    @inject("grpc:acme.maintenance.v1.WorkOrderQueryService") private readonly maintenanceWorkOrderQueryClient: maintenanceWorkOrderQueryServiceApi.WorkOrderQueryServiceClient,
    @inject("grpc:acme.media.v1.RenditionSyncService") private readonly mediaRenditionSyncClient: mediaRenditionSyncServiceApi.RenditionSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationService") private readonly messagingConversationClient: messagingConversationServiceApi.ConversationServiceClient,
    @inject("grpc:acme.venues.v1.VenueQueryService") private readonly venuesVenueQueryClient: venuesVenueQueryServiceApi.VenueQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves an audience.
   */
  async approveAudience(req: audiencesAudienceApprovalServiceApi.ApproveAudienceRequest): Promise<audiencesAudienceApprovalServiceApi.ApproveAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "ApproveAudience", req);
    this.logger.info("approve_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceServiceApi.UpdateAudienceRequest.fromPartial({
      audience: {
        audit: {
          etag: (req?.audience?.audit?.etag ?? ""),
          updatedAt: req?.audience?.audit?.updatedAt,
        },
        action: { $case: "discount", discount: {
          percent: ((req?.audience?.action?.$case === "discount" ? req?.audience?.action.discount : undefined)?.percent ?? 0),
        } },
        owner: { email: (req?.audience?.owner?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<audiencesAudienceServiceApi.UpdateAudienceRequest, audiencesAudienceServiceApi.UpdateAudienceResponse> =
      (input, done) => this.audiencesAudienceClient.updateAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<audiencesAudienceServiceApi.UpdateAudienceResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = audiencesAudienceValidationServiceApi.LintAudiencesRequest.fromPartial({
      audience: {
        audit: { updatedBy: (req?.audience?.audit?.updatedBy ?? "") },
        action: { $case: "discount", discount: {
          percent: ((reply1?.audience?.action?.$case === "discount" ? reply1?.audience?.action.discount : undefined)?.percent ?? 0),
        } },
      },
      context: req?.context,
      details: { contact: { email: (reply1?.audience?.owner?.email ?? "") } },
    });
    const invoke2: Unary<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse> =
      (input, done) => this.audiencesAudienceValidationClient.lintAudiences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = messagingConversationServiceApi.BatchCreateConversationsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.audience?.audienceId ?? ""),
        submittedBy: { email: (req?.audience?.owner?.email ?? "") },
      } },
    });
    const reply3 = await upload<messagingConversationServiceApi.BatchCreateConversationsRequest, messagingConversationServiceApi.BatchCreateConversationsResponse>(
      (done) => this.messagingConversationClient.batchCreateConversations(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceApprovalServiceApi.ApproveAudienceResponse.fromPartial({
        audience: { audit: { createdAt: reply1?.audience?.audit?.createdAt } },
      }),
      audiencesAudienceApprovalServiceApi.ApproveAudienceResponse.fromPartial({
        audience: {
          effective: reply2?.audience?.effective,
          owner: reply2?.audience?.owner,
        },
      }),
      audiencesAudienceApprovalServiceApi.ApproveAudienceResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          priority: (req?.audience?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Comments an audience.
   */
  async commentAudienceApproval(req: audiencesAudienceApprovalServiceApi.CommentAudienceApprovalRequest): Promise<audiencesAudienceApprovalServiceApi.CommentAudienceApprovalResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "CommentAudienceApproval", req);
    this.logger.info("comment_audience_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.audience?.conditions ?? []).map(async (item) => {
      const request1 = audiencesAudienceValidationServiceApi.LintAudiencesRequest.fromPartial({
        audience: {
          conditions: [{
            attribute: (item?.attribute ?? ""),
            negate: (item?.negate ?? false),
            operator: (item?.operator ?? ""),
            value: (item?.value ?? ""),
          }],
        },
        context: req?.context,
      });
      const invoke1: Unary<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse> =
        (input, done) => this.audiencesAudienceValidationClient.lintAudiences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? audiencesAudienceValidationServiceApi.LintAudiencesResponse.fromPartial({});
    const request2 = audiencesAudienceQueryServiceApi.ExportAudiencesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: reply1?.audience?.audit?.updatedAt },
    });
    const stream2 = this.audiencesAudienceQueryClient.exportAudiences(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? audiencesAudienceQueryServiceApi.ExportAudiencesResponse.fromPartial({});
    const request3 = mediaRenditionSyncServiceApi.StreamRenditionChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        components: { primary: { componentId: (req?.audience?.audienceId ?? "") } },
        name: (req?.audience?.name ?? ""),
        specs: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      } },
      context: req?.context,
    });
    const stream3 = this.mediaRenditionSyncClient.streamRenditionChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? mediaRenditionSyncServiceApi.StreamRenditionChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return audiencesAudienceApprovalServiceApi.CommentAudienceApprovalResponse.fromPartial({
      audience: {
        audienceId: (req?.audienceId ?? ""),
        priority: (req?.audience?.priority ?? 0),
      },
    });
  }

  /**
   * Delegates an audience.
   */
  async delegateAudienceApproval(req: audiencesAudienceApprovalServiceApi.DelegateAudienceApprovalRequest): Promise<audiencesAudienceApprovalServiceApi.DelegateAudienceApprovalResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "DelegateAudienceApproval", req);
    this.logger.info("delegate_audience_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = maintenanceWorkOrderQueryServiceApi.ExportWorkOrdersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audience?.audit?.updatedAt,
        ownerId: (req?.audience?.owner?.userId ?? ""),
      },
    });
    const stream1 = this.maintenanceWorkOrderQueryClient.exportWorkOrders(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? maintenanceWorkOrderQueryServiceApi.ExportWorkOrdersResponse.fromPartial({});
    let selected2_1: string | undefined;
    switch (req?.audience?.action?.$case) {
      case "block":
        selected2_1 = ((req?.audience?.action?.$case === "block" ? req?.audience?.action.block : undefined)?.notifyEmail ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = audiencesAudienceServiceApi.CreateAudienceRequest.fromPartial({
      audience: {
        audit: { updatedAt: req?.audience?.audit?.updatedAt },
        action: { $case: "block", block: { notifyEmail: (selected2_1 ?? "") } },
        owner: {
          email: (req?.audience?.owner?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceServiceApi.CreateAudienceRequest, audiencesAudienceServiceApi.CreateAudienceResponse> =
      (input, done) => this.audiencesAudienceClient.createAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceServiceApi.CreateAudienceRequest, audiencesAudienceServiceApi.CreateAudienceResponse>(invoke2, request2);
    const request3 = audiencesAudienceValidationServiceApi.ScoreAudienceRequest.fromPartial({
      audience: {
        action: { $case: "route", route: {
          weight: ((reply2?.audience?.action?.$case === "route" ? reply2?.audience?.action.route : undefined)?.weight ?? 0),
        } },
      },
      context: req?.context,
    });
    const method3 = "scoreAudience" as const;
    const invoke3: Unary<audiencesAudienceValidationServiceApi.ScoreAudienceRequest, audiencesAudienceValidationServiceApi.ScoreAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<audiencesAudienceValidationServiceApi.ScoreAudienceRequest, audiencesAudienceValidationServiceApi.ScoreAudienceResponse>(invoke3, request3);
    const request4 = formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (reply2?.audience?.owner?.email ?? "") } },
      formSubmission: {
        subject: {
          displayName: (reply2?.audience?.owner?.displayName ?? ""),
          version: (req?.audience?.version ?? 0),
        },
      },
    });
    const proxy4 = forwarding(this.formsFormSubmissionWorkflowClient);
    const invoke4: Unary<formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowResponse> =
      (input, done) => proxy4.advanceFormSubmissionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceApprovalServiceApi.DelegateAudienceApprovalResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      audiencesAudienceApprovalServiceApi.DelegateAudienceApprovalResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      audiencesAudienceApprovalServiceApi.DelegateAudienceApprovalResponse.fromPartial({
        outcome: { effectiveAt: reply4?.outcome?.effectiveAt },
        result: { correlationId: (reply4?.formSubmission?.correlationId ?? "") },
      }),
      audiencesAudienceApprovalServiceApi.DelegateAudienceApprovalResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          name: (req?.audience?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates an audience.
   */
  async escalateAudience(req: audiencesAudienceApprovalServiceApi.EscalateAudienceRequest): Promise<audiencesAudienceApprovalServiceApi.EscalateAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "EscalateAudience", req);
    this.logger.info("escalate_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.audience?.conditions ?? []).map(async (item) => {
      const request1 = audiencesAudienceValidationServiceApi.PreviewAudienceRequest.fromPartial({
        audience: { conditions: [{ negate: (item?.negate ?? false) }] },
        context: req?.context,
      });
      const invoke1: Unary<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse> =
        (input, done) => this.audiencesAudienceValidationClient.previewAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: audiencesAudienceValidationServiceApi.PreviewAudienceResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? audiencesAudienceValidationServiceApi.PreviewAudienceResponse.fromPartial({});
    const request2 = audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest.fromPartial({
      audienceSync: { subject: { displayName: (req?.details?.approver?.displayName ?? "") } },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.simulateAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceApprovalServiceApi.EscalateAudienceResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      audiencesAudienceApprovalServiceApi.EscalateAudienceResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          description: (req?.audience?.description ?? ""),
        },
      }),
    );
  }

  /**
   * Returns an audience.
   */
  async getAudienceApprovalStatus(req: audiencesAudienceApprovalServiceApi.GetAudienceApprovalStatusRequest): Promise<audiencesAudienceApprovalServiceApi.GetAudienceApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.audienceId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAudienceApprovalStatus", req);
    this.logger.info("get_audience_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsRequest.fromPartial({
      audienceSync: {
        measurements: [{ observedAt: req?.context?.deadline }],
        source: (req?.audienceId ?? ""),
        subject: { email: (req?.context?.actor?.email ?? "") },
      },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsRequest, audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.recalculateAudienceSyncs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsRequest, audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsResponse>(invoke1, spread1);
    return mergeResponses(
      audiencesAudienceApprovalServiceApi.GetAudienceApprovalStatusResponse.fromPartial({
        audience: {
          owner: { displayName: (reply1?.audienceSync?.subject?.displayName ?? "") },
        },
      }),
      audiencesAudienceApprovalServiceApi.GetAudienceApprovalStatusResponse.fromPartial({ audience: { audienceId: (req?.audienceId ?? "") } }),
    );
  }

  /**
   * Lists audiences a page at a time.
   */
  async listPendingAudiences(req: audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest): Promise<audiencesAudienceApprovalServiceApi.ListPendingAudiencesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingAudiences", req);
    this.logger.info("list_pending_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = venuesVenueQueryServiceApi.BrowseVenuesRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.filter?.createdAfter,
        query: (input1?.filter?.query ?? ""),
        region: (input1?.filter?.region ?? ""),
      },
    });
    const invoke1: Unary<venuesVenueQueryServiceApi.BrowseVenuesRequest, venuesVenueQueryServiceApi.BrowseVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient.browseVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueQueryServiceApi.BrowseVenuesRequest, venuesVenueQueryServiceApi.BrowseVenuesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceApprovalServiceApi.ListPendingAudiencesResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } });
  }

  /**
   * Recalls an audience.
   */
  async recallAudience(req: audiencesAudienceApprovalServiceApi.RecallAudienceRequest): Promise<audiencesAudienceApprovalServiceApi.RecallAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "RecallAudience", req);
    this.logger.info("recall_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.audience?.owner?.email ?? "") } },
    });
    const cloned1: audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncValidationClient.previewAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncResponse>(invoke1, cloned1);
    const tasks2: Array<() => Promise<audiencesAudienceValidationServiceApi.LintAudiencesResponse>> = [];
    for (const item of (req?.audience?.conditions ?? [])) {
      tasks2.push(async () => {
        const request2 = audiencesAudienceValidationServiceApi.LintAudiencesRequest.fromPartial({
          audience: {
            conditions: [{
              attribute: (item?.attribute ?? ""),
              operator: (item?.operator ?? ""),
            }],
          },
          context: req?.context,
        });
        const invoke2: Unary<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse> =
          (input, done) => this.audiencesAudienceValidationClient.lintAudiences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? audiencesAudienceValidationServiceApi.LintAudiencesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceApprovalServiceApi.RecallAudienceResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      audiencesAudienceApprovalServiceApi.RecallAudienceResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          description: (req?.audience?.description ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects an audience.
   */
  async rejectAudience(req: audiencesAudienceApprovalServiceApi.RejectAudienceRequest): Promise<audiencesAudienceApprovalServiceApi.RejectAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "RejectAudience", req);
    this.logger.info("reject_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueQueryServiceApi.SuggestVenuesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.audience?.audit?.createdAt },
    });
    const decoded1 = venuesVenueQueryServiceApi.SuggestVenuesRequest.fromJSON(
      JSON.parse(JSON.stringify(venuesVenueQueryServiceApi.SuggestVenuesRequest.toJSON(request1))),
    );
    const invoke1: Unary<venuesVenueQueryServiceApi.SuggestVenuesRequest, venuesVenueQueryServiceApi.SuggestVenuesResponse> =
      (input, done) => this.venuesVenueQueryClient.suggestVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueQueryServiceApi.SuggestVenuesRequest, venuesVenueQueryServiceApi.SuggestVenuesResponse>(invoke1, decoded1);
    const request2 = audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest.fromPartial({ context: req?.context });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.audiences.v1.ResolveAudienceMembersRequest",
      value: Buffer.from(audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest.encode(request2).finish()),
    });
    const unpacked2 = audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest.decode(envelope2.value);
    const invoke2: Unary<audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse> =
      (input, done) => this.audiencesAudienceMemberQueryClient.resolveAudienceMembers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceApprovalServiceApi.RejectAudienceResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      audiencesAudienceApprovalServiceApi.RejectAudienceResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      audiencesAudienceApprovalServiceApi.RejectAudienceResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          effective: req?.audience?.effective,
        },
      }),
    );
  }

  /**
   * Submits an audience.
   */
  async submitAudience(req: audiencesAudienceApprovalServiceApi.SubmitAudienceRequest): Promise<audiencesAudienceApprovalServiceApi.SubmitAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "SubmitAudience", req);
    this.logger.info("submit_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.audience?.conditions ?? []).map(async (item) => {
      const request1 = audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest.fromPartial({
        audience: {
          conditions: [{
            attribute: (item?.attribute ?? ""),
            negate: (item?.negate ?? false),
          }],
        },
        context: req?.context,
      });
      const invoke1: Unary<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse> =
        (input, done) => this.audiencesAudienceValidationClient.checkAudienceEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse.fromPartial({});
    const request2 = audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncRequest.fromPartial({
      audienceSync: {
        subject: {
          displayName: (reply1?.audience?.owner?.displayName ?? ""),
          email: (reply1?.audience?.owner?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const client2 = this.clients.get<audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient>("acme.audiences.v1.AudienceSyncValidationService");
    const invoke2: Unary<audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncResponse> =
      (input, done) => client2.normalizeAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncResponse>(invoke2, request2);
    const request3 = datasetsDatasetServiceApi.BatchGetDatasetsRequest.fromPartial({ context: req?.context });
    const invoke3: Unary<datasetsDatasetServiceApi.BatchGetDatasetsRequest, datasetsDatasetServiceApi.BatchGetDatasetsResponse> =
      (input, done) => this.datasetsDatasetClient.batchGetDatasets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<datasetsDatasetServiceApi.BatchGetDatasetsRequest, datasetsDatasetServiceApi.BatchGetDatasetsResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    const request4 = authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyRequest.fromPartial({
      accessPolicy: {
        action: { $case: "discount", discount: {
          percent: ((req?.audience?.action?.$case === "discount" ? req?.audience?.action.discount : undefined)?.percent ?? 0),
        } },
        owner: { displayName: (req?.audience?.owner?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke4: Unary<authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.normalizeAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyResponse>(invoke4, request4));
    const request5 = chatChatRoomServiceApi.BatchCreateChatRoomsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.audience?.audienceId ?? ""),
        submittedBy: { email: (req?.audience?.owner?.email ?? "") },
      } },
    });
    const reply5 = await upload<chatChatRoomServiceApi.BatchCreateChatRoomsRequest, chatChatRoomServiceApi.BatchCreateChatRoomsResponse>(
      (done) => this.chatChatRoomClient.batchCreateChatRooms(metadataFor(request5.context), { deadline: Date.now() + 15_000 }, done), [request5],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceApprovalServiceApi.SubmitAudienceResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      audiencesAudienceApprovalServiceApi.SubmitAudienceResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      audiencesAudienceApprovalServiceApi.SubmitAudienceResponse.fromPartial({
        audience: { audit: { createdBy: (reply4?.accessPolicy?.audit?.createdBy ?? "") } },
      }),
      audiencesAudienceApprovalServiceApi.SubmitAudienceResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          name: (req?.audience?.name ?? ""),
        },
      }),
    );
  }
}
