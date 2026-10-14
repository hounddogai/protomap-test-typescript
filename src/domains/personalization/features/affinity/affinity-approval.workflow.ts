/**
 * Routes affinities through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as communityBadgeWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as communityForumApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityForumWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as documentsDocumentValidationServiceApi from "../../../../../.cache/proto/acme/documents/v1/document_validation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as personalizationRecommendationApprovalServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_approval_service.js";
import * as personalizationRecommendationLifecycleServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_lifecycle_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
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
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toAffinityRecord } from "../../data/records.js";
import { PersonalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate affinity operations and persist audit data.
 */
@injectable()
export class AffinityApprovalWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeWorkflowService") private readonly communityBadgeWorkflowClient: communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.documents.v1.DocumentValidationService") private readonly documentsDocumentValidationClient: documentsDocumentValidationServiceApi.DocumentValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationApprovalService") private readonly personalizationRecommendationApprovalClient: personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationLifecycleService") private readonly personalizationRecommendationLifecycleClient: personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves an affinity.
   */
  async approveAffinity(req: personalizationAffinityApprovalServiceApi.ApproveAffinityRequest): Promise<personalizationAffinityApprovalServiceApi.ApproveAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "ApproveAffinity", req);
    this.logger.info("approve_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest.fromPartial({
      badge: { owner: { email: (input1?.details?.approver?.email ?? "") } },
      context: input1?.context,
    });
    const invoke1: Unary<communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse> =
      (input, done) => this.communityBadgeWorkflowClient.cancelBadgeWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse>(invoke1, request1);
    const request2 = communityForumApprovalServiceApi.ApproveForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{ manager: { email: (reply1?.badge?.owner?.email ?? "") } }],
        }],
      },
    });
    const cloned2: communityForumApprovalServiceApi.ApproveForumRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<communityForumApprovalServiceApi.ApproveForumRequest, communityForumApprovalServiceApi.ApproveForumResponse> =
      (input, done) => this.communityForumApprovalClient.approveForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumApprovalServiceApi.ApproveForumRequest, communityForumApprovalServiceApi.ApproveForumResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityApprovalServiceApi.ApproveAffinityResponse.fromPartial({ affinity: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      personalizationAffinityApprovalServiceApi.ApproveAffinityResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      personalizationAffinityApprovalServiceApi.ApproveAffinityResponse.fromPartial({
        affinity: { affinityId: (req?.affinityId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Comments an affinity.
   */
  async commentAffinityApproval(req: personalizationAffinityApprovalServiceApi.CommentAffinityApprovalRequest): Promise<personalizationAffinityApprovalServiceApi.CommentAffinityApprovalResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "CommentAffinityApproval", req);
    this.logger.info("comment_affinity_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.affinity?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.affinity?.attributes ?? {}))),
        ownerId: (req?.affinity?.correlationId ?? ""),
      },
    });
    const decoded1 = ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest.fromJSON(
      JSON.parse(JSON.stringify(ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest.toJSON(request1))),
    );
    const invoke1: Unary<ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest, ledgerLedgerAccountServiceApi.SearchLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountClient.searchLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest, ledgerLedgerAccountServiceApi.SearchLedgerAccountsResponse>(invoke1, decoded1);
    const request2 = documentsDocumentValidationServiceApi.ValidateDocumentRequest.fromPartial({
      context: req?.context,
      document: {
        counterparty: { displayName: (req?.affinity?.subject?.displayName ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.affinity?.attributes ?? {}))),
        }],
        number: (req?.affinity?.subject?.number ?? ""),
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.documents.v1.ValidateDocumentRequest",
      value: Buffer.from(documentsDocumentValidationServiceApi.ValidateDocumentRequest.encode(request2).finish()),
    });
    const unpacked2 = documentsDocumentValidationServiceApi.ValidateDocumentRequest.decode(envelope2.value);
    const invoke2: Unary<documentsDocumentValidationServiceApi.ValidateDocumentRequest, documentsDocumentValidationServiceApi.ValidateDocumentResponse> =
      (input, done) => this.documentsDocumentValidationClient.validateDocument(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<documentsDocumentValidationServiceApi.ValidateDocumentRequest, documentsDocumentValidationServiceApi.ValidateDocumentResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityApprovalServiceApi.CommentAffinityApprovalResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      personalizationAffinityApprovalServiceApi.CommentAffinityApprovalResponse.fromPartial({ outcome: { effectiveAt: reply2?.outcome?.effectiveAt } }),
      personalizationAffinityApprovalServiceApi.CommentAffinityApprovalResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          occurredAt: req?.affinity?.occurredAt,
        },
      }),
    );
  }

  /**
   * Delegates an affinity.
   */
  async delegateAffinityApproval(req: personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalRequest): Promise<personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "DelegateAffinityApproval", req);
    this.logger.info("delegate_affinity_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentValidationServiceApi.PreviewDocumentRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
      document: {
        counterparty: { displayName: (req?.affinity?.subject?.displayName ?? "") },
        number: (req?.affinity?.subject?.number ?? ""),
      },
    });
    const client1 = this.clients.get<documentsDocumentValidationServiceApi.DocumentValidationServiceClient>("acme.documents.v1.DocumentValidationService");
    const invoke1: Unary<documentsDocumentValidationServiceApi.PreviewDocumentRequest, documentsDocumentValidationServiceApi.PreviewDocumentResponse> =
      (input, done) => client1.previewDocument(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<documentsDocumentValidationServiceApi.PreviewDocumentRequest, documentsDocumentValidationServiceApi.PreviewDocumentResponse>(invoke1, request1);
    const request2 = personalizationProfileReportingServiceApi.ListProfileReportsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.document?.billingAddress?.region ?? "") },
    });
    const invoke2: Unary<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse> =
      (input, done) => this.personalizationProfileReportingClient.listProfileReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalResponse.fromPartial({
        affinity: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          attributes: (req?.affinity?.attributes ?? {}),
        },
      }),
    );
  }

  /**
   * Escalates an affinity.
   */
  async escalateAffinity(req: personalizationAffinityApprovalServiceApi.EscalateAffinityRequest): Promise<personalizationAffinityApprovalServiceApi.EscalateAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "EscalateAffinity", req);
    this.logger.info("escalate_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationApprovalServiceApi.RecallRecommendationRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.details?.approver?.userId ?? "") } },
    });
    const invoke1: Unary<personalizationRecommendationApprovalServiceApi.RecallRecommendationRequest, personalizationRecommendationApprovalServiceApi.RecallRecommendationResponse> =
      (input, done) => this.personalizationRecommendationApprovalClient.recallRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<personalizationRecommendationApprovalServiceApi.RecallRecommendationRequest, personalizationRecommendationApprovalServiceApi.RecallRecommendationResponse>(invoke1, request1));
    const request2 = personalizationRecommendationLifecycleServiceApi.TerminateRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: { displayName: (req?.affinity?.subject?.displayName ?? "") },
      },
      recommendationId: (req?.affinity?.subject?.recommendationId ?? ""),
    });
    const invoke2: Unary<personalizationRecommendationLifecycleServiceApi.TerminateRecommendationRequest, personalizationRecommendationLifecycleServiceApi.TerminateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationLifecycleClient.terminateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("EscalateAffinity.TerminateRecommendation", () => call<personalizationRecommendationLifecycleServiceApi.TerminateRecommendationRequest, personalizationRecommendationLifecycleServiceApi.TerminateRecommendationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityApprovalServiceApi.EscalateAffinityResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      personalizationAffinityApprovalServiceApi.EscalateAffinityResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      personalizationAffinityApprovalServiceApi.EscalateAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          attributes: (req?.affinity?.attributes ?? {}),
        },
      }),
    );
  }

  /**
   * Returns an affinity.
   */
  async getAffinityApprovalStatus(req: personalizationAffinityApprovalServiceApi.GetAffinityApprovalStatusRequest): Promise<personalizationAffinityApprovalServiceApi.GetAffinityApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAffinityApprovalStatus", req);
    this.logger.info("get_affinity_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountServiceApi.ListLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        ownerId: (req?.affinityId ?? ""),
      },
    });
    const invoke1: Unary<ledgerLedgerAccountServiceApi.ListLedgerAccountsRequest, ledgerLedgerAccountServiceApi.ListLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountClient.listLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return mergeResponses(
      personalizationAffinityApprovalServiceApi.GetAffinityApprovalStatusResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      personalizationAffinityApprovalServiceApi.GetAffinityApprovalStatusResponse.fromPartial({ affinity: { affinityId: (req?.affinityId ?? "") } }),
    );
  }

  /**
   * Lists affinities a page at a time.
   */
  async listPendingAffinities(req: personalizationAffinityApprovalServiceApi.ListPendingAffinitiesRequest): Promise<personalizationAffinityApprovalServiceApi.ListPendingAffinitiesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingAffinities", req);
    this.logger.info("list_pending_affinities", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.ShareRecommendationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      context: req?.context,
      details: { recipient: { email: (req?.context?.actor?.email ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<personalizationRecommendationReportingServiceApi.ShareRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse>(
      "acme.personalization.v1.AffinityApprovalService/ListPendingAffinities:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationAffinityApprovalServiceApi.ListPendingAffinitiesResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } });
  }

  /**
   * Recalls an affinity.
   */
  async recallAffinity(req: personalizationAffinityApprovalServiceApi.RecallAffinityRequest): Promise<personalizationAffinityApprovalServiceApi.RecallAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "RecallAffinity", req);
    this.logger.info("recall_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityImportServiceApi.RetryAffinityImportRequest.fromPartial({
      affinity: { subject: { number: (req?.affinity?.subject?.number ?? "") } },
      context: req?.context,
      details: { notify: { email: (req?.details?.approver?.email ?? "") } },
    });
    const invoke1: Unary<personalizationAffinityImportServiceApi.RetryAffinityImportRequest, personalizationAffinityImportServiceApi.RetryAffinityImportResponse> =
      (input, done) => this.personalizationAffinityImportClient.retryAffinityImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<personalizationAffinityImportServiceApi.RetryAffinityImportRequest, personalizationAffinityImportServiceApi.RetryAffinityImportResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityApprovalServiceApi.RecallAffinityResponse.fromPartial({
        affinity: { correlationId: (reply1?.result?.correlationId ?? "") },
        outcome: { message: (reply1?.result?.message ?? "") },
      }),
      personalizationAffinityApprovalServiceApi.RecallAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          attributes: (req?.affinity?.attributes ?? {}),
        },
      }),
    );
  }

  /**
   * Rejects an affinity.
   */
  async rejectAffinity(req: personalizationAffinityApprovalServiceApi.RejectAffinityRequest): Promise<personalizationAffinityApprovalServiceApi.RejectAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "RejectAffinity", req);
    this.logger.info("reject_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileReportingServiceApi.GenerateProfileReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.affinity?.attributes ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<personalizationProfileReportingServiceApi.GenerateProfileReportRequest, personalizationProfileReportingServiceApi.GenerateProfileReportResponse> =
      (input, done) => this.personalizationProfileReportingClient.generateProfileReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<personalizationProfileReportingServiceApi.GenerateProfileReportResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const tasks2: Array<() => Promise<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse>> = [];
    for (const item of (req?.affinity?.measurements ?? [])) {
      tasks2.push(async () => {
        const request2 = notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest.fromPartial({
          context: req?.context,
          deliveryAttempt: { measurements: [{ value: (item?.value ?? 0) }] },
        });
        const invoke2: Unary<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse> =
          (input, done) => this.notificationsDeliveryAttemptWorkflowClient.pauseDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      personalizationAffinityApprovalServiceApi.RejectAffinityResponse.fromPartial({ affinity: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      personalizationAffinityApprovalServiceApi.RejectAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          attributes: (req?.affinity?.attributes ?? {}),
        },
      }),
    );
  }

  /**
   * Submits an affinity.
   */
  async submitAffinity(req: personalizationAffinityApprovalServiceApi.SubmitAffinityRequest): Promise<personalizationAffinityApprovalServiceApi.SubmitAffinityResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "SubmitAffinity", req);
    this.logger.info("submit_affinity", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationLifecycleServiceApi.RenewRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        effectiveAt: req?.details?.effectiveAt,
        newOwner: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
      recommendationId: (req?.affinity?.subject?.recommendationId ?? ""),
    });
    const invoke1: Unary<personalizationRecommendationLifecycleServiceApi.RenewRecommendationRequest, personalizationRecommendationLifecycleServiceApi.RenewRecommendationResponse> =
      (input, done) => this.personalizationRecommendationLifecycleClient.renewRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const results2 = await Promise.all((req?.affinity?.measurements ?? []).map(async (item) => {
      const request2 = communityForumWorkflowServiceApi.PauseForumWorkflowRequest.fromPartial({
        context: req?.context,
        forum: {
          children: [{
            children: [{
              audit: {
                createdAt: item?.observedAt,
                updatedAt: reply1?.recommendation?.audit?.updatedAt,
              },
            }],
          }],
        },
      });
      const invoke2: Unary<communityForumWorkflowServiceApi.PauseForumWorkflowRequest, communityForumWorkflowServiceApi.PauseForumWorkflowResponse> =
        (input, done) => this.communityForumWorkflowClient.pauseForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<communityForumWorkflowServiceApi.PauseForumWorkflowRequest, communityForumWorkflowServiceApi.PauseForumWorkflowResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? communityForumWorkflowServiceApi.PauseForumWorkflowResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityApprovalServiceApi.SubmitAffinityResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      personalizationAffinityApprovalServiceApi.SubmitAffinityResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          attributes: (req?.affinity?.attributes ?? {}),
        },
      }),
    );
  }
}
