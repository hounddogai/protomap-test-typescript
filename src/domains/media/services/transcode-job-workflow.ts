/**
 * Runs the long-lived workflow that takes a transcode job from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersCustomerServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import * as mediaMediaAssetReportingServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_reporting_service.js";
import * as mediaRenditionValidationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_validation_service.js";
import * as mediaTranscodeJobLifecycleServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_lifecycle_service.js";
import * as mediaTranscodeJobReportingServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_reporting_service.js";
import * as mediaTranscodeJobWorkflowServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_workflow_service.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
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
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTranscodeJobRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate transcode job operations and persist audit data.
 */
@injectable()
export class TranscodeJobWorkflowWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerService") private readonly customersCustomerClient: customersCustomerServiceApi.CustomerServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetApprovalService") private readonly mediaMediaAssetApprovalClient: mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetReportingService") private readonly mediaMediaAssetReportingClient: mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceClient,
    @inject("grpc:acme.media.v1.RenditionValidationService") private readonly mediaRenditionValidationClient: mediaRenditionValidationServiceApi.RenditionValidationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobLifecycleService") private readonly mediaTranscodeJobLifecycleClient: mediaTranscodeJobLifecycleServiceApi.TranscodeJobLifecycleServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobReportingService") private readonly mediaTranscodeJobReportingClient: mediaTranscodeJobReportingServiceApi.TranscodeJobReportingServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a transcode job.
   */
  async advanceTranscodeJobWorkflow(req: mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowRequest): Promise<mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "AdvanceTranscodeJobWorkflow", req);
    this.logger.info("advance_transcode_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionValidationServiceApi.ValidateRenditionRequest.fromPartial({
      context: req?.context,
      rendition: { audit: { etag: (req?.transcodeJob?.audit?.etag ?? "") } },
    });
    const invoke1: Unary<mediaRenditionValidationServiceApi.ValidateRenditionRequest, mediaRenditionValidationServiceApi.ValidateRenditionResponse> =
      (input, done) => this.mediaRenditionValidationClient.validateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<mediaRenditionValidationServiceApi.ValidateRenditionRequest, mediaRenditionValidationServiceApi.ValidateRenditionResponse>(invoke1, request1));
    const request2 = notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: {
          createdBy: (reply1?.rendition?.audit?.createdBy ?? ""),
          updatedBy: (req?.transcodeJob?.audit?.updatedBy ?? ""),
        },
        counterparty: { displayName: (reply1?.rendition?.owner?.displayName ?? "") },
        lines: [{ quantity: (reply1?.rendition?.components?.["primary"]?.quantity ?? 0) }],
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateSyncClient.pullNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<notificationsNotificationTemplateSyncServiceApi.PullNotificationTemplatesResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: {
          etag: (reply1?.rendition?.audit?.etag ?? ""),
          updatedAt: reply2?.notificationTemplate?.audit?.updatedAt,
          updatedBy: (reply1?.rendition?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke3: Unary<customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.simulateCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: { audit: { createdBy: (reply1?.rendition?.audit?.createdBy ?? "") } },
      }),
      mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowResponse.fromPartial({ transcodeJob: { sla: { dueAt: reply2?.notificationTemplate?.dueAt } } }),
      mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowResponse.fromPartial({
        result: { message: (reply3?.result?.message ?? "") },
        transcodeJob: { assignee: { userId: (reply3?.customerSegment?.owner?.userId ?? "") } },
      }),
      mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: {
          requester: req?.transcodeJob?.requester,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a transcode job.
   */
  async cancelTranscodeJobWorkflow(req: mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowRequest): Promise<mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "CancelTranscodeJobWorkflow", req);
    this.logger.info("cancel_transcode_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.transcodeJob?.comments ?? []).map(async (item) => {
      const request1 = customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest.fromPartial({
        context: req?.context,
        customerSegment: {
          audit: { createdAt: item?.createdAt },
          owner: {
            displayName: ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.displayName ?? ""),
          },
        },
        details: { contact: { email: (item?.authorEmail ?? "") } },
      });
      const invoke1: Unary<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse> =
        (input, done) => this.customersCustomerSegmentCalculationClient.explainCustomerSegmentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse.fromPartial({});
    let selected2_1: string | undefined;
    switch (reply1?.customerSegment?.action?.$case) {
      case "block":
        selected2_1 = ((reply1?.customerSegment?.action?.$case === "block" ? reply1?.customerSegment?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { period: reply1?.customerSegment?.effective },
      reason: (selected2_1 ?? ""),
    });
    const invoke2: Unary<mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse> =
      (input, done) => this.mediaMediaAssetReportingClient.scheduleMediaAssetReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse>(invoke2, request2);
    const request3 = customersHouseholdQueryServiceApi.BrowseHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.customerSegment?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.customerSegment?.parameters ?? {}))),
      },
    });
    const method3 = "browseHouseholds" as const;
    const invoke3: Unary<customersHouseholdQueryServiceApi.BrowseHouseholdsRequest, customersHouseholdQueryServiceApi.BrowseHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersHouseholdQueryServiceApi.BrowseHouseholdsRequest, customersHouseholdQueryServiceApi.BrowseHouseholdsResponse>(invoke3, request3);
    const request4 = mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportRequest.fromPartial({
      context: req?.context,
      transcodeJobId: (req?.transcodeJob?.transcodeJobId ?? ""),
    });
    const proxy4 = forwarding(this.mediaTranscodeJobReportingClient);
    const invoke4: Unary<mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportResponse> =
      (input, done) => proxy4.fetchTranscodeJobReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.FetchTranscodeJobReportResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: { requester: { phone: (reply4?.transcodeJob?.requester?.phone ?? "") } },
      }),
      mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: {
          status: req?.transcodeJob?.status,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a transcode job.
   */
  async inspectTranscodeJobWorkflow(req: mediaTranscodeJobWorkflowServiceApi.InspectTranscodeJobWorkflowRequest): Promise<mediaTranscodeJobWorkflowServiceApi.InspectTranscodeJobWorkflowResponse> {
    validateContext(req.context);
    if (!req.transcodeJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "transcode_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectTranscodeJobWorkflow", req);
    this.logger.info("inspect_transcode_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinitySyncServiceApi.PullAffinitiesRequest.fromPartial({
      affinity: {
        correlationId: (req?.transcodeJobId ?? ""),
        occurredAt: req?.context?.deadline,
      },
      context: req?.context,
    });
    const invoke1: Unary<personalizationAffinitySyncServiceApi.PullAffinitiesRequest, personalizationAffinitySyncServiceApi.PullAffinitiesResponse> =
      (input, done) => this.personalizationAffinitySyncClient.pullAffinities(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinitySyncServiceApi.PullAffinitiesRequest, personalizationAffinitySyncServiceApi.PullAffinitiesResponse>(invoke1, request1);
    return mergeResponses(
      mediaTranscodeJobWorkflowServiceApi.InspectTranscodeJobWorkflowResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      mediaTranscodeJobWorkflowServiceApi.InspectTranscodeJobWorkflowResponse.fromPartial({ transcodeJob: { transcodeJobId: (req?.transcodeJobId ?? "") } }),
    );
  }

  /**
   * Pauses a transcode job.
   */
  async pauseTranscodeJobWorkflow(req: mediaTranscodeJobWorkflowServiceApi.PauseTranscodeJobWorkflowRequest): Promise<mediaTranscodeJobWorkflowServiceApi.PauseTranscodeJobWorkflowResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "PauseTranscodeJobWorkflow", req);
    this.logger.info("pause_transcode_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportResponse> =
      (input, done) => this.mediaTranscodeJobReportingClient.generateTranscodeJobReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportRequest, mediaTranscodeJobReportingServiceApi.GenerateTranscodeJobReportResponse>(invoke1, spread1);
    const results2 = await Promise.all((req?.transcodeJob?.history ?? []).map(async (item) => {
      const request2 = customersHouseholdQueryServiceApi.ExportHouseholdsRequest.fromPartial({
        context: req?.context,
        filter: { createdAfter: item?.changedAt },
      });
      const stream2 = this.customersHouseholdQueryClient.exportHouseholds(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
      const messages2 = await collect(stream2);
      const reply2 = messages2.at(-1) ?? customersHouseholdQueryServiceApi.ExportHouseholdsResponse.fromPartial({});
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? customersHouseholdQueryServiceApi.ExportHouseholdsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      mediaTranscodeJobWorkflowServiceApi.PauseTranscodeJobWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      mediaTranscodeJobWorkflowServiceApi.PauseTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: {
          priority: (req?.transcodeJob?.priority ?? 0),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a transcode job.
   */
  async resumeTranscodeJobWorkflow(req: mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowRequest): Promise<mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "ResumeTranscodeJobWorkflow", req);
    this.logger.info("resume_transcode_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest.fromPartial({
      context: input1?.context,
      reason: (input1?.reason ?? ""),
    });
    const invoke1: Unary<mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse> =
      (input, done) => this.mediaMediaAssetReportingClient.generateMediaAssetReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse>(invoke1, request1);
    const request2 = customersCustomerServiceApi.SearchCustomersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.transcodeJob?.sla?.dueAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
      },
    });
    const cloned2: customersCustomerServiceApi.SearchCustomersRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<customersCustomerServiceApi.SearchCustomersRequest, customersCustomerServiceApi.SearchCustomersResponse> =
      (input, done) => this.customersCustomerClient.searchCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersCustomerServiceApi.SearchCustomersRequest, customersCustomerServiceApi.SearchCustomersResponse>(invoke2, cloned2);
    const request3 = mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.transcodeJob?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.transcodeJob?.assignee?.userId ?? ""),
      },
    });
    const decoded3 = mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest.fromJSON(
      JSON.parse(JSON.stringify(mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest.toJSON(request3))),
    );
    const invoke3: Unary<mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest, mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsResponse> =
      (input, done) => this.mediaTranscodeJobReportingClient.listTranscodeJobReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsRequest, mediaTranscodeJobReportingServiceApi.ListTranscodeJobReportsResponse>(invoke3, decoded3);
    const request4 = customersCustomerServiceApi.WatchCustomersRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.transcodeJob?.requester?.email ?? ""),
        name: req?.details?.notify?.name,
        preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
      },
    });
    const stream4 = this.customersCustomerClient.watchCustomers(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const messages4 = await collect(stream4);
    const reply4 = messages4.at(-1) ?? customersCustomerServiceApi.WatchCustomersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.notify?.phone ?? "") });
    return mergeResponses(
      mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: {
          requester: req?.transcodeJob?.requester,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a transcode job.
   */
  async retryTranscodeJobWorkflow(req: mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowRequest): Promise<mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "RetryTranscodeJobWorkflow", req);
    this.logger.info("retry_transcode_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.transcodeJob?.assignee?.email ?? "") } },
      notificationTemplate: {
        audit: { etag: (req?.transcodeJob?.audit?.etag ?? "") },
        counterparty: { displayName: (req?.transcodeJob?.assignee?.displayName ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.PreviewNotificationTemplateRequest",
      value: Buffer.from(notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.previewNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateResponse>(invoke1, unpacked1);
    const request2 = mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const client2 = this.clients.get<mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceClient>("acme.media.v1.MediaAssetReportingService");
    const invoke2: Unary<mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse> =
      (input, done) => client2.scheduleMediaAssetReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: { priority: (reply1?.notificationTemplate?.counterparty?.priority ?? 0) },
      }),
      mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: {
          assignee: req?.transcodeJob?.assignee,
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a transcode job.
   */
  async signalTranscodeJobWorkflow(req: mediaTranscodeJobWorkflowServiceApi.SignalTranscodeJobWorkflowRequest): Promise<mediaTranscodeJobWorkflowServiceApi.SignalTranscodeJobWorkflowResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "SignalTranscodeJobWorkflow", req);
    this.logger.info("signal_transcode_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetApprovalServiceApi.EscalateMediaAssetRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (req?.transcodeJob?.assignee?.displayName ?? "") },
      },
    });
    const invoke1: Unary<mediaMediaAssetApprovalServiceApi.EscalateMediaAssetRequest, mediaMediaAssetApprovalServiceApi.EscalateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetApprovalClient.escalateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<mediaMediaAssetApprovalServiceApi.EscalateMediaAssetRequest, mediaMediaAssetApprovalServiceApi.EscalateMediaAssetResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      mediaAssetId: (reply1?.mediaAsset?.mediaAssetId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse> =
      (input, done) => this.mediaMediaAssetReportingClient.generateMediaAssetReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      mediaTranscodeJobWorkflowServiceApi.SignalTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: {
          audit: { createdBy: (reply1?.mediaAsset?.audit?.createdBy ?? "") },
          requester: { email: (reply1?.mediaAsset?.owner?.email ?? "") },
        },
      }),
      mediaTranscodeJobWorkflowServiceApi.SignalTranscodeJobWorkflowResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      mediaTranscodeJobWorkflowServiceApi.SignalTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: {
          priority: (req?.transcodeJob?.priority ?? 0),
          transcodeJobId: (req?.transcodeJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a transcode job.
   */
  async startTranscodeJobWorkflow(req: mediaTranscodeJobWorkflowServiceApi.StartTranscodeJobWorkflowRequest): Promise<mediaTranscodeJobWorkflowServiceApi.StartTranscodeJobWorkflowResponse> {
    validateContext(req.context);
    if (req.transcodeJob) {
      await this.repository.save(toTranscodeJobRecord(req.context.tenantId, req.transcodeJob));
    }
    await this.repository.record(req.context.tenantId, "StartTranscodeJobWorkflow", req);
    this.logger.info("start_transcode_job_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_3: string | undefined;
    switch (req?.transcodeJob?.origin?.$case) {
      case "customer":
        selected1_3 = ((req?.transcodeJob?.origin?.$case === "customer" ? req?.transcodeJob?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: {
          displayName: (selected1_3 ?? ""),
          userId: (req?.transcodeJob?.assignee?.userId ?? ""),
        },
        notifyContact: {
          email: (req?.transcodeJob?.requester?.email ?? ""),
          name: req?.details?.notify?.name,
        },
      },
      transcodeJobId: (req?.transcodeJob?.transcodeJobId ?? ""),
    });
    const invoke1: Unary<mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobRequest, mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobLifecycleClient.reinstateTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobRequest, mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobResponse>(invoke1, request1);
    const request2 = notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: reply1?.transcodeJob?.requester?.name } },
      notificationTemplate: {
        audit: {
          createdAt: req?.transcodeJob?.audit?.createdAt,
          updatedAt: req?.transcodeJob?.audit?.updatedAt,
        },
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.validateNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaTranscodeJobWorkflowServiceApi.StartTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: { transcodeJobId: (reply1?.transcodeJob?.transcodeJobId ?? "") },
      }),
      mediaTranscodeJobWorkflowServiceApi.StartTranscodeJobWorkflowResponse.fromPartial({ transcodeJob: { sla: { dueAt: reply2?.notificationTemplate?.dueAt } } }),
      mediaTranscodeJobWorkflowServiceApi.StartTranscodeJobWorkflowResponse.fromPartial({
        transcodeJob: {
          assignee: req?.transcodeJob?.assignee,
          customFields: (req?.transcodeJob?.customFields ?? {}),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for TranscodeJobWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class TranscodeJobWorkflowHandler {
  constructor(@inject(TranscodeJobWorkflowWorkflow) private readonly workflow: TranscodeJobWorkflowWorkflow) {}

  /**
   * Advances a transcode job.
   */
  advanceTranscodeJobWorkflow = unary<mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.AdvanceTranscodeJobWorkflowResponse>(
    (request) => this.workflow.advanceTranscodeJobWorkflow(request),
  );

  /**
   * Cancels a transcode job.
   */
  cancelTranscodeJobWorkflow = unary<mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowResponse>(
    (request) => this.workflow.cancelTranscodeJobWorkflow(request),
  );

  /**
   * Returns a transcode job.
   */
  inspectTranscodeJobWorkflow = (call: ServerUnaryCall<mediaTranscodeJobWorkflowServiceApi.InspectTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.InspectTranscodeJobWorkflowResponse>, done: sendUnaryData<mediaTranscodeJobWorkflowServiceApi.InspectTranscodeJobWorkflowResponse>): void => {
    void this.workflow.inspectTranscodeJobWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a transcode job.
   */
  pauseTranscodeJobWorkflow = unary<mediaTranscodeJobWorkflowServiceApi.PauseTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.PauseTranscodeJobWorkflowResponse>(
    (request) => this.workflow.pauseTranscodeJobWorkflow(request),
  );

  /**
   * Resumes a transcode job.
   */
  resumeTranscodeJobWorkflow = unary<mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowResponse>(
    (request) => this.workflow.resumeTranscodeJobWorkflow(request),
  );

  /**
   * Retrys a transcode job.
   */
  retryTranscodeJobWorkflow = (call: ServerUnaryCall<mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowResponse>, done: sendUnaryData<mediaTranscodeJobWorkflowServiceApi.RetryTranscodeJobWorkflowResponse>): void => {
    void this.workflow.retryTranscodeJobWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a transcode job.
   */
  signalTranscodeJobWorkflow = unary<mediaTranscodeJobWorkflowServiceApi.SignalTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.SignalTranscodeJobWorkflowResponse>(
    (request) => this.workflow.signalTranscodeJobWorkflow(request),
  );

  /**
   * Starts a transcode job.
   */
  startTranscodeJobWorkflow = unary<mediaTranscodeJobWorkflowServiceApi.StartTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.StartTranscodeJobWorkflowResponse>(
    (request) => this.workflow.startTranscodeJobWorkflow(request),
  );
}

export function implementation(handler: TranscodeJobWorkflowHandler): mediaTranscodeJobWorkflowServiceApi.TranscodeJobWorkflowServiceServer {
  return {
    advanceTranscodeJobWorkflow: handler.advanceTranscodeJobWorkflow,
    cancelTranscodeJobWorkflow: handler.cancelTranscodeJobWorkflow,
    inspectTranscodeJobWorkflow: handler.inspectTranscodeJobWorkflow,
    pauseTranscodeJobWorkflow: handler.pauseTranscodeJobWorkflow,
    resumeTranscodeJobWorkflow: handler.resumeTranscodeJobWorkflow,
    retryTranscodeJobWorkflow: handler.retryTranscodeJobWorkflow,
    signalTranscodeJobWorkflow: handler.signalTranscodeJobWorkflow,
    startTranscodeJobWorkflow: handler.startTranscodeJobWorkflow,
  };
}
