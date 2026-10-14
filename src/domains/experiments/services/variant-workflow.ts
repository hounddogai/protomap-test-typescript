/**
 * Runs the long-lived workflow that takes a variant from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as communityBadgeApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityBadgeLifecycleServiceApi from "../../../../.cache/proto/acme/community/v1/badge_lifecycle_service.js";
import * as datasetsDatasetQueryServiceApi from "../../../../.cache/proto/acme/datasets/v1/dataset_query_service.js";
import * as documentsDocumentServiceApi from "../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as experimentsExposureApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_approval_service.js";
import * as experimentsVariantLifecycleServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_lifecycle_service.js";
import * as experimentsVariantReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as experimentsVariantWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_workflow_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationProfileWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as travelTripQueryServiceApi from "../../../../.cache/proto/acme/travel/v1/trip_query_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect, upload, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toVariantRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate variant operations and persist audit data.
 */
@injectable()
export class VariantWorkflowWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.community.v1.BadgeLifecycleService") private readonly communityBadgeLifecycleClient: communityBadgeLifecycleServiceApi.BadgeLifecycleServiceClient,
    @inject("grpc:acme.datasets.v1.DatasetQueryService") private readonly datasetsDatasetQueryClient: datasetsDatasetQueryServiceApi.DatasetQueryServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentApprovalService") private readonly experimentsExperimentApprovalClient: experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureApprovalService") private readonly experimentsExposureApprovalClient: experimentsExposureApprovalServiceApi.ExposureApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.VariantLifecycleService") private readonly experimentsVariantLifecycleClient: experimentsVariantLifecycleServiceApi.VariantLifecycleServiceClient,
    @inject("grpc:acme.experiments.v1.VariantReportingService") private readonly experimentsVariantReportingClient: experimentsVariantReportingServiceApi.VariantReportingServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileWorkflowService") private readonly personalizationProfileWorkflowClient: personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.travel.v1.TripQueryService") private readonly travelTripQueryClient: travelTripQueryServiceApi.TripQueryServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a variant.
   */
  async advanceVariantWorkflow(req: experimentsVariantWorkflowServiceApi.AdvanceVariantWorkflowRequest): Promise<experimentsVariantWorkflowServiceApi.AdvanceVariantWorkflowResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "AdvanceVariantWorkflow", req);
    this.logger.info("advance_variant_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityImportServiceApi.ImportAffinitiesRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        submittedBy: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      } },
    });
    const reply1 = await upload<personalizationAffinityImportServiceApi.ImportAffinitiesRequest, personalizationAffinityImportServiceApi.ImportAffinitiesResponse>(
      (done) => this.personalizationAffinityImportClient.importAffinities(metadataFor(request1.context), { deadline: Date.now() + 15_000 }, done), [request1],
    );
    const request2 = experimentsVariantReportingServiceApi.ListVariantReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.variant?.audit?.updatedAt,
        ownerId: (req?.variant?.owner?.userId ?? ""),
      },
    });
    const invoke2: Unary<experimentsVariantReportingServiceApi.ListVariantReportsRequest, experimentsVariantReportingServiceApi.ListVariantReportsResponse> =
      (input, done) => this.experimentsVariantReportingClient.listVariantReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<experimentsVariantReportingServiceApi.ListVariantReportsRequest, experimentsVariantReportingServiceApi.ListVariantReportsResponse>(invoke2, request2));
    const request3 = experimentsExposureApprovalServiceApi.SubmitExposureRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.notify?.email ?? "") } },
    });
    const invoke3: Unary<experimentsExposureApprovalServiceApi.SubmitExposureRequest, experimentsExposureApprovalServiceApi.SubmitExposureResponse> =
      (input, done) => this.experimentsExposureApprovalClient.submitExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("AdvanceVariantWorkflow.SubmitExposure", () => call<experimentsExposureApprovalServiceApi.SubmitExposureRequest, experimentsExposureApprovalServiceApi.SubmitExposureResponse>(invoke3, request3));
    const request4 = ledgerLedgerAccountServiceApi.WatchLedgerAccountsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.variant?.owner?.email ?? ""),
        name: req?.details?.notify?.name,
        phone: (req?.details?.notify?.phone ?? ""),
        preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
      },
    });
    const stream4 = this.ledgerLedgerAccountClient.watchLedgerAccounts(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const messages4 = await collect(stream4);
    const reply4 = messages4.at(-1) ?? ledgerLedgerAccountServiceApi.WatchLedgerAccountsResponse.fromPartial({});
    const request5 = notificationsNotificationSyncServiceApi.StreamNotificationChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        assignee: req?.variant?.owner,
        priority: (req?.variant?.priority ?? 0),
        subject: (req?.context?.actor?.userId ?? ""),
      } },
      context: req?.context,
    });
    const stream5 = this.notificationsNotificationSyncClient.streamNotificationChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? notificationsNotificationSyncServiceApi.StreamNotificationChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantWorkflowServiceApi.AdvanceVariantWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      experimentsVariantWorkflowServiceApi.AdvanceVariantWorkflowResponse.fromPartial({
        outcome: { nextSteps: (reply3?.outcome?.nextSteps ?? []) },
        result: { status: (reply3?.outcome?.status ?? "") },
      }),
      experimentsVariantWorkflowServiceApi.AdvanceVariantWorkflowResponse.fromPartial({
        variant: {
          priority: (req?.variant?.priority ?? 0),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a variant.
   */
  async cancelVariantWorkflow(req: experimentsVariantWorkflowServiceApi.CancelVariantWorkflowRequest): Promise<experimentsVariantWorkflowServiceApi.CancelVariantWorkflowResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "CancelVariantWorkflow", req);
    this.logger.info("cancel_variant_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentServiceApi.WatchDocumentsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: ((req?.variant?.action?.$case === "block" ? req?.variant?.action.block : undefined)?.notifyEmail ?? ""),
        name: req?.details?.notify?.name,
        phone: (req?.details?.notify?.phone ?? ""),
        preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.documentsDocumentClient.watchDocuments(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? documentsDocumentServiceApi.WatchDocumentsResponse.fromPartial({});
    const request2 = notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.variant?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.variant?.parameters ?? {}))),
        ownerId: (req?.variant?.variantId ?? ""),
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsRequest, notificationsNotificationTemplateNotificationServiceApi.ListNotificationTemplateSubscriptionsResponse> =
      (input, done) => this.notificationsNotificationTemplateNotificationClient.listNotificationTemplateSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantWorkflowServiceApi.CancelVariantWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      experimentsVariantWorkflowServiceApi.CancelVariantWorkflowResponse.fromPartial({
        variant: {
          owner: req?.variant?.owner,
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a variant.
   */
  async inspectVariantWorkflow(req: experimentsVariantWorkflowServiceApi.InspectVariantWorkflowRequest): Promise<experimentsVariantWorkflowServiceApi.InspectVariantWorkflowResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectVariantWorkflow", req);
    this.logger.info("inspect_variant_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    return experimentsVariantWorkflowServiceApi.InspectVariantWorkflowResponse.fromPartial({ variant: { variantId: (req?.variantId ?? "") } });
  }

  /**
   * Lists variants a page at a time.
   */
  async listVariantWorkflows(req: experimentsVariantWorkflowServiceApi.ListVariantWorkflowsRequest): Promise<experimentsVariantWorkflowServiceApi.ListVariantWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListVariantWorkflows", req);
    this.logger.info("list_variant_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeApprovalServiceApi.CommentBadgeApprovalRequest.fromPartial({
      badge: { owner: { email: (req?.context?.actor?.email ?? "") } },
      context: req?.context,
    });
    const reply1 = await this.workQueue.enqueue<communityBadgeApprovalServiceApi.CommentBadgeApprovalRequest, communityBadgeApprovalServiceApi.CommentBadgeApprovalResponse>(
      "acme.experiments.v1.VariantWorkflowService/ListVariantWorkflows:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsVariantWorkflowServiceApi.ListVariantWorkflowsResponse.fromPartial({
      result: { status: (reply1?.outcome?.status ?? "") },
      variants: [{ owner: reply1?.badge?.owner }],
    });
  }

  /**
   * Pauses a variant.
   */
  async pauseVariantWorkflow(req: experimentsVariantWorkflowServiceApi.PauseVariantWorkflowRequest): Promise<experimentsVariantWorkflowServiceApi.PauseVariantWorkflowResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "PauseVariantWorkflow", req);
    this.logger.info("pause_variant_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.variant?.owner?.displayName ?? "") } },
    });
    const invoke1: Unary<notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.estimateDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.EstimateDeliveryAttemptResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantWorkflowServiceApi.PauseVariantWorkflowResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      experimentsVariantWorkflowServiceApi.PauseVariantWorkflowResponse.fromPartial({
        variant: {
          owner: req?.variant?.owner,
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a variant.
   */
  async resumeVariantWorkflow(req: experimentsVariantWorkflowServiceApi.ResumeVariantWorkflowRequest): Promise<experimentsVariantWorkflowServiceApi.ResumeVariantWorkflowResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "ResumeVariantWorkflow", req);
    this.logger.info("resume_variant_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantLifecycleServiceApi.RenewVariantRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: { displayName: (req?.variant?.owner?.displayName ?? "") },
        notifyContact: { phone: (req?.details?.notify?.phone ?? "") },
      },
      variantId: (req?.variantId ?? ""),
    });
    const invoke1: Unary<experimentsVariantLifecycleServiceApi.RenewVariantRequest, experimentsVariantLifecycleServiceApi.RenewVariantResponse> =
      (input, done) => this.experimentsVariantLifecycleClient.renewVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsVariantLifecycleServiceApi.RenewVariantResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const tasks2: Array<() => Promise<featureflagsFeatureFlagValidationServiceApi.ValidateFeatureFlagResponse>> = [];
    for (const item of (req?.variant?.conditions ?? [])) {
      tasks2.push(async () => {
        const request2 = featureflagsFeatureFlagValidationServiceApi.ValidateFeatureFlagRequest.fromPartial({
          context: req?.context,
          featureFlag: {
            conditions: [{
              negate: (item?.negate ?? false),
              value: (item?.value ?? ""),
            }],
          },
        });
        const invoke2: Unary<featureflagsFeatureFlagValidationServiceApi.ValidateFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.ValidateFeatureFlagResponse> =
          (input, done) => this.featureflagsFeatureFlagValidationClient.validateFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<featureflagsFeatureFlagValidationServiceApi.ValidateFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.ValidateFeatureFlagResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? featureflagsFeatureFlagValidationServiceApi.ValidateFeatureFlagResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantWorkflowServiceApi.ResumeVariantWorkflowResponse.fromPartial({ variant: { priority: (reply1?.variant?.priority ?? 0) } }),
      experimentsVariantWorkflowServiceApi.ResumeVariantWorkflowResponse.fromPartial({
        variant: {
          description: (req?.variant?.description ?? ""),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a variant.
   */
  async retryVariantWorkflow(req: experimentsVariantWorkflowServiceApi.RetryVariantWorkflowRequest): Promise<experimentsVariantWorkflowServiceApi.RetryVariantWorkflowResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "RetryVariantWorkflow", req);
    this.logger.info("retry_variant_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = datasetsDatasetQueryServiceApi.FindDatasetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.variant?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
        ownerId: (req?.variant?.owner?.userId ?? ""),
      },
    });
    const invoke1: Unary<datasetsDatasetQueryServiceApi.FindDatasetsRequest, datasetsDatasetQueryServiceApi.FindDatasetsResponse> =
      (input, done) => this.datasetsDatasetQueryClient.findDatasets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = venuesVenueValidationServiceApi.PreviewVenueRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
      venue: { owner: { email: (req?.variant?.owner?.email ?? "") } },
    });
    const invoke2: Unary<venuesVenueValidationServiceApi.PreviewVenueRequest, venuesVenueValidationServiceApi.PreviewVenueResponse> =
      (input, done) => this.venuesVenueValidationClient.previewVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = personalizationAffinityReportingServiceApi.ShareAffinityReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const method3 = "shareAffinityReport" as const;
    const invoke3: Unary<personalizationAffinityReportingServiceApi.ShareAffinityReportRequest, personalizationAffinityReportingServiceApi.ShareAffinityReportResponse> =
      (input, done) => this.personalizationAffinityReportingClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationAffinityReportingServiceApi.ShareAffinityReportRequest, personalizationAffinityReportingServiceApi.ShareAffinityReportResponse>(invoke3, request3);
    const request4 = personalizationProfileWorkflowServiceApi.SignalProfileWorkflowRequest.fromPartial({
      context: req?.context,
      profile: {
        audit: {
          createdBy: (req?.variant?.audit?.createdBy ?? ""),
          etag: (reply2?.venue?.audit?.etag ?? ""),
          updatedAt: reply2?.venue?.audit?.updatedAt,
        },
      },
    });
    const proxy4 = forwarding(this.personalizationProfileWorkflowClient);
    const invoke4: Unary<personalizationProfileWorkflowServiceApi.SignalProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.SignalProfileWorkflowResponse> =
      (input, done) => proxy4.signalProfileWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<personalizationProfileWorkflowServiceApi.SignalProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.SignalProfileWorkflowResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantWorkflowServiceApi.RetryVariantWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      experimentsVariantWorkflowServiceApi.RetryVariantWorkflowResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        variant: { audit: { updatedBy: (reply2?.venue?.audit?.updatedBy ?? "") } },
      }),
      experimentsVariantWorkflowServiceApi.RetryVariantWorkflowResponse.fromPartial({ result: { message: (reply3?.outcome?.message ?? "") } }),
      experimentsVariantWorkflowServiceApi.RetryVariantWorkflowResponse.fromPartial({
        outcome: { effectiveAt: reply4?.outcome?.effectiveAt },
        variant: { audit: { updatedBy: (reply4?.profile?.audit?.updatedBy ?? "") } },
      }),
      experimentsVariantWorkflowServiceApi.RetryVariantWorkflowResponse.fromPartial({
        variant: {
          status: req?.variant?.status,
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a variant.
   */
  async signalVariantWorkflow(req: experimentsVariantWorkflowServiceApi.SignalVariantWorkflowRequest): Promise<experimentsVariantWorkflowServiceApi.SignalVariantWorkflowResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "SignalVariantWorkflow", req);
    this.logger.info("signal_variant_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.variant?.owner?.displayName ?? ""),
          email: (req?.variant?.owner?.email ?? ""),
        },
      },
      experiment: {
        participants: [{ contact: { email: (req?.details?.notify?.email ?? "") } }],
      },
    });
    const invoke1: Unary<experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest, experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse> =
      (input, done) => this.experimentsExperimentApprovalClient.commentExperimentApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentApprovalServiceApi.CommentExperimentApprovalRequest, experimentsExperimentApprovalServiceApi.CommentExperimentApprovalResponse>(invoke1, request1);
    const request2 = travelTripQueryServiceApi.ExportTripsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.experiment?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
        ownerId: (req?.variant?.owner?.userId ?? ""),
        region: (reply1?.experiment?.location?.region ?? ""),
      },
    });
    const stream2 = this.travelTripQueryClient.exportTrips(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? travelTripQueryServiceApi.ExportTripsResponse.fromPartial({});
    const request3 = communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest.fromPartial({
      badge: {
        audit: {
          createdAt: reply1?.experiment?.audit?.createdAt,
          etag: (reply1?.experiment?.audit?.etag ?? ""),
          updatedAt: req?.variant?.audit?.updatedAt,
        },
      },
      context: req?.context,
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest, communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse> =
      (input, done) => this.communityBadgeLifecycleClient.scheduleBadgeExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest, communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = experimentsVariantLifecycleServiceApi.GetVariantLifecycleRequest.fromPartial({
      context: input4?.context,
      variantId: (input4?.variantId ?? ""),
    });
    const invoke4: Unary<experimentsVariantLifecycleServiceApi.GetVariantLifecycleRequest, experimentsVariantLifecycleServiceApi.GetVariantLifecycleResponse> =
      (input, done) => this.experimentsVariantLifecycleClient.getVariantLifecycle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsVariantLifecycleServiceApi.GetVariantLifecycleRequest, experimentsVariantLifecycleServiceApi.GetVariantLifecycleResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantWorkflowServiceApi.SignalVariantWorkflowResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      experimentsVariantWorkflowServiceApi.SignalVariantWorkflowResponse.fromPartial({ variant: { audit: { updatedAt: reply3?.badge?.audit?.updatedAt } } }),
      experimentsVariantWorkflowServiceApi.SignalVariantWorkflowResponse.fromPartial({
        variant: {
          audit: { updatedBy: (reply4?.variant?.audit?.updatedBy ?? "") },
          owner: { displayName: (reply4?.variant?.owner?.displayName ?? "") },
        },
      }),
      experimentsVariantWorkflowServiceApi.SignalVariantWorkflowResponse.fromPartial({
        variant: {
          name: (req?.variant?.name ?? ""),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a variant.
   */
  async startVariantWorkflow(req: experimentsVariantWorkflowServiceApi.StartVariantWorkflowRequest): Promise<experimentsVariantWorkflowServiceApi.StartVariantWorkflowResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "StartVariantWorkflow", req);
    this.logger.info("start_variant_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const cloned1: personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest, personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.generateRecommendationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest, personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse>(invoke1, cloned1);
    const request2 = identityUserValidationServiceApi.PreviewUserRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.notify?.email ?? "") } },
    });
    const decoded2 = identityUserValidationServiceApi.PreviewUserRequest.fromJSON(
      JSON.parse(JSON.stringify(identityUserValidationServiceApi.PreviewUserRequest.toJSON(request2))),
    );
    const invoke2: Unary<identityUserValidationServiceApi.PreviewUserRequest, identityUserValidationServiceApi.PreviewUserResponse> =
      (input, done) => this.identityUserValidationClient.previewUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserValidationServiceApi.PreviewUserRequest, identityUserValidationServiceApi.PreviewUserResponse>(invoke2, decoded2);
    const request3 = ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply2?.user?.primaryAddress?.region ?? "") },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.ledger.v1.SearchLedgerAccountsRequest",
      value: Buffer.from(ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest.encode(request3).finish()),
    });
    const unpacked3 = ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest.decode(envelope3.value);
    const invoke3: Unary<ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest, ledgerLedgerAccountServiceApi.SearchLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountClient.searchLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest, ledgerLedgerAccountServiceApi.SearchLedgerAccountsResponse>(invoke3, unpacked3);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      experimentsVariantWorkflowServiceApi.StartVariantWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      experimentsVariantWorkflowServiceApi.StartVariantWorkflowResponse.fromPartial({
        outcome: {
          effectiveAt: reply2?.outcome?.effectiveAt,
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      experimentsVariantWorkflowServiceApi.StartVariantWorkflowResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      experimentsVariantWorkflowServiceApi.StartVariantWorkflowResponse.fromPartial({
        variant: {
          owner: req?.variant?.owner,
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for VariantWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class VariantWorkflowHandler {
  constructor(@inject(VariantWorkflowWorkflow) private readonly workflow: VariantWorkflowWorkflow) {}

  /**
   * Advances a variant.
   */
  advanceVariantWorkflow = unary<experimentsVariantWorkflowServiceApi.AdvanceVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.AdvanceVariantWorkflowResponse>(
    (request) => this.workflow.advanceVariantWorkflow(request),
  );

  /**
   * Cancels a variant.
   */
  cancelVariantWorkflow = unary<experimentsVariantWorkflowServiceApi.CancelVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.CancelVariantWorkflowResponse>(
    (request) => this.workflow.cancelVariantWorkflow(request),
  );

  /**
   * Returns a variant.
   */
  inspectVariantWorkflow = (call: ServerUnaryCall<experimentsVariantWorkflowServiceApi.InspectVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.InspectVariantWorkflowResponse>, done: sendUnaryData<experimentsVariantWorkflowServiceApi.InspectVariantWorkflowResponse>): void => {
    void this.workflow.inspectVariantWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists variants a page at a time.
   */
  listVariantWorkflows = unary<experimentsVariantWorkflowServiceApi.ListVariantWorkflowsRequest, experimentsVariantWorkflowServiceApi.ListVariantWorkflowsResponse>(
    (request) => this.workflow.listVariantWorkflows(request),
  );

  /**
   * Pauses a variant.
   */
  pauseVariantWorkflow = unary<experimentsVariantWorkflowServiceApi.PauseVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.PauseVariantWorkflowResponse>(
    (request) => this.workflow.pauseVariantWorkflow(request),
  );

  /**
   * Resumes a variant.
   */
  resumeVariantWorkflow = (call: ServerUnaryCall<experimentsVariantWorkflowServiceApi.ResumeVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.ResumeVariantWorkflowResponse>, done: sendUnaryData<experimentsVariantWorkflowServiceApi.ResumeVariantWorkflowResponse>): void => {
    void this.workflow.resumeVariantWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a variant.
   */
  retryVariantWorkflow = unary<experimentsVariantWorkflowServiceApi.RetryVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.RetryVariantWorkflowResponse>(
    (request) => this.workflow.retryVariantWorkflow(request),
  );

  /**
   * Signals a variant.
   */
  signalVariantWorkflow = unary<experimentsVariantWorkflowServiceApi.SignalVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.SignalVariantWorkflowResponse>(
    (request) => this.workflow.signalVariantWorkflow(request),
  );

  /**
   * Starts a variant.
   */
  startVariantWorkflow = (call: ServerUnaryCall<experimentsVariantWorkflowServiceApi.StartVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.StartVariantWorkflowResponse>, done: sendUnaryData<experimentsVariantWorkflowServiceApi.StartVariantWorkflowResponse>): void => {
    void this.workflow.startVariantWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: VariantWorkflowHandler): experimentsVariantWorkflowServiceApi.VariantWorkflowServiceServer {
  return {
    advanceVariantWorkflow: handler.advanceVariantWorkflow,
    cancelVariantWorkflow: handler.cancelVariantWorkflow,
    inspectVariantWorkflow: handler.inspectVariantWorkflow,
    listVariantWorkflows: handler.listVariantWorkflows,
    pauseVariantWorkflow: handler.pauseVariantWorkflow,
    resumeVariantWorkflow: handler.resumeVariantWorkflow,
    retryVariantWorkflow: handler.retryVariantWorkflow,
    signalVariantWorkflow: handler.signalVariantWorkflow,
    startVariantWorkflow: handler.startVariantWorkflow,
  };
}
