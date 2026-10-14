/**
 * Routes variants through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as documentsDocumentQueryServiceApi from "../../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as experimentsVariantApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import * as experimentsVariantLifecycleServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_lifecycle_service.js";
import * as experimentsVariantReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect, upload, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toVariantRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate variant operations and persist audit data.
 */
@injectable()
export class VariantApprovalWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceService") private readonly audiencesAudienceClient: audiencesAudienceServiceApi.AudienceServiceClient,
    @inject("grpc:acme.documents.v1.DocumentQueryService") private readonly documentsDocumentQueryClient: documentsDocumentQueryServiceApi.DocumentQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentApprovalService") private readonly experimentsExperimentApprovalClient: experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentQueryService") private readonly experimentsExperimentQueryClient: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.experiments.v1.VariantLifecycleService") private readonly experimentsVariantLifecycleClient: experimentsVariantLifecycleServiceApi.VariantLifecycleServiceClient,
    @inject("grpc:acme.experiments.v1.VariantReportingService") private readonly experimentsVariantReportingClient: experimentsVariantReportingServiceApi.VariantReportingServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a variant.
   */
  async approveVariant(req: experimentsVariantApprovalServiceApi.ApproveVariantRequest): Promise<experimentsVariantApprovalServiceApi.ApproveVariantResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "ApproveVariant", req);
    this.logger.info("approve_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.variant?.action?.$case) {
      case "block":
        selected1_2 = ((req?.variant?.action?.$case === "block" ? req?.variant?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = experimentsVariantReportingServiceApi.ScheduleVariantReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { period: req?.variant?.effective },
      reason: (selected1_2 ?? ""),
      variantId: (req?.variantId ?? ""),
    });
    const invoke1: Unary<experimentsVariantReportingServiceApi.ScheduleVariantReportRequest, experimentsVariantReportingServiceApi.ScheduleVariantReportResponse> =
      (input, done) => this.experimentsVariantReportingClient.scheduleVariantReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantReportingServiceApi.ScheduleVariantReportRequest, experimentsVariantReportingServiceApi.ScheduleVariantReportResponse>(invoke1, request1);
    const request2 = experimentsExperimentApprovalServiceApi.ApproveExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: {
          createdAt: req?.variant?.audit?.createdAt,
          updatedAt: req?.variant?.audit?.updatedAt,
        },
        participants: [{ contact: { email: (req?.variant?.owner?.email ?? "") } }],
      },
    });
    const decoded2 = experimentsExperimentApprovalServiceApi.ApproveExperimentRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExperimentApprovalServiceApi.ApproveExperimentRequest.toJSON(request2))),
    );
    const invoke2: Unary<experimentsExperimentApprovalServiceApi.ApproveExperimentRequest, experimentsExperimentApprovalServiceApi.ApproveExperimentResponse> =
      (input, done) => this.experimentsExperimentApprovalClient.approveExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentApprovalServiceApi.ApproveExperimentRequest, experimentsExperimentApprovalServiceApi.ApproveExperimentResponse>(invoke2, decoded2);
    const request3 = identityUserQueryServiceApi.PeekUserRequest.fromPartial({
      context: req?.context,
      userId: (req?.variant?.owner?.userId ?? ""),
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.identity.v1.PeekUserRequest",
      value: Buffer.from(identityUserQueryServiceApi.PeekUserRequest.encode(request3).finish()),
    });
    const unpacked3 = identityUserQueryServiceApi.PeekUserRequest.decode(envelope3.value);
    const invoke3: Unary<identityUserQueryServiceApi.PeekUserRequest, identityUserQueryServiceApi.PeekUserResponse> =
      (input, done) => this.identityUserQueryClient.peekUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<identityUserQueryServiceApi.PeekUserRequest, identityUserQueryServiceApi.PeekUserResponse>(invoke3, unpacked3);
    const request4 = documentsDocumentQueryServiceApi.SuggestDocumentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.variant?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (req?.variant?.owner?.userId ?? ""),
        region: (reply2?.experiment?.location?.region ?? ""),
      },
    });
    const client4 = this.clients.get<documentsDocumentQueryServiceApi.DocumentQueryServiceClient>("acme.documents.v1.DocumentQueryService");
    const invoke4: Unary<documentsDocumentQueryServiceApi.SuggestDocumentsRequest, documentsDocumentQueryServiceApi.SuggestDocumentsResponse> =
      (input, done) => client4.suggestDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<documentsDocumentQueryServiceApi.SuggestDocumentsRequest, documentsDocumentQueryServiceApi.SuggestDocumentsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantApprovalServiceApi.ApproveVariantResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      experimentsVariantApprovalServiceApi.ApproveVariantResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        variant: { owner: { userId: (reply2?.experiment?.organizer?.userId ?? "") } },
      }),
      experimentsVariantApprovalServiceApi.ApproveVariantResponse.fromPartial({
        result: { message: (reply3?.result?.message ?? "") },
        variant: { audit: { updatedBy: (reply3?.user?.audit?.updatedBy ?? "") } },
      }),
      experimentsVariantApprovalServiceApi.ApproveVariantResponse.fromPartial({
        result: {
          referenceIds: (reply4?.result?.referenceIds ?? []),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      experimentsVariantApprovalServiceApi.ApproveVariantResponse.fromPartial({
        variant: {
          variantId: (req?.variantId ?? ""),
          version: (req?.variant?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Comments a variant.
   */
  async commentVariantApproval(req: experimentsVariantApprovalServiceApi.CommentVariantApprovalRequest): Promise<experimentsVariantApprovalServiceApi.CommentVariantApprovalResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "CommentVariantApproval", req);
    this.logger.info("comment_variant_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentQueryServiceApi.SuggestExperimentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.variant?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.variant?.parameters ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
      },
    });
    const invoke1: Unary<experimentsExperimentQueryServiceApi.SuggestExperimentsRequest, experimentsExperimentQueryServiceApi.SuggestExperimentsResponse> =
      (input, done) => this.experimentsExperimentQueryClient.suggestExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<experimentsExperimentQueryServiceApi.SuggestExperimentsRequest, experimentsExperimentQueryServiceApi.SuggestExperimentsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantApprovalServiceApi.CommentVariantApprovalResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      experimentsVariantApprovalServiceApi.CommentVariantApprovalResponse.fromPartial({
        variant: {
          variantId: (req?.variantId ?? ""),
          version: (req?.variant?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Delegates a variant.
   */
  async delegateVariantApproval(req: experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest): Promise<experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "DelegateVariantApproval", req);
    this.logger.info("delegate_variant_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.variant?.owner?.userId ?? "") } },
      experiment: {
        audit: { etag: (req?.variant?.audit?.etag ?? "") },
        organizer: { displayName: (req?.variant?.owner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalRequest, experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalResponse> =
      (input, done) => this.experimentsExperimentApprovalClient.delegateExperimentApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalRequest, experimentsExperimentApprovalServiceApi.DelegateExperimentApprovalResponse>(invoke1, request1));
    const request2 = experimentsExposureSyncServiceApi.SyncExposuresRequest.fromPartial({
      context: req?.context,
      exposure: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { experimentId: (reply1?.experiment?.experimentId ?? "") },
      },
    });
    const invoke2: Unary<experimentsExposureSyncServiceApi.SyncExposuresRequest, experimentsExposureSyncServiceApi.SyncExposuresResponse> =
      (input, done) => this.experimentsExposureSyncClient.syncExposures(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("DelegateVariantApproval.SyncExposures", () => call<experimentsExposureSyncServiceApi.SyncExposuresRequest, experimentsExposureSyncServiceApi.SyncExposuresResponse>(invoke2, request2));
    const request3 = experimentsVariantSyncServiceApi.PushVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        audit: {
          createdAt: req?.variant?.audit?.createdAt,
          updatedBy: (reply1?.experiment?.audit?.updatedBy ?? ""),
        },
        action: { $case: "discount", discount: {
          amount: (req?.variant?.action?.$case === "discount" ? req?.variant?.action.discount : undefined)?.amount,
        } },
      },
    });
    const invoke3: Unary<experimentsVariantSyncServiceApi.PushVariantRequest, experimentsVariantSyncServiceApi.PushVariantResponse> =
      (input, done) => this.experimentsVariantSyncClient.pushVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = experimentsExperimentApprovalServiceApi.ApproveExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { createdBy: (reply3?.variant?.audit?.createdBy ?? "") },
        organizer: { userId: (req?.details?.approver?.userId ?? "") },
      },
    });
    const reply4 = await this.workQueue.enqueue<experimentsExperimentApprovalServiceApi.ApproveExperimentRequest, experimentsExperimentApprovalServiceApi.ApproveExperimentResponse>(
      "acme.experiments.v1.VariantApprovalService/DelegateVariantApproval:3", request4,
    );
    const request5 = audiencesAudienceServiceApi.BatchCreateAudiencesRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply5 = await upload<audiencesAudienceServiceApi.BatchCreateAudiencesRequest, audiencesAudienceServiceApi.BatchCreateAudiencesResponse>(
      (done) => this.audiencesAudienceClient.batchCreateAudiences(metadataFor(request5.context), { deadline: Date.now() + 15_000 }, done), [request5],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse.fromPartial({
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
        variant: { owner: { email: (reply1?.experiment?.organizer?.email ?? "") } },
      }),
      experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse.fromPartial({
        variant: {
          name: (reply3?.variant?.name ?? ""),
          owner: { userId: (reply3?.variant?.owner?.userId ?? "") },
        },
      }),
      experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse.fromPartial({
        outcome: { effectiveAt: reply4?.outcome?.effectiveAt },
        result: { referenceIds: (reply4?.result?.referenceIds ?? []) },
      }),
      experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse.fromPartial({
        variant: {
          status: req?.variant?.status,
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a variant.
   */
  async getVariantApprovalStatus(req: experimentsVariantApprovalServiceApi.GetVariantApprovalStatusRequest): Promise<experimentsVariantApprovalServiceApi.GetVariantApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetVariantApprovalStatus", req);
    this.logger.info("get_variant_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest.fromPartial({
      context: req?.context,
      exposure: {
        correlationId: (req?.variantId ?? ""),
        measurements: [{ observedAt: req?.context?.deadline }],
      },
    });
    const invoke1: Unary<experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest, experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse> =
      (input, done) => this.experimentsExposureCalculationClient.compareExposureOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest, experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse>(invoke1, request1));
    return mergeResponses(
      experimentsVariantApprovalServiceApi.GetVariantApprovalStatusResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      experimentsVariantApprovalServiceApi.GetVariantApprovalStatusResponse.fromPartial({ variant: { variantId: (req?.variantId ?? "") } }),
    );
  }

  /**
   * Lists variants a page at a time.
   */
  async listPendingVariants(req: experimentsVariantApprovalServiceApi.ListPendingVariantsRequest): Promise<experimentsVariantApprovalServiceApi.ListPendingVariantsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingVariants", req);
    this.logger.info("list_pending_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentQueryServiceApi.CountExperimentsRequest.fromPartial({
      context: req?.context,
      filter: { query: (req?.filter?.query ?? "") },
    });
    const invoke1: Unary<experimentsExperimentQueryServiceApi.CountExperimentsRequest, experimentsExperimentQueryServiceApi.CountExperimentsResponse> =
      (input, done) => this.experimentsExperimentQueryClient.countExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsExperimentQueryServiceApi.CountExperimentsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        occurredAt: req?.context?.deadline,
        source: (req?.context?.actor?.userId ?? ""),
      } },
      context: req?.context,
    });
    const stream2 = this.notificationsDeliveryAttemptSyncClient.streamDeliveryAttemptChanges(metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const reading2 = collect(stream2);
    const writing2 = (async () => {
      await write(stream2, request2);
      stream2.end();
    })();
    const [messages2] = await Promise.all([reading2, writing2]);
    const reply2 = messages2.at(-1) ?? notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsVariantApprovalServiceApi.ListPendingVariantsResponse.fromPartial({
      result: {
        message: (reply1?.result?.message ?? ""),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Submits a variant.
   */
  async submitVariant(req: experimentsVariantApprovalServiceApi.SubmitVariantRequest): Promise<experimentsVariantApprovalServiceApi.SubmitVariantResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "SubmitVariant", req);
    this.logger.info("submit_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantLifecycleServiceApi.ReinstateVariantRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: { displayName: (req?.variant?.owner?.displayName ?? "") },
        notifyContact: { email: (req?.details?.approver?.email ?? "") },
      },
      variantId: (req?.variant?.variantId ?? ""),
    });
    const invoke1: Unary<experimentsVariantLifecycleServiceApi.ReinstateVariantRequest, experimentsVariantLifecycleServiceApi.ReinstateVariantResponse> =
      (input, done) => this.experimentsVariantLifecycleClient.reinstateVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_1: string | undefined;
    switch (reply1?.variant?.action?.$case) {
      case "block":
        selected2_1 = ((reply1?.variant?.action?.$case === "block" ? reply1?.variant?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = searchSearchIndexQueryServiceApi.SummarizeSearchIndexesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (selected2_1 ?? ""),
    });
    const invoke2: Unary<searchSearchIndexQueryServiceApi.SummarizeSearchIndexesRequest, searchSearchIndexQueryServiceApi.SummarizeSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.summarizeSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<searchSearchIndexQueryServiceApi.SummarizeSearchIndexesRequest, searchSearchIndexQueryServiceApi.SummarizeSearchIndexesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantApprovalServiceApi.SubmitVariantResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      experimentsVariantApprovalServiceApi.SubmitVariantResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      experimentsVariantApprovalServiceApi.SubmitVariantResponse.fromPartial({
        variant: {
          owner: req?.variant?.owner,
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }
}
