/**
 * Runs the long-lived workflow that takes an audience sync from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as audiencesAudienceApprovalServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import * as audiencesAudienceMemberWorkflowServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceSyncLifecycleServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_lifecycle_service.js";
import * as audiencesAudienceSyncWorkflowServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_workflow_service.js";
import * as audiencesAudienceWorkflowServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_workflow_service.js";
import * as catalogProductQueryServiceApi from "../../../../.cache/proto/acme/catalog/v1/product_query_service.js";
import * as chatHandoffApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as documentsDocumentServiceApi from "../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as inventoryStockItemServiceApi from "../../../../.cache/proto/acme/inventory/v1/stock_item_service.js";
import * as mediaRenditionApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_approval_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary } from "../../../platform/rpc.js";
import { collect, upload, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toAudienceSyncRecord } from "../data/records.js";
import { AudiencesRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience sync operations and persist audit data.
 */
@injectable()
export class AudienceSyncWorkflowWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceApprovalService") private readonly audiencesAudienceApprovalClient: audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberWorkflowService") private readonly audiencesAudienceMemberWorkflowClient: audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncCalculationService") private readonly audiencesAudienceSyncCalculationClient: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncLifecycleService") private readonly audiencesAudienceSyncLifecycleClient: audiencesAudienceSyncLifecycleServiceApi.AudienceSyncLifecycleServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceWorkflowService") private readonly audiencesAudienceWorkflowClient: audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient,
    @inject("grpc:acme.catalog.v1.ProductQueryService") private readonly catalogProductQueryClient: catalogProductQueryServiceApi.ProductQueryServiceClient,
    @inject("grpc:acme.chat.v1.HandoffApprovalService") private readonly chatHandoffApprovalClient: chatHandoffApprovalServiceApi.HandoffApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.inventory.v1.StockItemService") private readonly inventoryStockItemClient: inventoryStockItemServiceApi.StockItemServiceClient,
    @inject("grpc:acme.media.v1.RenditionApprovalService") private readonly mediaRenditionApprovalClient: mediaRenditionApprovalServiceApi.RenditionApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryWorkflowService") private readonly webhooksWebhookDeliveryWorkflowClient: webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances an audience sync.
   */
  async advanceAudienceSyncWorkflow(req: audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowRequest): Promise<audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "AdvanceAudienceSyncWorkflow", req);
    this.logger.info("advance_audience_sync_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncRequest.fromPartial({
      audienceSyncId: (req?.audienceSync?.audienceSyncId ?? ""),
      context: req?.context,
      details: {
        newOwner: {
          displayName: (req?.audienceSync?.subject?.displayName ?? ""),
          email: (req?.audienceSync?.subject?.email ?? ""),
        },
        notifyContact: {
          name: req?.details?.notify?.name,
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.SuspendAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncLifecycleClient.suspendAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = chatHandoffApprovalServiceApi.CommentHandoffApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (reply1?.audienceSync?.subject?.email ?? "") } },
    });
    const reply2 = await this.workQueue.enqueue<chatHandoffApprovalServiceApi.CommentHandoffApprovalRequest, chatHandoffApprovalServiceApi.CommentHandoffApprovalResponse>(
      "acme.audiences.v1.AudienceSyncWorkflowService/AdvanceAudienceSyncWorkflow:1", request2,
    );
    const request3 = audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowRequest.fromPartial({
      audience: {
        owner: { displayName: (req?.audienceSync?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke3: Unary<audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowResponse> =
      (input, done) => this.audiencesAudienceWorkflowClient.pauseAudienceWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowResponse>(invoke3, request3));
    const request4 = inventoryStockItemServiceApi.CloneStockItemRequest.fromPartial({
      context: req?.context,
      stockItem: { owner: { email: (reply2?.handoff?.assignee?.email ?? "") } },
    });
    const invoke4: Unary<inventoryStockItemServiceApi.CloneStockItemRequest, inventoryStockItemServiceApi.CloneStockItemResponse> =
      (input, done) => this.inventoryStockItemClient.cloneStockItem(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<inventoryStockItemServiceApi.CloneStockItemResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowResponse.fromPartial({
        audienceSync: {
          subject: { displayName: (reply1?.audienceSync?.subject?.displayName ?? "") },
        },
      }),
      audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowResponse.fromPartial({
        audienceSync: { subject: { email: (reply4?.stockItem?.owner?.email ?? "") } },
        result: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      audiencesAudienceSyncWorkflowServiceApi.AdvanceAudienceSyncWorkflowResponse.fromPartial({
        audienceSync: {
          attributes: (req?.audienceSync?.attributes ?? {}),
          audienceSyncId: (req?.audienceSyncId ?? ""),
        },
      }),
    );
  }

  /**
   * Lists audience syncs a page at a time.
   */
  async listAudienceSyncWorkflows(req: audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsRequest): Promise<audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListAudienceSyncWorkflows", req);
    this.logger.info("list_audience_sync_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionApprovalServiceApi.RecallRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        audit: { updatedAt: req?.filter?.createdAfter },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<mediaRenditionApprovalServiceApi.RecallRenditionRequest, mediaRenditionApprovalServiceApi.RecallRenditionResponse> =
      (input, done) => this.mediaRenditionApprovalClient.recallRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = audiencesAudienceApprovalServiceApi.RecallAudienceRequest.fromPartial({
      audience: {
        name: (reply1?.rendition?.name ?? ""),
        owner: { userId: (reply1?.rendition?.owner?.userId ?? "") },
      },
      context: req?.context,
      details: {
        approver: {
          displayName: (reply1?.rendition?.owner?.displayName ?? ""),
          email: (reply1?.rendition?.owner?.email ?? ""),
        },
      },
    });
    const invoke2: Unary<audiencesAudienceApprovalServiceApi.RecallAudienceRequest, audiencesAudienceApprovalServiceApi.RecallAudienceResponse> =
      (input, done) => this.audiencesAudienceApprovalClient.recallAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsResponse.fromPartial({
        audienceSyncs: [{ measurements: [{ unit: (reply1?.rendition?.dimensions?.unit ?? "") }] }],
        result: { status: (reply1?.result?.status ?? "") },
      }),
      audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
    );
  }

  /**
   * Pauses an audience sync.
   */
  async pauseAudienceSyncWorkflow(req: audiencesAudienceSyncWorkflowServiceApi.PauseAudienceSyncWorkflowRequest): Promise<audiencesAudienceSyncWorkflowServiceApi.PauseAudienceSyncWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "PauseAudienceSyncWorkflow", req);
    this.logger.info("pause_audience_sync_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceSync?.occurredAt,
        ownerId: (req?.audienceSync?.subject?.audienceMemberId ?? ""),
      },
    });
    const method1 = "listPendingAudiences" as const;
    const invoke1: Unary<audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest, audiencesAudienceApprovalServiceApi.ListPendingAudiencesResponse> =
      (input, done) => this.audiencesAudienceApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceApprovalServiceApi.ListPendingAudiencesRequest, audiencesAudienceApprovalServiceApi.ListPendingAudiencesResponse>(invoke1, request1);
    const request2 = audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncRequest.fromPartial({
      audienceSyncId: (req?.audienceSync?.audienceSyncId ?? ""),
      context: req?.context,
      details: {
        newOwner: { email: (req?.details?.notify?.email ?? "") },
        notifyContact: {
          email: (req?.audienceSync?.subject?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.audiencesAudienceSyncLifecycleClient);
    const invoke2: Unary<audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncResponse> =
      (input, done) => proxy2.terminateAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.TerminateAudienceSyncResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncWorkflowServiceApi.PauseAudienceSyncWorkflowResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      audiencesAudienceSyncWorkflowServiceApi.PauseAudienceSyncWorkflowResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      audiencesAudienceSyncWorkflowServiceApi.PauseAudienceSyncWorkflowResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          kind: (req?.audienceSync?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes an audience sync.
   */
  async resumeAudienceSyncWorkflow(req: audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowRequest): Promise<audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "ResumeAudienceSyncWorkflow", req);
    this.logger.info("resume_audience_sync_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowResponse>> = [];
    for (const item of (req?.audienceSync?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowRequest.fromPartial({
          audienceMember: { audit: { updatedAt: item?.observedAt } },
          context: req?.context,
        });
        const invoke1: Unary<audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowResponse> =
          (input, done) => this.audiencesAudienceMemberWorkflowClient.signalAudienceMemberWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? audiencesAudienceMemberWorkflowServiceApi.SignalAudienceMemberWorkflowResponse.fromPartial({});
    const request2 = audiencesAudienceApprovalServiceApi.CommentAudienceApprovalRequest.fromPartial({
      audience: {
        owner: {
          email: (reply1?.audienceMember?.contact?.email ?? ""),
          userId: (reply1?.audienceMember?.relationshipManager?.userId ?? ""),
        },
      },
      context: req?.context,
      details: {
        approver: {
          displayName: (reply1?.audienceMember?.relationshipManager?.displayName ?? ""),
        },
      },
    });
    const invoke2: Unary<audiencesAudienceApprovalServiceApi.CommentAudienceApprovalRequest, audiencesAudienceApprovalServiceApi.CommentAudienceApprovalResponse> =
      (input, done) => this.audiencesAudienceApprovalClient.commentAudienceApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceApprovalServiceApi.CommentAudienceApprovalRequest, audiencesAudienceApprovalServiceApi.CommentAudienceApprovalResponse>(invoke2, request2);
    const request3 = audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncRequest.fromPartial({
      audienceSync: { subject: { email: (req?.audienceSync?.subject?.email ?? "") } },
      context: req?.context,
      details: {
        destination: {
          lines: (reply1?.audienceMember?.primaryAddress?.lines ?? []).map((value) => value),
          locality: (reply1?.audienceMember?.primaryAddress?.locality ?? ""),
        },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.quoteAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowResponse.fromPartial({
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowResponse.fromPartial({
        audienceSync: {
          subject: {
            audienceMemberId: (reply3?.audienceSync?.subject?.audienceMemberId ?? ""),
          },
        },
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
      }),
      audiencesAudienceSyncWorkflowServiceApi.ResumeAudienceSyncWorkflowResponse.fromPartial({
        audienceSync: {
          attributes: (req?.audienceSync?.attributes ?? {}),
          audienceSyncId: (req?.audienceSyncId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys an audience sync.
   */
  async retryAudienceSyncWorkflow(req: audiencesAudienceSyncWorkflowServiceApi.RetryAudienceSyncWorkflowRequest): Promise<audiencesAudienceSyncWorkflowServiceApi.RetryAudienceSyncWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "RetryAudienceSyncWorkflow", req);
    this.logger.info("retry_audience_sync_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = catalogProductQueryServiceApi.ResolveProductsRequest.fromPartial({ context: input1?.context });
    const invoke1: Unary<catalogProductQueryServiceApi.ResolveProductsRequest, catalogProductQueryServiceApi.ResolveProductsResponse> =
      (input, done) => this.catalogProductQueryClient.resolveProducts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<catalogProductQueryServiceApi.ResolveProductsRequest, catalogProductQueryServiceApi.ResolveProductsResponse>(invoke1, request1);
    const request2 = audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.audienceSync?.subject?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const cloned2: audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse> =
      (input, done) => this.audiencesAudienceMemberWorkflowClient.cancelAudienceMemberWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.CancelAudienceMemberWorkflowResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncWorkflowServiceApi.RetryAudienceSyncWorkflowResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      audiencesAudienceSyncWorkflowServiceApi.RetryAudienceSyncWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      audiencesAudienceSyncWorkflowServiceApi.RetryAudienceSyncWorkflowResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          subject: req?.audienceSync?.subject,
        },
      }),
    );
  }

  /**
   * Signals an audience sync.
   */
  async signalAudienceSyncWorkflow(req: audiencesAudienceSyncWorkflowServiceApi.SignalAudienceSyncWorkflowRequest): Promise<audiencesAudienceSyncWorkflowServiceApi.SignalAudienceSyncWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "SignalAudienceSyncWorkflow", req);
    this.logger.info("signal_audience_sync_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.audienceSync?.subject?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const decoded1 = webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest.fromJSON(
      JSON.parse(JSON.stringify(webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest.toJSON(request1))),
    );
    const invoke1: Unary<webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse> =
      (input, done) => this.webhooksWebhookDeliveryWorkflowClient.signalWebhookDeliveryWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse>(invoke1, decoded1);
    const request2 = personalizationRecommendationSyncServiceApi.StreamRecommendationChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        counterparty: {
          displayName: (req?.audienceSync?.subject?.displayName ?? ""),
          email: (req?.audienceSync?.subject?.email ?? ""),
        },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.audienceSync?.attributes ?? {}))),
        }],
      } },
      context: req?.context,
    });
    const stream2 = this.personalizationRecommendationSyncClient.streamRecommendationChanges(metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const reading2 = collect(stream2);
    const writing2 = (async () => {
      await write(stream2, request2);
      stream2.end();
    })();
    const [messages2] = await Promise.all([reading2, writing2]);
    const reply2 = messages2.at(-1) ?? personalizationRecommendationSyncServiceApi.StreamRecommendationChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncWorkflowServiceApi.SignalAudienceSyncWorkflowResponse.fromPartial({ audienceSync: { sequence: (reply1?.webhookDelivery?.sequence ?? 0) } }),
      audiencesAudienceSyncWorkflowServiceApi.SignalAudienceSyncWorkflowResponse.fromPartial({
        audienceSync: {
          attributes: (req?.audienceSync?.attributes ?? {}),
          audienceSyncId: (req?.audienceSyncId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts an audience sync.
   */
  async startAudienceSyncWorkflow(req: audiencesAudienceSyncWorkflowServiceApi.StartAudienceSyncWorkflowRequest): Promise<audiencesAudienceSyncWorkflowServiceApi.StartAudienceSyncWorkflowResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "StartAudienceSyncWorkflow", req);
    this.logger.info("start_audience_sync_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentServiceApi.WatchDocumentsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.audienceSync?.subject?.email ?? ""),
        preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.documentsDocumentClient.watchDocuments(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? documentsDocumentServiceApi.WatchDocumentsResponse.fromPartial({});
    const request2 = audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceSync?.occurredAt,
        ownerId: (req?.audienceSync?.subject?.audienceMemberId ?? ""),
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.audiences.v1.ListAudienceMemberWorkflowsRequest",
      value: Buffer.from(audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsRequest.encode(request2).finish()),
    });
    const unpacked2 = audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsRequest.decode(envelope2.value);
    const invoke2: Unary<audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsRequest, audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsResponse> =
      (input, done) => this.audiencesAudienceMemberWorkflowClient.listAudienceMemberWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsRequest, audiencesAudienceMemberWorkflowServiceApi.ListAudienceMemberWorkflowsResponse>(invoke2, unpacked2);
    const request3 = communityForumServiceApi.BatchCreateForumsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.audienceSync?.source ?? ""),
        submittedBy: req?.details?.notify,
      } },
      sequence: (req?.audienceSync?.sequence ?? 0),
    });
    const reply3 = await upload<communityForumServiceApi.BatchCreateForumsRequest, communityForumServiceApi.BatchCreateForumsResponse>(
      (done) => this.communityForumClient.batchCreateForums(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncWorkflowServiceApi.StartAudienceSyncWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      audiencesAudienceSyncWorkflowServiceApi.StartAudienceSyncWorkflowResponse.fromPartial({
        audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") },
        result: { correlationId: (req?.audienceSync?.correlationId ?? "") },
      }),
    );
  }
}
