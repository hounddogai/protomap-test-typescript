/**
 * Runs the long-lived workflow that takes an affinity from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as communityForumApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as corporateeventsCorporateEventCalculationServiceApi from "../../../../.cache/proto/acme/corporateevents/v1/corporate_event_calculation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationAffinityWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_workflow_service.js";
import * as personalizationProfileWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
import * as personalizationRecommendationApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_approval_service.js";
import * as personalizationRecommendationLifecycleServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_lifecycle_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { GrpcAdapter, call, forwarding, metadataFor, type RequestPort, type Unary } from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toAffinityRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate affinity operations and persist audit data.
 */
@injectable()
export class AffinityWorkflowWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.corporateevents.v1.CorporateEventCalculationService") private readonly corporateeventsCorporateEventCalculationClient: corporateeventsCorporateEventCalculationServiceApi.CorporateEventCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileWorkflowService") private readonly personalizationProfileWorkflowClient: personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationApprovalService") private readonly personalizationRecommendationApprovalClient: personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationLifecycleService") private readonly personalizationRecommendationLifecycleClient: personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances an affinity.
   */
  async advanceAffinityWorkflow(req: personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowRequest): Promise<personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "AdvanceAffinityWorkflow", req);
    this.logger.info("advance_affinity_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const proxy1 = forwarding(this.personalizationAffinityReportingClient);
    const invoke1: Unary<personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest, personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse> =
      (input, done) => proxy1.generateAffinityReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest, personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse>(invoke1, request1);
    const settled2 = await Promise.allSettled((req?.affinity?.measurements ?? []).map(async (item) => {
      const request2 = metricsMetricSeriesServiceApi.CloneMetricSeriesRequest.fromPartial({
        context: req?.context,
        metricSeries: {
          audit: { updatedAt: item?.observedAt },
          dimensions: { unit: (item?.unit ?? "") },
          owner: {
            displayName: (req?.affinity?.subject?.displayName ?? ""),
            email: (req?.details?.notify?.email ?? ""),
          },
        },
      });
      const invoke2: Unary<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse> =
        (input, done) => this.metricsMetricSeriesClient.cloneMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: metricsMetricSeriesServiceApi.CloneMetricSeriesResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? metricsMetricSeriesServiceApi.CloneMetricSeriesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      personalizationAffinityWorkflowServiceApi.AdvanceAffinityWorkflowResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          sequence: (req?.affinity?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Returns an affinity.
   */
  async inspectAffinityWorkflow(req: personalizationAffinityWorkflowServiceApi.InspectAffinityWorkflowRequest): Promise<personalizationAffinityWorkflowServiceApi.InspectAffinityWorkflowResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectAffinityWorkflow", req);
    this.logger.info("inspect_affinity_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileWorkflowServiceApi.RetryProfileWorkflowRequest.fromPartial({
      context: req?.context,
      profile: {
        relationshipManager: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationProfileWorkflowServiceApi.RetryProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.RetryProfileWorkflowResponse> =
      (input, done) => this.personalizationProfileWorkflowClient.retryProfileWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileWorkflowServiceApi.RetryProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.RetryProfileWorkflowResponse>(invoke1, request1);
    const request2 = notificationsNotificationSyncServiceApi.StreamNotificationChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        subject: (req?.affinityId ?? ""),
      } },
      context: req?.context,
    });
    const stream2 = this.notificationsNotificationSyncClient.streamNotificationChanges(metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const reading2 = collect(stream2);
    const writing2 = (async () => {
      await write(stream2, request2);
      stream2.end();
    })();
    const [messages2] = await Promise.all([reading2, writing2]);
    const reply2 = messages2.at(-1) ?? notificationsNotificationSyncServiceApi.StreamNotificationChangesResponse.fromPartial({});
    return mergeResponses(
      personalizationAffinityWorkflowServiceApi.InspectAffinityWorkflowResponse.fromPartial({
        affinity: {
          subject: {
            displayName: (reply1?.profile?.relationshipManager?.displayName ?? ""),
            number: ((reply1?.profile?.identityDocument?.$case === "nationalId" ? reply1?.profile?.identityDocument.nationalId : undefined)?.number ?? ""),
          },
        },
      }),
      personalizationAffinityWorkflowServiceApi.InspectAffinityWorkflowResponse.fromPartial({ affinity: { affinityId: (req?.affinityId ?? "") } }),
    );
  }

  /**
   * Lists affinities a page at a time.
   */
  async listAffinityWorkflows(req: personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsRequest): Promise<personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListAffinityWorkflows", req);
    this.logger.info("list_affinity_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationAffinityWorkflowServiceApi.ListAffinityWorkflowsResponse.fromPartial({});
  }

  /**
   * Resumes an affinity.
   */
  async resumeAffinityWorkflow(req: personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowRequest): Promise<personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "ResumeAffinityWorkflow", req);
    this.logger.info("resume_affinity_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumApprovalServiceApi.SubmitForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            attributes: Object.fromEntries(Object.entries((req?.affinity?.attributes ?? {}))),
            manager: {
              displayName: (req?.affinity?.subject?.displayName ?? ""),
              email: (req?.details?.notify?.email ?? ""),
            },
          }],
          manager: { email: (req?.context?.actor?.email ?? "") },
        }],
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse> =
      (input, done) => this.communityForumApprovalClient.submitForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest.fromPartial({
      context: input2?.context,
      variant: {
        owner: { displayName: (input2?.affinity?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest, experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse> =
      (input, done) => this.experimentsVariantCalculationClient.explainVariantCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest, experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowResponse.fromPartial({
        outcome: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          occurredAt: req?.affinity?.occurredAt,
        },
      }),
    );
  }

  /**
   * Signals an affinity.
   */
  async signalAffinityWorkflow(req: personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowRequest): Promise<personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "SignalAffinityWorkflow", req);
    this.logger.info("signal_affinity_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleRequest.fromPartial({
      context: req?.context,
      recommendationId: (req?.affinity?.subject?.recommendationId ?? ""),
    });
    const cloned1: personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleRequest, personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleResponse> =
      (input, done) => this.personalizationRecommendationLifecycleClient.getRecommendationLifecycle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleRequest, personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleResponse>(invoke1, cloned1);
    const request2 = ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const decoded2 = ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest.fromJSON(
      JSON.parse(JSON.stringify(ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest.toJSON(request2))),
    );
    const invoke2: Unary<ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountQueryClient.summarizeLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsResponse>(invoke2, decoded2);
    const request3 = corporateeventsCorporateEventCalculationServiceApi.CalculateCorporateEventRequest.fromPartial({
      context: req?.context,
      corporateEvent: {
        participants: [{
          contact: { email: (reply1?.recommendation?.counterparty?.email ?? "") },
        }],
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.corporateevents.v1.CalculateCorporateEventRequest",
      value: Buffer.from(corporateeventsCorporateEventCalculationServiceApi.CalculateCorporateEventRequest.encode(request3).finish()),
    });
    const unpacked3 = corporateeventsCorporateEventCalculationServiceApi.CalculateCorporateEventRequest.decode(envelope3.value);
    const invoke3: Unary<corporateeventsCorporateEventCalculationServiceApi.CalculateCorporateEventRequest, corporateeventsCorporateEventCalculationServiceApi.CalculateCorporateEventResponse> =
      (input, done) => this.corporateeventsCorporateEventCalculationClient.calculateCorporateEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<corporateeventsCorporateEventCalculationServiceApi.CalculateCorporateEventRequest, corporateeventsCorporateEventCalculationServiceApi.CalculateCorporateEventResponse>(invoke3, unpacked3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      personalizationAffinityWorkflowServiceApi.SignalAffinityWorkflowResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          source: (req?.affinity?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Starts an affinity.
   */
  async startAffinityWorkflow(req: personalizationAffinityWorkflowServiceApi.StartAffinityWorkflowRequest): Promise<personalizationAffinityWorkflowServiceApi.StartAffinityWorkflowResponse> {
    validateContext(req.context);
    if (req.affinity) {
      await this.repository.save(toAffinityRecord(req.context.tenantId, req.affinity));
    }
    await this.repository.record(req.context.tenantId, "StartAffinityWorkflow", req);
    this.logger.info("start_affinity_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationSyncServiceApi.ReconcileRecommendationsRequest.fromPartial({
      context: req?.context,
      recommendation: {
        counterparty: { email: (req?.details?.notify?.email ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.affinity?.attributes ?? {}))),
        }],
        number: (req?.affinity?.subject?.number ?? ""),
        recommendationId: (req?.affinity?.subject?.recommendationId ?? ""),
      },
    });
    const client1 = this.clients.get<personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient>("acme.personalization.v1.RecommendationSyncService");
    const invoke1: Unary<personalizationRecommendationSyncServiceApi.ReconcileRecommendationsRequest, personalizationRecommendationSyncServiceApi.ReconcileRecommendationsResponse> =
      (input, done) => client1.reconcileRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationSyncServiceApi.ReconcileRecommendationsRequest, personalizationRecommendationSyncServiceApi.ReconcileRecommendationsResponse>(invoke1, request1);
    const request2 = personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusRequest.fromPartial({
      context: req?.context,
      recommendationId: (req?.affinity?.subject?.recommendationId ?? ""),
    });
    const invoke2: Unary<personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusRequest, personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusResponse> =
      (input, done) => this.personalizationRecommendationApprovalClient.getRecommendationApprovalStatus(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusRequest, personalizationRecommendationApprovalServiceApi.GetRecommendationApprovalStatusResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityWorkflowServiceApi.StartAffinityWorkflowResponse.fromPartial({
        affinity: {
          subject: { recommendationId: (reply1?.recommendation?.recommendationId ?? "") },
        },
      }),
      personalizationAffinityWorkflowServiceApi.StartAffinityWorkflowResponse.fromPartial({
        affinity: { subject: { number: (reply2?.recommendation?.number ?? "") } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      personalizationAffinityWorkflowServiceApi.StartAffinityWorkflowResponse.fromPartial({
        affinity: {
          affinityId: (req?.affinityId ?? ""),
          kind: (req?.affinity?.kind ?? ""),
        },
      }),
    );
  }
}
