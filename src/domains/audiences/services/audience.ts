/**
 * Manages audiences: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceMemberCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import * as audiencesAudienceMemberValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as audiencesAudienceQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import * as audiencesAudienceServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceSyncValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as auditAuditEventQueryServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_query_service.js";
import * as contentArticleQueryServiceApi from "../../../../.cache/proto/acme/content/v1/article_query_service.js";
import * as keymanagementCryptoKeyQueryServiceApi from "../../../../.cache/proto/acme/keymanagement/v1/crypto_key_query_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as surveysQuestionValidationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import * as googleTimestampApi from "../../../../.cache/proto/google/protobuf/timestamp.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { clientStream, serverStream, unary } from "../../../platform/handlers.js";
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
import { toAudienceRecord } from "../data/records.js";
import { AudiencesRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience operations and persist audit data.
 */
@injectable()
export class AudienceWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberCalculationService") private readonly audiencesAudienceMemberCalculationClient: audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberValidationService") private readonly audiencesAudienceMemberValidationClient: audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceQueryService") private readonly audiencesAudienceQueryClient: audiencesAudienceQueryServiceApi.AudienceQueryServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncCalculationService") private readonly audiencesAudienceSyncCalculationClient: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncValidationService") private readonly audiencesAudienceSyncValidationClient: audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceValidationService") private readonly audiencesAudienceValidationClient: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient,
    @inject("grpc:acme.audit.v1.AuditEventQueryService") private readonly auditAuditEventQueryClient: auditAuditEventQueryServiceApi.AuditEventQueryServiceClient,
    @inject("grpc:acme.content.v1.ArticleQueryService") private readonly contentArticleQueryClient: contentArticleQueryServiceApi.ArticleQueryServiceClient,
    @inject("grpc:acme.keymanagement.v1.CryptoKeyQueryService") private readonly keymanagementCryptoKeyQueryClient: keymanagementCryptoKeyQueryServiceApi.CryptoKeyQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.surveys.v1.QuestionValidationService") private readonly surveysQuestionValidationClient: surveysQuestionValidationServiceApi.QuestionValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of audiences and answers once at the end.
   */
  async batchCreateAudiences(req: audiencesAudienceServiceApi.BatchCreateAudiencesRequest): Promise<audiencesAudienceServiceApi.BatchCreateAudiencesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateAudiences", req);
    this.logger.info("batch_create_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncRequest.fromPartial({
      audienceSync: {
        subject: {
          displayName: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.owner?.displayName ?? ""),
          email: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? ""),
        },
      },
      context: req?.context,
      details: {
        contact: {
          email: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.owner?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncValidationClient.normalizeAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncRequest.fromPartial({
      audienceSync: {
        source: (reply1?.audienceSync?.source ?? ""),
        subject: {
          audienceMemberId: (reply1?.audienceSync?.subject?.audienceMemberId ?? ""),
          displayName: (reply1?.audienceSync?.subject?.displayName ?? ""),
          email: (reply1?.audienceSync?.subject?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.quoteAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncResponse>(invoke2, request2));
    let selected3_2: googleTimestampApi.Timestamp | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected3_2 = (req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.createdAt;
        break;
      default:
        selected3_2 = undefined;
    }
    let selected3_3: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected3_3 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.owner?.displayName ?? "");
        break;
      default:
        selected3_3 = "";
    }
    let selected3_4: googleTimestampApi.Timestamp | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected3_4 = (req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.updatedAt;
        break;
      default:
        selected3_4 = undefined;
    }
    const request3 = audiencesAudienceValidationServiceApi.LintAudiencesRequest.fromPartial({
      audience: {
        audit: {
          createdAt: selected3_2,
          updatedAt: selected3_4,
        },
        owner: {
          displayName: (selected3_3 ?? ""),
          email: (reply2?.audienceSync?.subject?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke3: Unary<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse> =
      (input, done) => this.audiencesAudienceValidationClient.lintAudiences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse>(invoke3, request3);
    const request4 = audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest.fromPartial({
      audience: {
        action: { $case: "block", block: {
          notifyEmail: ((reply3?.audience?.action?.$case === "block" ? reply3?.audience?.action.block : undefined)?.notifyEmail ?? ""),
          reason: (((choice) => choice?.$case === "block" ? choice.block : undefined)((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.action)?.reason ?? ""),
        } },
        owner: { userId: (reply3?.audience?.owner?.userId ?? "") },
      },
      context: req?.context,
      details: {
        contact: {
          email: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.email ?? ""),
        },
      },
    });
    const invoke4: Unary<audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest, audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse> =
      (input, done) => this.audiencesAudienceValidationClient.explainAudienceDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      audiencesAudienceServiceApi.BatchCreateAudiencesResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      audiencesAudienceServiceApi.BatchCreateAudiencesResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      audiencesAudienceServiceApi.BatchCreateAudiencesResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          details: (reply3?.result?.details ?? {}),
        },
      }),
      audiencesAudienceServiceApi.BatchCreateAudiencesResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
    );
  }

  /**
   * Returns several audiences at once.
   */
  async batchGetAudiences(req: audiencesAudienceServiceApi.BatchGetAudiencesRequest): Promise<audiencesAudienceServiceApi.BatchGetAudiencesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetAudiences", req);
    this.logger.info("batch_get_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    return audiencesAudienceServiceApi.BatchGetAudiencesResponse.fromPartial({});
  }

  /**
   * Creates an audience.
   */
  async cloneAudience(req: audiencesAudienceServiceApi.CloneAudienceRequest): Promise<audiencesAudienceServiceApi.CloneAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "CloneAudience", req);
    this.logger.info("clone_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceQueryServiceApi.BrowseAudiencesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audience?.audit?.updatedAt,
        ownerId: (req?.audience?.audienceId ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<audiencesAudienceQueryServiceApi.BrowseAudiencesRequest, audiencesAudienceQueryServiceApi.BrowseAudiencesResponse>(
      "acme.audiences.v1.AudienceService/CloneAudience:0", request1,
    );
    const request2 = audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest.fromPartial({
      audienceMember: {
        audit: {
          createdAt: req?.audience?.audit?.createdAt,
          etag: (req?.audience?.audit?.etag ?? ""),
        },
        contact: { email: (req?.audience?.owner?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest, audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient.lintAudienceMembers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest, audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse>(invoke2, request2));
    const request3 = keymanagementCryptoKeyQueryServiceApi.CountCryptoKeysRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply2?.audienceMember?.primaryAddress?.region ?? "") },
    });
    const invoke3: Unary<keymanagementCryptoKeyQueryServiceApi.CountCryptoKeysRequest, keymanagementCryptoKeyQueryServiceApi.CountCryptoKeysResponse> =
      (input, done) => this.keymanagementCryptoKeyQueryClient.countCryptoKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<keymanagementCryptoKeyQueryServiceApi.CountCryptoKeysResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = surveysQuestionValidationServiceApi.NormalizeQuestionRequest.fromPartial({
      context: req?.context,
      question: {
        audit: { etag: (req?.audience?.audit?.etag ?? "") },
        action: { $case: "discount", discount: {
          amount: (req?.audience?.action?.$case === "discount" ? req?.audience?.action.discount : undefined)?.amount,
        } },
        owner: {
          displayName: (reply2?.audienceMember?.relationshipManager?.displayName ?? ""),
          email: (reply2?.audienceMember?.relationshipManager?.email ?? ""),
        },
      },
    });
    const invoke4: Unary<surveysQuestionValidationServiceApi.NormalizeQuestionRequest, surveysQuestionValidationServiceApi.NormalizeQuestionResponse> =
      (input, done) => this.surveysQuestionValidationClient.normalizeQuestion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      audiencesAudienceServiceApi.CloneAudienceResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      audiencesAudienceServiceApi.CloneAudienceResponse.fromPartial({
        audience: {
          owner: { userId: (reply2?.audienceMember?.relationshipManager?.userId ?? "") },
        },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      audiencesAudienceServiceApi.CloneAudienceResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      audiencesAudienceServiceApi.CloneAudienceResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      audiencesAudienceServiceApi.CloneAudienceResponse.fromPartial({
        audience: {
          description: (req?.audience?.description ?? ""),
          priority: (req?.audience?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Creates an audience.
   */
  async createAudience(req: audiencesAudienceServiceApi.CreateAudienceRequest): Promise<audiencesAudienceServiceApi.CreateAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "CreateAudience", req);
    this.logger.info("create_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest.fromPartial({
      audienceMember: {
        relationshipManager: {
          email: (req?.audience?.owner?.email ?? ""),
          userId: (req?.audience?.owner?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient.previewAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      audiencesAudienceServiceApi.CreateAudienceResponse.fromPartial({
        audience: {
          audit: { updatedBy: (reply1?.audienceMember?.audit?.updatedBy ?? "") },
        },
      }),
      audiencesAudienceServiceApi.CreateAudienceResponse.fromPartial({
        audience: {
          name: (req?.audience?.name ?? ""),
          owner: req?.audience?.owner,
        },
      }),
    );
  }

  /**
   * Deletes an audience.
   */
  async deleteAudience(req: audiencesAudienceServiceApi.DeleteAudienceRequest): Promise<audiencesAudienceServiceApi.DeleteAudienceResponse> {
    validateContext(req.context);
    if (!req.audienceId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteAudience", req);
    this.logger.info("delete_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest.fromPartial({
      audienceMember: {
        audit: { etag: (req?.etag ?? "") },
        relationshipManager: { email: (req?.context?.actor?.email ?? "") },
      },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const method1 = "explainAudienceMemberCalculation" as const;
    const invoke1: Unary<audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest, audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest, audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse>(invoke1, request1);
    const request2 = auditAuditEventQueryServiceApi.FindAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.outcome?.effectiveAt,
        region: (reply1?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const proxy2 = forwarding(this.auditAuditEventQueryClient);
    const invoke2: Unary<auditAuditEventQueryServiceApi.FindAuditEventsRequest, auditAuditEventQueryServiceApi.FindAuditEventsResponse> =
      (input, done) => proxy2.findAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<auditAuditEventQueryServiceApi.FindAuditEventsRequest, auditAuditEventQueryServiceApi.FindAuditEventsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.audienceId ?? "") });
    return mergeResponses(
      audiencesAudienceServiceApi.DeleteAudienceResponse.fromPartial({ effectiveAt: reply1?.outcome?.effectiveAt }),
      audiencesAudienceServiceApi.DeleteAudienceResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
    );
  }

  /**
   * Returns an audience.
   */
  async getAudience(req: audiencesAudienceServiceApi.GetAudienceRequest): Promise<audiencesAudienceServiceApi.GetAudienceResponse> {
    validateContext(req.context);
    if (!req.audienceId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAudience", req);
    this.logger.info("get_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    return audiencesAudienceServiceApi.GetAudienceResponse.fromPartial({ audience: { audienceId: (req?.audienceId ?? "") } });
  }

  /**
   * Lists audiences a page at a time.
   */
  async listAudiences(req: audiencesAudienceServiceApi.ListAudiencesRequest): Promise<audiencesAudienceServiceApi.ListAudiencesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListAudiences", req);
    this.logger.info("list_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient.estimateAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceServiceApi.ListAudiencesResponse.fromPartial({
      audiences: [{
        owner: {
          displayName: (reply1?.audienceMember?.relationshipManager?.displayName ?? ""),
          userId: (reply1?.audienceMember?.relationshipManager?.userId ?? ""),
        },
      }],
    });
  }

  /**
   * Lists audiences a page at a time.
   */
  async searchAudiences(req: audiencesAudienceServiceApi.SearchAudiencesRequest): Promise<audiencesAudienceServiceApi.SearchAudiencesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchAudiences", req);
    this.logger.info("search_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceServiceApi.SearchAudiencesResponse.fromPartial({});
  }

  /**
   * Changes an audience.
   */
  async updateAudience(req: audiencesAudienceServiceApi.UpdateAudienceRequest): Promise<audiencesAudienceServiceApi.UpdateAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "UpdateAudience", req);
    this.logger.info("update_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audience?.audit?.createdAt,
        ownerId: (req?.audience?.audienceId ?? ""),
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsRequest, notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.listDeliveryAttemptWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsRequest, notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = audiencesAudienceQueryServiceApi.BrowseAudiencesRequest.fromPartial({
      context: input2?.context,
      filter: {
        createdAfter: input2?.audience?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (input2?.audience?.audienceId ?? ""),
      },
    });
    const invoke2: Unary<audiencesAudienceQueryServiceApi.BrowseAudiencesRequest, audiencesAudienceQueryServiceApi.BrowseAudiencesResponse> =
      (input, done) => this.audiencesAudienceQueryClient.browseAudiences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceQueryServiceApi.BrowseAudiencesRequest, audiencesAudienceQueryServiceApi.BrowseAudiencesResponse>(invoke2, request2);
    const request3 = audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest.fromPartial({
      audienceMember: {
        audit: {
          createdBy: (req?.audience?.audit?.createdBy ?? ""),
          etag: (req?.audience?.audit?.etag ?? ""),
        },
        contact: { email: (req?.audience?.owner?.email ?? "") },
        relationshipManager: { userId: (req?.audience?.owner?.userId ?? "") },
      },
      context: req?.context,
    });
    const cloned3: audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient.normalizeAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberResponse>(invoke3, cloned3);
    const request4 = audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionRequest.fromPartial({
      audienceMember: {
        identityDocument: { $case: "nationalId", nationalId: {
          number: ((reply3?.audienceMember?.identityDocument?.$case === "nationalId" ? reply3?.audienceMember?.identityDocument.nationalId : undefined)?.number ?? ""),
        } },
      },
      context: req?.context,
    });
    const decoded4 = audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionRequest.fromJSON(
      JSON.parse(JSON.stringify(audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionRequest.toJSON(request4))),
    );
    const invoke4: Unary<audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionRequest, audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient.explainAudienceMemberDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionRequest, audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.audience?.audit?.updatedBy ?? "") });
    return mergeResponses(
      audiencesAudienceServiceApi.UpdateAudienceResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      audiencesAudienceServiceApi.UpdateAudienceResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      audiencesAudienceServiceApi.UpdateAudienceResponse.fromPartial({
        audience: {
          owner: { email: (reply3?.audienceMember?.relationshipManager?.email ?? "") },
        },
      }),
      audiencesAudienceServiceApi.UpdateAudienceResponse.fromPartial({ result: { referenceIds: (reply4?.result?.referenceIds ?? []) } }),
      audiencesAudienceServiceApi.UpdateAudienceResponse.fromPartial({
        audience: {
          audienceId: (req?.audience?.audienceId ?? ""),
          name: (req?.audience?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of audiences as they happen.
   */
  async watchAudiences(req: audiencesAudienceServiceApi.WatchAudiencesRequest): Promise<audiencesAudienceServiceApi.WatchAudiencesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchAudiences", req);
    this.logger.info("watch_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleQueryServiceApi.BrowseArticlesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        region: (req?.filter?.region ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.content.v1.BrowseArticlesRequest",
      value: Buffer.from(contentArticleQueryServiceApi.BrowseArticlesRequest.encode(request1).finish()),
    });
    const unpacked1 = contentArticleQueryServiceApi.BrowseArticlesRequest.decode(envelope1.value);
    const invoke1: Unary<contentArticleQueryServiceApi.BrowseArticlesRequest, contentArticleQueryServiceApi.BrowseArticlesResponse> =
      (input, done) => this.contentArticleQueryClient.browseArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentArticleQueryServiceApi.BrowseArticlesRequest, contentArticleQueryServiceApi.BrowseArticlesResponse>(invoke1, unpacked1);
    const request2 = audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest.fromPartial({
      audience: { owner: { email: (req?.subscriber?.email ?? "") } },
      context: req?.context,
      details: {
        contact: {
          name: req?.subscriber?.name,
          phone: (req?.subscriber?.phone ?? ""),
        },
      },
    });
    const client2 = this.clients.get<audiencesAudienceValidationServiceApi.AudienceValidationServiceClient>("acme.audiences.v1.AudienceValidationService");
    const invoke2: Unary<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse> =
      (input, done) => client2.checkAudienceEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      audiencesAudienceServiceApi.WatchAudiencesResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      audiencesAudienceServiceApi.WatchAudiencesResponse.fromPartial({ audience: { status: reply2?.audience?.status } }),
      audiencesAudienceServiceApi.WatchAudiencesResponse.fromPartial({ audience: { owner: { email: (req?.subscriber?.email ?? "") } } }),
    );
  }
}

/**
 * The gRPC boundary for AudienceService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceHandler {
  constructor(@inject(AudienceWorkflow) private readonly workflow: AudienceWorkflow) {}

  /**
   * Takes a stream of audiences and answers once at the end.
   */
  batchCreateAudiences = clientStream<audiencesAudienceServiceApi.BatchCreateAudiencesRequest, audiencesAudienceServiceApi.BatchCreateAudiencesResponse>(
    (request) => this.workflow.batchCreateAudiences(request), () => audiencesAudienceServiceApi.BatchCreateAudiencesResponse.fromPartial({}),
  );

  /**
   * Returns several audiences at once.
   */
  batchGetAudiences = unary<audiencesAudienceServiceApi.BatchGetAudiencesRequest, audiencesAudienceServiceApi.BatchGetAudiencesResponse>(
    (request) => this.workflow.batchGetAudiences(request),
  );

  /**
   * Creates an audience.
   */
  cloneAudience = (call: ServerUnaryCall<audiencesAudienceServiceApi.CloneAudienceRequest, audiencesAudienceServiceApi.CloneAudienceResponse>, done: sendUnaryData<audiencesAudienceServiceApi.CloneAudienceResponse>): void => {
    void this.workflow.cloneAudience(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Creates an audience.
   */
  createAudience = unary<audiencesAudienceServiceApi.CreateAudienceRequest, audiencesAudienceServiceApi.CreateAudienceResponse>(
    (request) => this.workflow.createAudience(request),
  );

  /**
   * Deletes an audience.
   */
  deleteAudience = unary<audiencesAudienceServiceApi.DeleteAudienceRequest, audiencesAudienceServiceApi.DeleteAudienceResponse>(
    (request) => this.workflow.deleteAudience(request),
  );

  /**
   * Returns an audience.
   */
  getAudience = (call: ServerUnaryCall<audiencesAudienceServiceApi.GetAudienceRequest, audiencesAudienceServiceApi.GetAudienceResponse>, done: sendUnaryData<audiencesAudienceServiceApi.GetAudienceResponse>): void => {
    void this.workflow.getAudience(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists audiences a page at a time.
   */
  listAudiences = unary<audiencesAudienceServiceApi.ListAudiencesRequest, audiencesAudienceServiceApi.ListAudiencesResponse>(
    (request) => this.workflow.listAudiences(request),
  );

  /**
   * Lists audiences a page at a time.
   */
  searchAudiences = unary<audiencesAudienceServiceApi.SearchAudiencesRequest, audiencesAudienceServiceApi.SearchAudiencesResponse>(
    (request) => this.workflow.searchAudiences(request),
  );

  /**
   * Changes an audience.
   */
  updateAudience = (call: ServerUnaryCall<audiencesAudienceServiceApi.UpdateAudienceRequest, audiencesAudienceServiceApi.UpdateAudienceResponse>, done: sendUnaryData<audiencesAudienceServiceApi.UpdateAudienceResponse>): void => {
    void this.workflow.updateAudience(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams the changes of audiences as they happen.
   */
  watchAudiences = serverStream<audiencesAudienceServiceApi.WatchAudiencesRequest, audiencesAudienceServiceApi.WatchAudiencesResponse>(
    (request) => this.workflow.watchAudiences(request),
  );
}

export function implementation(handler: AudienceHandler): audiencesAudienceServiceApi.AudienceServiceServer {
  return {
    batchCreateAudiences: handler.batchCreateAudiences,
    batchGetAudiences: handler.batchGetAudiences,
    cloneAudience: handler.cloneAudience,
    createAudience: handler.createAudience,
    deleteAudience: handler.deleteAudience,
    getAudience: handler.getAudience,
    listAudiences: handler.listAudiences,
    searchAudiences: handler.searchAudiences,
    updateAudience: handler.updateAudience,
    watchAudiences: handler.watchAudiences,
  };
}
