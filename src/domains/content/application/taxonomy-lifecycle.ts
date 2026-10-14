/**
 * Moves a taxonomy between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as contentContentRevisionCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as contentContentRevisionValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as contentTaxonomyLifecycleServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_lifecycle_service.js";
import * as contentTaxonomyValidationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as experimentsExposureSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as recruitingJobOpeningServiceApi from "../../../../.cache/proto/acme/recruiting/v1/job_opening_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTaxonomyRecord } from "../data/records.js";
import { ContentRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate taxonomy operations and persist audit data.
 */
@injectable()
export class TaxonomyLifecycleWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.content.v1.ContentRevisionCalculationService") private readonly contentContentRevisionCalculationClient: contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionValidationService") private readonly contentContentRevisionValidationClient: contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyValidationService") private readonly contentTaxonomyValidationClient: contentTaxonomyValidationServiceApi.TaxonomyValidationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentApprovalService") private readonly experimentsExperimentApprovalClient: experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureSyncService") private readonly experimentsExposureSyncClient: experimentsExposureSyncServiceApi.ExposureSyncServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.recruiting.v1.JobOpeningService") private readonly recruitingJobOpeningClient: recruitingJobOpeningServiceApi.JobOpeningServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a taxonomy.
   */
  async activateTaxonomy(req: contentTaxonomyLifecycleServiceApi.ActivateTaxonomyRequest): Promise<contentTaxonomyLifecycleServiceApi.ActivateTaxonomyResponse> {
    validateContext(req.context);
    if (!req.taxonomyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "taxonomy_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateTaxonomy", req);
    this.logger.info("activate_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      contentRevision: {
        subject: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.compareContentRevisionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse>(invoke1, request1);
    const request2 = recruitingJobOpeningServiceApi.BatchGetJobOpeningsRequest.fromPartial({ context: req?.context });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<recruitingJobOpeningServiceApi.BatchGetJobOpeningsRequest, recruitingJobOpeningServiceApi.BatchGetJobOpeningsResponse> =
      (input, done) => this.recruitingJobOpeningClient.batchGetJobOpenings(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<recruitingJobOpeningServiceApi.BatchGetJobOpeningsRequest, recruitingJobOpeningServiceApi.BatchGetJobOpeningsResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest.fromPartial({
      context: input3?.context,
      details: {
        recipient: {
          name: input3?.details?.notifyContact?.name,
          phone: (input3?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (input3?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke3: Unary<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse> =
      (input, done) => this.notificationsNotificationNotificationClient.subscribeNotificationUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse>(invoke3, request3);
    const request4 = identityUserQueryServiceApi.SuggestUsersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply3?.notification?.sla?.dueAt,
        labels: Object.fromEntries(Object.entries((reply3?.result?.details ?? {}))),
        ownerId: (reply3?.notification?.assignee?.userId ?? ""),
      },
    });
    const cloned4: identityUserQueryServiceApi.SuggestUsersRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<identityUserQueryServiceApi.SuggestUsersRequest, identityUserQueryServiceApi.SuggestUsersResponse> =
      (input, done) => this.identityUserQueryClient.suggestUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<identityUserQueryServiceApi.SuggestUsersRequest, identityUserQueryServiceApi.SuggestUsersResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.details?.newOwner?.email ?? "") });
    return mergeResponses(
      contentTaxonomyLifecycleServiceApi.ActivateTaxonomyResponse.fromPartial({
        taxonomy: {
          attributes: (reply1?.contentRevision?.attributes ?? {}),
          children: [{
            children: [{
              children: [{ attributes: (reply1?.contentRevision?.attributes ?? {}) }],
            }],
          }],
        },
      }),
      contentTaxonomyLifecycleServiceApi.ActivateTaxonomyResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      contentTaxonomyLifecycleServiceApi.ActivateTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{
            audit: { createdAt: reply3?.notification?.audit?.createdAt },
            manager: { email: (reply3?.notification?.requester?.email ?? "") },
          }],
        },
      }),
      contentTaxonomyLifecycleServiceApi.ActivateTaxonomyResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          message: (reply4?.result?.message ?? ""),
        },
      }),
      contentTaxonomyLifecycleServiceApi.ActivateTaxonomyResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        taxonomy: { taxonomyId: (req?.taxonomyId ?? "") },
      }),
    );
  }

  /**
   * Expires a taxonomy.
   */
  async expireTaxonomy(req: contentTaxonomyLifecycleServiceApi.ExpireTaxonomyRequest): Promise<contentTaxonomyLifecycleServiceApi.ExpireTaxonomyResponse> {
    validateContext(req.context);
    if (!req.taxonomyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "taxonomy_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireTaxonomy", req);
    this.logger.info("expire_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityImportServiceApi.ListAffinityImportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const decoded1 = personalizationAffinityImportServiceApi.ListAffinityImportsRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationAffinityImportServiceApi.ListAffinityImportsRequest.toJSON(request1))),
    );
    const invoke1: Unary<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse> =
      (input, done) => this.personalizationAffinityImportClient.listAffinityImports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>(invoke1, decoded1);
    const request2 = contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      contentRevision: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.content.v1.RecalculateContentRevisionsRequest",
      value: Buffer.from(contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest.encode(request2).finish()),
    });
    const unpacked2 = contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest.decode(envelope2.value);
    const invoke2: Unary<contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest, contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.recalculateContentRevisions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest, contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyLifecycleServiceApi.ExpireTaxonomyResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      contentTaxonomyLifecycleServiceApi.ExpireTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{
              children: [{ attributes: (reply2?.contentRevision?.attributes ?? {}) }],
            }],
          }],
        },
      }),
      contentTaxonomyLifecycleServiceApi.ExpireTaxonomyResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        taxonomy: { taxonomyId: (req?.taxonomyId ?? "") },
      }),
    );
  }

  /**
   * Returns a taxonomy.
   */
  async getTaxonomyLifecycle(req: contentTaxonomyLifecycleServiceApi.GetTaxonomyLifecycleRequest): Promise<contentTaxonomyLifecycleServiceApi.GetTaxonomyLifecycleResponse> {
    validateContext(req.context);
    if (!req.taxonomyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "taxonomy_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTaxonomyLifecycle", req);
    this.logger.info("get_taxonomy_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureReportingServiceApi.CountExposureTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        ownerId: (req?.taxonomyId ?? ""),
      },
    });
    const client1 = this.clients.get<experimentsExposureReportingServiceApi.ExposureReportingServiceClient>("acme.experiments.v1.ExposureReportingService");
    const invoke1: Unary<experimentsExposureReportingServiceApi.CountExposureTotalsRequest, experimentsExposureReportingServiceApi.CountExposureTotalsResponse> =
      (input, done) => client1.countExposureTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureReportingServiceApi.CountExposureTotalsRequest, experimentsExposureReportingServiceApi.CountExposureTotalsResponse>(invoke1, request1);
    const request2 = contentContentRevisionValidationServiceApi.ScoreContentRevisionRequest.fromPartial({
      contentRevision: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        source: (req?.taxonomyId ?? ""),
        subject: { email: (req?.context?.actor?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<contentContentRevisionValidationServiceApi.ScoreContentRevisionRequest, contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse> =
      (input, done) => this.contentContentRevisionValidationClient.scoreContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<contentContentRevisionValidationServiceApi.ScoreContentRevisionRequest, contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    return mergeResponses(
      contentTaxonomyLifecycleServiceApi.GetTaxonomyLifecycleResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      contentTaxonomyLifecycleServiceApi.GetTaxonomyLifecycleResponse.fromPartial({ taxonomy: { attributes: (reply2?.contentRevision?.attributes ?? {}) } }),
      contentTaxonomyLifecycleServiceApi.GetTaxonomyLifecycleResponse.fromPartial({ taxonomy: { taxonomyId: (req?.taxonomyId ?? "") } }),
    );
  }

  /**
   * Reinstates a taxonomy.
   */
  async reinstateTaxonomy(req: contentTaxonomyLifecycleServiceApi.ReinstateTaxonomyRequest): Promise<contentTaxonomyLifecycleServiceApi.ReinstateTaxonomyResponse> {
    validateContext(req.context);
    if (!req.taxonomyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "taxonomy_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateTaxonomy", req);
    this.logger.info("reinstate_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentValidationServiceApi.ExplainCustomerSegmentDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<customersCustomerSegmentValidationServiceApi.ExplainCustomerSegmentDecisionRequest, customersCustomerSegmentValidationServiceApi.ExplainCustomerSegmentDecisionResponse> =
      (input, done) => this.customersCustomerSegmentValidationClient.explainCustomerSegmentDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<customersCustomerSegmentValidationServiceApi.ExplainCustomerSegmentDecisionRequest, customersCustomerSegmentValidationServiceApi.ExplainCustomerSegmentDecisionResponse>(invoke1, request1));
    const request2 = contentTaxonomyValidationServiceApi.GetTaxonomyRulesRequest.fromPartial({
      context: req?.context,
      taxonomyId: (req?.taxonomyId ?? ""),
    });
    const invoke2: Unary<contentTaxonomyValidationServiceApi.GetTaxonomyRulesRequest, contentTaxonomyValidationServiceApi.GetTaxonomyRulesResponse> =
      (input, done) => this.contentTaxonomyValidationClient.getTaxonomyRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ReinstateTaxonomy.GetTaxonomyRules", () => call<contentTaxonomyValidationServiceApi.GetTaxonomyRulesRequest, contentTaxonomyValidationServiceApi.GetTaxonomyRulesResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyLifecycleServiceApi.ReinstateTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{
            audit: { createdBy: (reply1?.customerSegment?.audit?.createdBy ?? "") },
          }],
        },
      }),
      contentTaxonomyLifecycleServiceApi.ReinstateTaxonomyResponse.fromPartial({ taxonomy: { audit: { etag: (reply2?.taxonomy?.audit?.etag ?? "") } } }),
      contentTaxonomyLifecycleServiceApi.ReinstateTaxonomyResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        taxonomy: { taxonomyId: (req?.taxonomyId ?? "") },
      }),
    );
  }

  /**
   * Renews a taxonomy.
   */
  async renewTaxonomy(req: contentTaxonomyLifecycleServiceApi.RenewTaxonomyRequest): Promise<contentTaxonomyLifecycleServiceApi.RenewTaxonomyResponse> {
    validateContext(req.context);
    if (!req.taxonomyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "taxonomy_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewTaxonomy", req);
    this.logger.info("renew_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceCalculationServiceApi.RecalculatePreferencesRequest.fromPartial({
      context: req?.context,
      preference: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<customersPreferenceCalculationServiceApi.RecalculatePreferencesRequest, customersPreferenceCalculationServiceApi.RecalculatePreferencesResponse> =
      (input, done) => this.customersPreferenceCalculationClient.recalculatePreferences(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest.fromPartial({
      contentRevision: {
        subject: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
        },
      },
      context: req?.context,
      details: { currencyCode: (reply1?.breakdown?.currencyCode ?? "") },
      reason: ((reply1?.preference?.action?.$case === "block" ? reply1?.preference?.action.block : undefined)?.reason ?? ""),
    });
    const reply2 = await this.workQueue.enqueue<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse>(
      "acme.content.v1.TaxonomyLifecycleService/RenewTaxonomy:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyLifecycleServiceApi.RenewTaxonomyResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      contentTaxonomyLifecycleServiceApi.RenewTaxonomyResponse.fromPartial({
        result: { correlationId: (reply2?.contentRevision?.correlationId ?? "") },
        taxonomy: {
          children: [{
            children: [{ attributes: (reply2?.contentRevision?.attributes ?? {}) }],
          }],
        },
      }),
      contentTaxonomyLifecycleServiceApi.RenewTaxonomyResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        taxonomy: { taxonomyId: (req?.taxonomyId ?? "") },
      }),
    );
  }

  /**
   * Schedules a taxonomy.
   */
  async scheduleTaxonomyExpiry(req: contentTaxonomyLifecycleServiceApi.ScheduleTaxonomyExpiryRequest): Promise<contentTaxonomyLifecycleServiceApi.ScheduleTaxonomyExpiryResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "ScheduleTaxonomyExpiry", req);
    this.logger.info("schedule_taxonomy_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.taxonomy?.manager?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationRequest, contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.explainContentRevisionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationRequest, contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyLifecycleServiceApi.ScheduleTaxonomyExpiryResponse.fromPartial({ outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") } }),
      contentTaxonomyLifecycleServiceApi.ScheduleTaxonomyExpiryResponse.fromPartial({
        taxonomy: {
          parentId: (req?.taxonomy?.parentId ?? ""),
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Suspends a taxonomy.
   */
  async suspendTaxonomy(req: contentTaxonomyLifecycleServiceApi.SuspendTaxonomyRequest): Promise<contentTaxonomyLifecycleServiceApi.SuspendTaxonomyResponse> {
    validateContext(req.context);
    if (!req.taxonomyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "taxonomy_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendTaxonomy", req);
    this.logger.info("suspend_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest.fromPartial({
      contentRevision: { subject: { email: (req?.details?.newOwner?.email ?? "") } },
      context: req?.context,
    });
    const invoke1: Unary<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse> =
      (input, done) => this.contentContentRevisionCalculationClient.compareContentRevisionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest.fromPartial({
      consentRecord: { kind: (reply1?.contentRevision?.kind ?? "") },
      context: req?.context,
    });
    const invoke2: Unary<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.quoteConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyLifecycleServiceApi.SuspendTaxonomyResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      contentTaxonomyLifecycleServiceApi.SuspendTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{ children: [{ attributes: (reply2?.consentRecord?.attributes ?? {}) }] }],
        },
      }),
      contentTaxonomyLifecycleServiceApi.SuspendTaxonomyResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        taxonomy: { taxonomyId: (req?.taxonomyId ?? "") },
      }),
    );
  }

  /**
   * Terminates a taxonomy.
   */
  async terminateTaxonomy(req: contentTaxonomyLifecycleServiceApi.TerminateTaxonomyRequest): Promise<contentTaxonomyLifecycleServiceApi.TerminateTaxonomyResponse> {
    validateContext(req.context);
    if (!req.taxonomyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "taxonomy_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateTaxonomy", req);
    this.logger.info("terminate_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerCalculationServiceApi.ExplainCustomerCalculationRequest.fromPartial({
      context: req?.context,
      customer: {
        contact: { email: (req?.details?.newOwner?.email ?? "") },
        relationshipManager: { email: (req?.details?.notifyContact?.email ?? "") },
      },
      details: {
        contact: {
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<customersCustomerCalculationServiceApi.ExplainCustomerCalculationRequest, customersCustomerCalculationServiceApi.ExplainCustomerCalculationResponse> =
      (input, done) => this.customersCustomerCalculationClient.explainCustomerCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = experimentsExposureSyncServiceApi.SyncExposuresRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      exposure: {
        attributes: Object.fromEntries(Object.entries((reply1?.customer?.attributes ?? {}))),
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const method2 = "syncExposures" as const;
    const invoke2: Unary<experimentsExposureSyncServiceApi.SyncExposuresRequest, experimentsExposureSyncServiceApi.SyncExposuresResponse> =
      (input, done) => this.experimentsExposureSyncClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExposureSyncServiceApi.SyncExposuresRequest, experimentsExposureSyncServiceApi.SyncExposuresResponse>(invoke2, request2);
    const request3 = experimentsExperimentApprovalServiceApi.RejectExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        organizer: {
          displayName: (reply1?.customer?.relationshipManager?.displayName ?? ""),
        },
        participants: [{
          contact: {
            name: reply1?.customer?.contact?.name,
            phone: (req?.details?.notifyContact?.phone ?? ""),
            preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
          },
        }],
      },
    });
    const proxy3 = forwarding(this.experimentsExperimentApprovalClient);
    const invoke3: Unary<experimentsExperimentApprovalServiceApi.RejectExperimentRequest, experimentsExperimentApprovalServiceApi.RejectExperimentResponse> =
      (input, done) => proxy3.rejectExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExperimentApprovalServiceApi.RejectExperimentRequest, experimentsExperimentApprovalServiceApi.RejectExperimentResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyLifecycleServiceApi.TerminateTaxonomyResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      contentTaxonomyLifecycleServiceApi.TerminateTaxonomyResponse.fromPartial({
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
        result: { correlationId: (reply2?.exposure?.correlationId ?? "") },
      }),
      contentTaxonomyLifecycleServiceApi.TerminateTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{ manager: { email: (reply3?.experiment?.organizer?.email ?? "") } }],
          location: { region: (reply3?.experiment?.location?.region ?? "") },
        },
      }),
      contentTaxonomyLifecycleServiceApi.TerminateTaxonomyResponse.fromPartial({
        taxonomy: {
          manager: { displayName: (req?.details?.newOwner?.displayName ?? "") },
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }
}
