/**
 * Runs the long-lived workflow that takes a translation job from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as communityModerationApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as localizationTranslationJobApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_approval_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as localizationTranslationJobWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_workflow_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as localizationTranslationKeyWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_workflow_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTranslationJobRecord } from "../data/records.js";
import { LocalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation job operations and persist audit data.
 */
@injectable()
export class TranslationJobWorkflowWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobApprovalService") private readonly localizationTranslationJobApprovalClient: localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobReportingService") private readonly localizationTranslationJobReportingClient: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyApprovalService") private readonly localizationTranslationKeyApprovalClient: localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyValidationService") private readonly localizationTranslationKeyValidationClient: localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyWorkflowService") private readonly localizationTranslationKeyWorkflowClient: localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a translation job.
   */
  async advanceTranslationJobWorkflow(req: localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest): Promise<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "AdvanceTranslationJobWorkflow", req);
    this.logger.info("advance_translation_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        owner: {
          displayName: (req?.translationJob?.assignee?.displayName ?? ""),
          email: (req?.translationJob?.requester?.email ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.SubmitTranslationKeyRequest",
      value: Buffer.from(localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest.encode(request1).finish()),
    });
    const unpacked1 = localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest.decode(envelope1.value);
    const invoke1: Unary<localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyApprovalClient.submitTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.SubmitTranslationKeyResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse.fromPartial({
        translationJob: {
          audit: { createdBy: (reply1?.translationKey?.audit?.createdBy ?? "") },
        },
      }),
      localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse.fromPartial({
        translationJob: {
          customFields: (req?.translationJob?.customFields ?? {}),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a translation job.
   */
  async cancelTranslationJobWorkflow(req: localizationTranslationJobWorkflowServiceApi.CancelTranslationJobWorkflowRequest): Promise<localizationTranslationJobWorkflowServiceApi.CancelTranslationJobWorkflowResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "CancelTranslationJobWorkflow", req);
    this.logger.info("cancel_translation_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.translationJob?.comments ?? []).map(async (item) => {
      const request1 = notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest.fromPartial({
        context: req?.context,
        subscription: {
          audit: {
            createdAt: item?.createdAt,
            createdBy: (req?.translationJob?.audit?.createdBy ?? ""),
          },
          owner: {
            displayName: ((req?.translationJob?.origin?.$case === "customer" ? req?.translationJob?.origin.customer : undefined)?.displayName ?? ""),
            email: (item?.authorEmail ?? ""),
          },
        },
      });
      const invoke1: Unary<notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse> =
        (input, done) => this.notificationsSubscriptionSyncClient.syncSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse.fromPartial({});
    let selected2_2: string | undefined;
    switch (req?.translationJob?.origin?.$case) {
      case "customer":
        selected2_2 = ((req?.translationJob?.origin?.$case === "customer" ? req?.translationJob?.origin.customer : undefined)?.customerId ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = communityModerationApprovalServiceApi.DelegateModerationApprovalRequest.fromPartial({
      context: req?.context,
      moderation: {
        origin: { $case: "customer", customer: {
          customerId: (selected2_2 ?? ""),
          email: (req?.details?.notify?.email ?? ""),
        } },
      },
    });
    const invoke2: Unary<communityModerationApprovalServiceApi.DelegateModerationApprovalRequest, communityModerationApprovalServiceApi.DelegateModerationApprovalResponse> =
      (input, done) => this.communityModerationApprovalClient.delegateModerationApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationApprovalServiceApi.DelegateModerationApprovalRequest, communityModerationApprovalServiceApi.DelegateModerationApprovalResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobWorkflowServiceApi.CancelTranslationJobWorkflowResponse.fromPartial({
        translationJob: { audit: { updatedBy: (reply2?.moderation?.audit?.updatedBy ?? "") } },
      }),
      localizationTranslationJobWorkflowServiceApi.CancelTranslationJobWorkflowResponse.fromPartial({
        translationJob: {
          customFields: (req?.translationJob?.customFields ?? {}),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a translation job.
   */
  async inspectTranslationJobWorkflow(req: localizationTranslationJobWorkflowServiceApi.InspectTranslationJobWorkflowRequest): Promise<localizationTranslationJobWorkflowServiceApi.InspectTranslationJobWorkflowResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectTranslationJobWorkflow", req);
    this.logger.info("inspect_translation_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowRequest.fromPartial({
      context: req?.context,
      translationKey: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const invoke1: Unary<localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowResponse> =
      (input, done) => this.localizationTranslationKeyWorkflowClient.resumeTranslationKeyWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = communityModerationApprovalServiceApi.ListPendingModerationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.translationKey?.audit?.createdAt,
        ownerId: (reply1?.translationKey?.components?.["primary"]?.componentId ?? ""),
        region: ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse> =
      (input, done) => this.communityModerationApprovalClient.listPendingModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<communityModerationApprovalServiceApi.ListPendingModerationsRequest, communityModerationApprovalServiceApi.ListPendingModerationsResponse>(invoke2, request2));
    return mergeResponses(
      localizationTranslationJobWorkflowServiceApi.InspectTranslationJobWorkflowResponse.fromPartial({
        translationJob: {
          audit: { createdBy: (reply1?.translationKey?.audit?.createdBy ?? "") },
        },
      }),
      localizationTranslationJobWorkflowServiceApi.InspectTranslationJobWorkflowResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      localizationTranslationJobWorkflowServiceApi.InspectTranslationJobWorkflowResponse.fromPartial({ translationJob: { translationJobId: (req?.translationJobId ?? "") } }),
    );
  }

  /**
   * Lists translation jobs a page at a time.
   */
  async listTranslationJobWorkflows(req: localizationTranslationJobWorkflowServiceApi.ListTranslationJobWorkflowsRequest): Promise<localizationTranslationJobWorkflowServiceApi.ListTranslationJobWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListTranslationJobWorkflows", req);
    this.logger.info("list_translation_job_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationTranslationJobWorkflowServiceApi.ListTranslationJobWorkflowsResponse.fromPartial({});
  }

  /**
   * Retrys a translation job.
   */
  async retryTranslationJobWorkflow(req: localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest): Promise<localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "RetryTranslationJobWorkflow", req);
    this.logger.info("retry_translation_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobReportingServiceApi.FetchTranslationJobReportRequest.fromPartial({
      context: req?.context,
      translationJobId: (req?.translationJob?.translationJobId ?? ""),
    });
    const invoke1: Unary<localizationTranslationJobReportingServiceApi.FetchTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.FetchTranslationJobReportResponse> =
      (input, done) => this.localizationTranslationJobReportingClient.fetchTranslationJobReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("RetryTranslationJobWorkflow.FetchTranslationJobReport", () => call<localizationTranslationJobReportingServiceApi.FetchTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.FetchTranslationJobReportResponse>(invoke1, request1));
    const request2 = localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.translationJob?.assignee?.email ?? "") } },
      translationKey: {
        audit: { createdBy: (reply1?.translationJob?.audit?.createdBy ?? "") },
        owner: { email: (req?.details?.notify?.email ?? "") },
      },
    });
    const invoke2: Unary<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse> =
      (input, done) => this.localizationTranslationKeyValidationClient.checkTranslationKeyEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((reply2?.translationKey?.locator?.$case === "address" ? reply2?.translationKey?.locator.address : undefined)?.region ?? ""),
      },
    });
    const reply3 = await this.workQueue.enqueue<ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsResponse>(
      "acme.localization.v1.TranslationJobWorkflowService/RetryTranslationJobWorkflow:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse.fromPartial({
        translationJob: {
          audit: { createdBy: (reply1?.translationJob?.audit?.createdBy ?? "") },
          tags: (reply1?.translationJob?.tags ?? []),
        },
      }),
      localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse.fromPartial({
        result: { message: (reply2?.outcome?.message ?? "") },
        translationJob: { requester: { email: (reply2?.translationKey?.owner?.email ?? "") } },
      }),
      localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse.fromPartial({
        outcome: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse.fromPartial({
        translationJob: {
          status: req?.translationJob?.status,
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a translation job.
   */
  async signalTranslationJobWorkflow(req: localizationTranslationJobWorkflowServiceApi.SignalTranslationJobWorkflowRequest): Promise<localizationTranslationJobWorkflowServiceApi.SignalTranslationJobWorkflowResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "SignalTranslationJobWorkflow", req);
    this.logger.info("signal_translation_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersHouseholdQueryServiceApi.SuggestHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.translationJob?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.translationJob?.customFields ?? {}))),
        ownerId: (req?.translationJob?.assignee?.userId ?? ""),
      },
    });
    const invoke1: Unary<customersHouseholdQueryServiceApi.SuggestHouseholdsRequest, customersHouseholdQueryServiceApi.SuggestHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.suggestHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<customersHouseholdQueryServiceApi.SuggestHouseholdsRequest, customersHouseholdQueryServiceApi.SuggestHouseholdsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobWorkflowServiceApi.SignalTranslationJobWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      localizationTranslationJobWorkflowServiceApi.SignalTranslationJobWorkflowResponse.fromPartial({
        translationJob: {
          subject: (req?.translationJob?.subject ?? ""),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a translation job.
   */
  async startTranslationJobWorkflow(req: localizationTranslationJobWorkflowServiceApi.StartTranslationJobWorkflowRequest): Promise<localizationTranslationJobWorkflowServiceApi.StartTranslationJobWorkflowResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "StartTranslationJobWorkflow", req);
    this.logger.info("start_translation_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyApprovalServiceApi.CommentTranslationKeyApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.translationJob?.assignee?.email ?? ""),
          userId: (req?.translationJob?.assignee?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<localizationTranslationKeyApprovalServiceApi.CommentTranslationKeyApprovalRequest, localizationTranslationKeyApprovalServiceApi.CommentTranslationKeyApprovalResponse> =
      (input, done) => this.localizationTranslationKeyApprovalClient.commentTranslationKeyApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<localizationTranslationKeyApprovalServiceApi.CommentTranslationKeyApprovalResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (reply1?.translationKey?.owner?.email ?? "") } },
    });
    const invoke2: Unary<localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalRequest, localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse> =
      (input, done) => this.localizationTranslationKeyApprovalClient.delegateTranslationKeyApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = localizationTranslationJobApprovalServiceApi.EscalateTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: {
        audit: {
          createdAt: reply1?.translationKey?.audit?.createdAt,
          updatedBy: (req?.translationJob?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke3: Unary<localizationTranslationJobApprovalServiceApi.EscalateTranslationJobRequest, localizationTranslationJobApprovalServiceApi.EscalateTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobApprovalClient.escalateTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = customersHouseholdValidationServiceApi.ScoreHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{ manager: { email: (reply2?.translationKey?.owner?.email ?? "") } }],
        }],
      },
    });
    const method4 = "scoreHousehold" as const;
    const invoke4: Unary<customersHouseholdValidationServiceApi.ScoreHouseholdRequest, customersHouseholdValidationServiceApi.ScoreHouseholdResponse> =
      (input, done) => this.customersHouseholdValidationClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersHouseholdValidationServiceApi.ScoreHouseholdRequest, customersHouseholdValidationServiceApi.ScoreHouseholdResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobWorkflowServiceApi.StartTranslationJobWorkflowResponse.fromPartial({
        translationJob: { assignee: { userId: (reply1?.translationKey?.owner?.userId ?? "") } },
      }),
      localizationTranslationJobWorkflowServiceApi.StartTranslationJobWorkflowResponse.fromPartial({
        translationJob: {
          assignee: { displayName: (reply2?.translationKey?.owner?.displayName ?? "") },
        },
      }),
      localizationTranslationJobWorkflowServiceApi.StartTranslationJobWorkflowResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      localizationTranslationJobWorkflowServiceApi.StartTranslationJobWorkflowResponse.fromPartial({
        outcome: { message: (reply4?.result?.message ?? "") },
        translationJob: { comments: [{ createdAt: reply4?.household?.audit?.createdAt }] },
      }),
      localizationTranslationJobWorkflowServiceApi.StartTranslationJobWorkflowResponse.fromPartial({
        translationJob: {
          status: req?.translationJob?.status,
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }
}
