/**
 * Runs the long-lived workflow that takes an audience from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as audiencesAudienceApprovalServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import * as audiencesAudienceMemberApprovalServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as audiencesAudienceMemberValidationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as audiencesAudienceWorkflowServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_workflow_service.js";
import * as chatHandoffApprovalServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import * as communityForumWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as experimentsVariantWorkflowServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_workflow_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as formsFormWorkflowServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_workflow_service.js";
import * as identityUserServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as localizationTranslationJobApprovalServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_approval_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as searchSearchIndexServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_service.js";
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
} from "../../../../platform/rpc.js";
import { collect, write } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toAudienceRecord } from "../../data/records.js";
import { AudiencesRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience operations and persist audit data.
 */
@injectable()
export class AudienceWorkflowWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceApprovalService") private readonly audiencesAudienceApprovalClient: audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberApprovalService") private readonly audiencesAudienceMemberApprovalClient: audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberValidationService") private readonly audiencesAudienceMemberValidationClient: audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncCalculationService") private readonly audiencesAudienceSyncCalculationClient: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceValidationService") private readonly audiencesAudienceValidationClient: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffApprovalService") private readonly chatHandoffApprovalClient: chatHandoffApprovalServiceApi.HandoffApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.experiments.v1.VariantWorkflowService") private readonly experimentsVariantWorkflowClient: experimentsVariantWorkflowServiceApi.VariantWorkflowServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormWorkflowService") private readonly formsFormWorkflowClient: formsFormWorkflowServiceApi.FormWorkflowServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobApprovalService") private readonly localizationTranslationJobApprovalClient: localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexService") private readonly searchSearchIndexClient: searchSearchIndexServiceApi.SearchIndexServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances an audience.
   */
  async advanceAudienceWorkflow(req: audiencesAudienceWorkflowServiceApi.AdvanceAudienceWorkflowRequest): Promise<audiencesAudienceWorkflowServiceApi.AdvanceAudienceWorkflowResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "AdvanceAudienceWorkflow", req);
    this.logger.info("advance_audience_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = formsFormWorkflowServiceApi.SignalFormWorkflowRequest.fromPartial({
      context: input1?.context,
      details: { notify: { email: (input1?.audience?.owner?.email ?? "") } },
      form: {
        audit: { etag: (input1?.audience?.audit?.etag ?? "") },
        lines: [{
          tax: {
            amount: (input1?.audience?.action?.$case === "discount" ? input1?.audience?.action.discount : undefined)?.amount,
          },
        }],
      },
    });
    const invoke1: Unary<formsFormWorkflowServiceApi.SignalFormWorkflowRequest, formsFormWorkflowServiceApi.SignalFormWorkflowResponse> =
      (input, done) => this.formsFormWorkflowClient.signalFormWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormWorkflowServiceApi.SignalFormWorkflowRequest, formsFormWorkflowServiceApi.SignalFormWorkflowResponse>(invoke1, request1);
    const request2 = audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberRequest.fromPartial({
      audienceMember: { audit: { updatedBy: (req?.audience?.audit?.updatedBy ?? "") } },
      context: req?.context,
    });
    const cloned2: audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberApprovalClient.submitAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberResponse>(invoke2, cloned2);
    const request3 = notificationsNotificationSyncServiceApi.StreamNotificationChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        assignee: { email: (reply2?.audienceMember?.relationshipManager?.email ?? "") },
        audit: { updatedAt: reply2?.audienceMember?.audit?.updatedAt },
      } },
      context: req?.context,
    });
    const stream3 = this.notificationsNotificationSyncClient.streamNotificationChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? notificationsNotificationSyncServiceApi.StreamNotificationChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceWorkflowServiceApi.AdvanceAudienceWorkflowResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      audiencesAudienceWorkflowServiceApi.AdvanceAudienceWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.outcome?.message ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      audiencesAudienceWorkflowServiceApi.AdvanceAudienceWorkflowResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          priority: (req?.audience?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Cancels an audience.
   */
  async cancelAudienceWorkflow(req: audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowRequest): Promise<audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "CancelAudienceWorkflow", req);
    this.logger.info("cancel_audience_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        audit: { updatedAt: req?.audience?.audit?.updatedAt },
        owner: { userId: (req?.audience?.owner?.userId ?? "") },
      },
    });
    const decoded1 = featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest.fromJSON(
      JSON.parse(JSON.stringify(featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest.toJSON(request1))),
    );
    const invoke1: Unary<featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.normalizeFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.NormalizeFeatureFlagResponse>(invoke1, decoded1);
    const request2 = searchSearchIndexServiceApi.CreateSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        owner: {
          displayName: (reply1?.featureFlag?.owner?.displayName ?? ""),
          userId: (reply1?.featureFlag?.owner?.userId ?? ""),
        },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.search.v1.CreateSearchIndexRequest",
      value: Buffer.from(searchSearchIndexServiceApi.CreateSearchIndexRequest.encode(request2).finish()),
    });
    const unpacked2 = searchSearchIndexServiceApi.CreateSearchIndexRequest.decode(envelope2.value);
    const invoke2: Unary<searchSearchIndexServiceApi.CreateSearchIndexRequest, searchSearchIndexServiceApi.CreateSearchIndexResponse> =
      (input, done) => this.searchSearchIndexClient.createSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<searchSearchIndexServiceApi.CreateSearchIndexRequest, searchSearchIndexServiceApi.CreateSearchIndexResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowResponse.fromPartial({
        audience: {
          audit: { etag: (reply1?.featureFlag?.audit?.etag ?? "") },
          parameters: (reply1?.featureFlag?.parameters ?? {}),
        },
      }),
      audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowResponse.fromPartial({
        audience: { audit: { updatedBy: (reply2?.searchIndex?.audit?.updatedBy ?? "") } },
      }),
      audiencesAudienceWorkflowServiceApi.CancelAudienceWorkflowResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          name: (req?.audience?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Returns an audience.
   */
  async inspectAudienceWorkflow(req: audiencesAudienceWorkflowServiceApi.InspectAudienceWorkflowRequest): Promise<audiencesAudienceWorkflowServiceApi.InspectAudienceWorkflowResponse> {
    validateContext(req.context);
    if (!req.audienceId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectAudienceWorkflow", req);
    this.logger.info("inspect_audience_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    return audiencesAudienceWorkflowServiceApi.InspectAudienceWorkflowResponse.fromPartial({ audience: { audienceId: (req?.audienceId ?? "") } });
  }

  /**
   * Lists audiences a page at a time.
   */
  async listAudienceWorkflows(req: audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsRequest): Promise<audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListAudienceWorkflows", req);
    this.logger.info("list_audience_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceApprovalServiceApi.RejectAudienceRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const client1 = this.clients.get<audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient>("acme.audiences.v1.AudienceApprovalService");
    const invoke1: Unary<audiencesAudienceApprovalServiceApi.RejectAudienceRequest, audiencesAudienceApprovalServiceApi.RejectAudienceResponse> =
      (input, done) => client1.rejectAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceApprovalServiceApi.RejectAudienceRequest, audiencesAudienceApprovalServiceApi.RejectAudienceResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsResponse.fromPartial({
      audiences: [{ audit: { createdBy: (reply1?.audience?.audit?.createdBy ?? "") } }],
    });
  }

  /**
   * Pauses an audience.
   */
  async pauseAudienceWorkflow(req: audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowRequest): Promise<audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "PauseAudienceWorkflow", req);
    this.logger.info("pause_audience_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.CloneUserRequest.fromPartial({
      context: req?.context,
      user: {
        audit: { createdBy: (req?.audience?.audit?.createdBy ?? "") },
        name: req?.details?.notify?.name,
      },
    });
    const invoke1: Unary<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse> =
      (input, done) => this.identityUserClient.cloneUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowResponse.fromPartial({ audience: { owner: { email: (reply1?.user?.contact?.email ?? "") } } }),
      audiencesAudienceWorkflowServiceApi.PauseAudienceWorkflowResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          priority: (req?.audience?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Resumes an audience.
   */
  async resumeAudienceWorkflow(req: audiencesAudienceWorkflowServiceApi.ResumeAudienceWorkflowRequest): Promise<audiencesAudienceWorkflowServiceApi.ResumeAudienceWorkflowResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "ResumeAudienceWorkflow", req);
    this.logger.info("resume_audience_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.WatchUsersRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.details?.notify?.email ?? ""),
        name: req?.details?.notify?.name,
        phone: (req?.details?.notify?.phone ?? ""),
        preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.identityUserClient.watchUsers(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? identityUserServiceApi.WatchUsersResponse.fromPartial({});
    const request2 = audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest.fromPartial({
      audienceMember: {
        audit: { updatedAt: req?.audience?.audit?.updatedAt },
        contact: {
          email: (req?.audience?.owner?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke2: Unary<audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest, audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient.lintAudienceMembers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest, audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceWorkflowServiceApi.ResumeAudienceWorkflowResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      audiencesAudienceWorkflowServiceApi.ResumeAudienceWorkflowResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          version: (req?.audience?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Retrys an audience.
   */
  async retryAudienceWorkflow(req: audiencesAudienceWorkflowServiceApi.RetryAudienceWorkflowRequest): Promise<audiencesAudienceWorkflowServiceApi.RetryAudienceWorkflowResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "RetryAudienceWorkflow", req);
    this.logger.info("retry_audience_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_4: string | undefined;
    switch (req?.audience?.action?.$case) {
      case "block":
        selected1_4 = ((req?.audience?.action?.$case === "block" ? req?.audience?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected1_4 = "";
    }
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.audience?.owner?.displayName ?? "") } },
      details: {
        notify: { phone: (req?.details?.notify?.phone ?? "") },
        timeout: req?.details?.timeout,
      },
      reason: (selected1_4 ?? ""),
    });
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.resumeDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowResponse>(invoke1, request1);
    const request2 = audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest.fromPartial({
      audienceSync: {
        attributes: Object.fromEntries(Object.entries((reply1?.deliveryAttempt?.attributes ?? {}))),
        sequence: (reply1?.deliveryAttempt?.sequence ?? 0),
        source: (reply1?.deliveryAttempt?.source ?? ""),
        subject: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.simulateAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceWorkflowServiceApi.RetryAudienceWorkflowResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      audiencesAudienceWorkflowServiceApi.RetryAudienceWorkflowResponse.fromPartial({
        audience: {
          owner: { displayName: (reply2?.audienceSync?.subject?.displayName ?? "") },
        },
      }),
      audiencesAudienceWorkflowServiceApi.RetryAudienceWorkflowResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          version: (req?.audience?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Signals an audience.
   */
  async signalAudienceWorkflow(req: audiencesAudienceWorkflowServiceApi.SignalAudienceWorkflowRequest): Promise<audiencesAudienceWorkflowServiceApi.SignalAudienceWorkflowResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "SignalAudienceWorkflow", req);
    this.logger.info("signal_audience_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audience?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.audience?.parameters ?? {}))),
        ownerId: (req?.audience?.owner?.userId ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsRequest, localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsResponse>(
      "acme.audiences.v1.AudienceWorkflowService/SignalAudienceWorkflow:0", request1,
    );
    const request2 = formsFormWorkflowServiceApi.SignalFormWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { phone: (req?.details?.notify?.phone ?? "") } },
      form: {
        audit: { updatedBy: (req?.audience?.audit?.updatedBy ?? "") },
        counterparty: { displayName: (req?.audience?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<formsFormWorkflowServiceApi.SignalFormWorkflowRequest, formsFormWorkflowServiceApi.SignalFormWorkflowResponse> =
      (input, done) => this.formsFormWorkflowClient.signalFormWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<formsFormWorkflowServiceApi.SignalFormWorkflowRequest, formsFormWorkflowServiceApi.SignalFormWorkflowResponse>(invoke2, request2));
    const request3 = communityForumWorkflowServiceApi.SignalForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            manager: { displayName: (reply2?.form?.counterparty?.displayName ?? "") },
          }],
        }],
      },
    });
    const invoke3: Unary<communityForumWorkflowServiceApi.SignalForumWorkflowRequest, communityForumWorkflowServiceApi.SignalForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.signalForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<communityForumWorkflowServiceApi.SignalForumWorkflowResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = chatHandoffApprovalServiceApi.SubmitHandoffRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (reply3?.forum?.manager?.userId ?? "") } },
      handoff: {
        requester: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke4: Unary<chatHandoffApprovalServiceApi.SubmitHandoffRequest, chatHandoffApprovalServiceApi.SubmitHandoffResponse> =
      (input, done) => this.chatHandoffApprovalClient.submitHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceWorkflowServiceApi.SignalAudienceWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      audiencesAudienceWorkflowServiceApi.SignalAudienceWorkflowResponse.fromPartial({
        audience: {
          audit: {
            updatedAt: reply2?.form?.audit?.updatedAt,
            updatedBy: (reply2?.form?.audit?.updatedBy ?? ""),
          },
        },
      }),
      audiencesAudienceWorkflowServiceApi.SignalAudienceWorkflowResponse.fromPartial({ outcome: { message: (reply3?.outcome?.message ?? "") } }),
      audiencesAudienceWorkflowServiceApi.SignalAudienceWorkflowResponse.fromPartial({
        audience: { audit: { updatedBy: (reply4?.handoff?.audit?.updatedBy ?? "") } },
        outcome: { message: (reply4?.outcome?.message ?? "") },
      }),
      audiencesAudienceWorkflowServiceApi.SignalAudienceWorkflowResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          effective: req?.audience?.effective,
        },
      }),
    );
  }

  /**
   * Starts an audience.
   */
  async startAudienceWorkflow(req: audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowRequest): Promise<audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "StartAudienceWorkflow", req);
    this.logger.info("start_audience_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.audience?.conditions ?? []).map(async (item) => {
      const request1 = audiencesAudienceValidationServiceApi.ValidateAudienceRequest.fromPartial({
        audience: {
          conditions: [{
            operator: (item?.operator ?? ""),
            value: (item?.value ?? ""),
          }],
        },
        context: req?.context,
      });
      const invoke1: Unary<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse> =
        (input, done) => this.audiencesAudienceValidationClient.validateAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? audiencesAudienceValidationServiceApi.ValidateAudienceResponse.fromPartial({});
    const request2 = experimentsVariantWorkflowServiceApi.StartVariantWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (reply1?.audience?.owner?.email ?? "") } },
      variant: { audit: { updatedAt: reply1?.audience?.audit?.updatedAt } },
    });
    const invoke2: Unary<experimentsVariantWorkflowServiceApi.StartVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.StartVariantWorkflowResponse> =
      (input, done) => this.experimentsVariantWorkflowClient.startVariantWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowResponse.fromPartial({
        audience: {
          audit: { updatedBy: (reply2?.variant?.audit?.updatedBy ?? "") },
          effective: reply2?.variant?.effective,
        },
      }),
      audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          description: (req?.audience?.description ?? ""),
        },
      }),
    );
  }
}
