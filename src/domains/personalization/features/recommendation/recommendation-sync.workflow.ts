/**
 * Keeps recommendations in step with the systems of record in other regions. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventQueryServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_query_service.js";
import * as certificatesCertificateCalculationServiceApi from "../../../../../.cache/proto/acme/certificates/v1/certificate_calculation_service.js";
import * as communityBadgeApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityForumApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as notificationsNotificationAdminServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_admin_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationProfileServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { collect, write } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toRecommendationRecord } from "../../data/records.js";
import { PersonalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate recommendation operations and persist audit data.
 */
@injectable()
export class RecommendationSyncWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventQueryService") private readonly auditAuditEventQueryClient: auditAuditEventQueryServiceApi.AuditEventQueryServiceClient,
    @inject("grpc:acme.certificates.v1.CertificateCalculationService") private readonly certificatesCertificateCalculationClient: certificatesCertificateCalculationServiceApi.CertificateCalculationServiceClient,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationAdminService") private readonly notificationsNotificationAdminClient: notificationsNotificationAdminServiceApi.NotificationAdminServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileService") private readonly personalizationProfileClient: personalizationProfileServiceApi.ProfileServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a recommendation.
   */
  async getRecommendationSyncState(req: personalizationRecommendationSyncServiceApi.GetRecommendationSyncStateRequest): Promise<personalizationRecommendationSyncServiceApi.GetRecommendationSyncStateResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetRecommendationSyncState", req);
    this.logger.info("get_recommendation_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileQueryServiceApi.SuggestProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.context?.tenantId ?? ""),
      },
    });
    const invoke1: Unary<personalizationProfileQueryServiceApi.SuggestProfilesRequest, personalizationProfileQueryServiceApi.SuggestProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.suggestProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<personalizationProfileQueryServiceApi.SuggestProfilesResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return mergeResponses(
      personalizationRecommendationSyncServiceApi.GetRecommendationSyncStateResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      personalizationRecommendationSyncServiceApi.GetRecommendationSyncStateResponse.fromPartial({ recommendation: { recommendationId: (req?.recommendationId ?? "") } }),
    );
  }

  /**
   * Lists recommendations a page at a time.
   */
  async listRecommendationConflicts(req: personalizationRecommendationSyncServiceApi.ListRecommendationConflictsRequest): Promise<personalizationRecommendationSyncServiceApi.ListRecommendationConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListRecommendationConflicts", req);
    this.logger.info("list_recommendation_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = certificatesCertificateCalculationServiceApi.CalculateCertificateRequest.fromPartial({
      certificate: {
        audit: { updatedAt: req?.filter?.createdAfter },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        }],
      },
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<certificatesCertificateCalculationServiceApi.CalculateCertificateRequest, certificatesCertificateCalculationServiceApi.CalculateCertificateResponse> =
      (input, done) => this.certificatesCertificateCalculationClient.calculateCertificate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_1: string | undefined;
    switch (reply1?.certificate?.settlement?.$case) {
      case "bank":
        selected2_1 = ((reply1?.certificate?.settlement?.$case === "bank" ? reply1?.certificate?.settlement.bank : undefined)?.iban ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_3: string | undefined;
    switch (reply1?.certificate?.settlement?.$case) {
      case "bank":
        selected2_3 = ((reply1?.certificate?.settlement?.$case === "bank" ? reply1?.certificate?.settlement.bank : undefined)?.bic ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { postalCode: (reply1?.certificate?.billingAddress?.postalCode ?? "") },
      },
      recommendation: {
        settlement: { $case: "bank", bank: {
          bic: (selected2_3 ?? ""),
          iban: (selected2_1 ?? ""),
        } },
        billingAddress: { locality: (reply1?.certificate?.billingAddress?.locality ?? "") },
      },
    });
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.calculateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      personalizationRecommendationSyncServiceApi.ListRecommendationConflictsResponse.fromPartial({
        recommendations: [{
          metadata: (reply1?.certificate?.metadata ?? {}),
          total: reply1?.breakdown?.total,
        }],
      }),
      personalizationRecommendationSyncServiceApi.ListRecommendationConflictsResponse.fromPartial({
        recommendations: [{ audit: { createdAt: reply2?.recommendation?.audit?.createdAt } }],
      }),
    );
  }

  /**
   * Pulls a recommendation.
   */
  async pullRecommendations(req: personalizationRecommendationSyncServiceApi.PullRecommendationsRequest): Promise<personalizationRecommendationSyncServiceApi.PullRecommendationsResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "PullRecommendations", req);
    this.logger.info("pull_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.QuoteExperimentRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (req?.recommendation?.billingAddress?.countryCode ?? "") },
      },
      experiment: {
        audit: { createdBy: (req?.recommendation?.audit?.createdBy ?? "") },
        participants: [{ contact: { email: (req?.recommendation?.counterparty?.email ?? "") } }],
      },
    });
    const method1 = "quoteExperiment" as const;
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.QuoteExperimentRequest, experimentsExperimentCalculationServiceApi.QuoteExperimentResponse> =
      (input, done) => this.experimentsExperimentCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentCalculationServiceApi.QuoteExperimentRequest, experimentsExperimentCalculationServiceApi.QuoteExperimentResponse>(invoke1, request1);
    const request2 = notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      subscription: { audit: { updatedBy: (reply1?.experiment?.audit?.updatedBy ?? "") } },
    });
    const proxy2 = forwarding(this.notificationsSubscriptionWorkflowClient);
    const invoke2: Unary<notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowResponse> =
      (input, done) => proxy2.signalSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationSyncServiceApi.PullRecommendationsResponse.fromPartial({
        recommendation: {
          billingAddress: { locality: (reply1?.experiment?.location?.locality ?? "") },
        },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      personalizationRecommendationSyncServiceApi.PullRecommendationsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      personalizationRecommendationSyncServiceApi.PullRecommendationsResponse.fromPartial({
        recommendation: {
          counterparty: req?.recommendation?.counterparty,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Pushs a recommendation.
   */
  async pushRecommendation(req: personalizationRecommendationSyncServiceApi.PushRecommendationRequest): Promise<personalizationRecommendationSyncServiceApi.PushRecommendationResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "PushRecommendation", req);
    this.logger.info("push_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.recommendation?.settlement?.$case) {
      case "card":
        selected1_2 = ((req?.recommendation?.settlement?.$case === "card" ? req?.recommendation?.settlement.card : undefined)?.holderName ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = personalizationRecommendationValidationServiceApi.PreviewRecommendationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.recommendation?.counterparty?.email ?? "") } },
      recommendation: {
        audit: { updatedAt: req?.recommendation?.audit?.updatedAt },
        billingAddress: { postalCode: (req?.recommendation?.billingAddress?.postalCode ?? "") },
        settlement: { $case: "card", card: { holderName: (selected1_2 ?? "") } },
      },
    });
    const invoke1: Unary<personalizationRecommendationValidationServiceApi.PreviewRecommendationRequest, personalizationRecommendationValidationServiceApi.PreviewRecommendationResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.previewRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationValidationServiceApi.PreviewRecommendationRequest, personalizationRecommendationValidationServiceApi.PreviewRecommendationResponse>(invoke1, request1);
    const request2 = auditAuditEventQueryServiceApi.BrowseAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.recommendation?.audit?.updatedAt,
        region: (reply1?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<auditAuditEventQueryServiceApi.BrowseAuditEventsRequest, auditAuditEventQueryServiceApi.BrowseAuditEventsResponse> =
      (input, done) => this.auditAuditEventQueryClient.browseAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<auditAuditEventQueryServiceApi.BrowseAuditEventsRequest, auditAuditEventQueryServiceApi.BrowseAuditEventsResponse>(invoke2, spread2);
    const request3 = notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "discount", discount: { amount: req?.recommendation?.total } },
        parameters: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        scopes: (req?.context?.actor?.roles ?? []).map((value) => value),
      } },
      context: req?.context,
    });
    const stream3 = this.notificationsSubscriptionSyncClient.streamSubscriptionChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationSyncServiceApi.PushRecommendationResponse.fromPartial({ recommendation: { number: (reply1?.recommendation?.number ?? "") } }),
      personalizationRecommendationSyncServiceApi.PushRecommendationResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      personalizationRecommendationSyncServiceApi.PushRecommendationResponse.fromPartial({
        recommendation: {
          counterparty: req?.recommendation?.counterparty,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Reconciles a recommendation.
   */
  async reconcileRecommendations(req: personalizationRecommendationSyncServiceApi.ReconcileRecommendationsRequest): Promise<personalizationRecommendationSyncServiceApi.ReconcileRecommendationsResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "ReconcileRecommendations", req);
    this.logger.info("reconcile_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = personalizationProfileServiceApi.ListProfilesRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.recommendation?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((input1?.recommendation?.metadata ?? {}))),
        ownerId: (input1?.recommendation?.counterparty?.profileId ?? ""),
        region: (input1?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<personalizationProfileServiceApi.ListProfilesRequest, personalizationProfileServiceApi.ListProfilesResponse> =
      (input, done) => this.personalizationProfileClient.listProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileServiceApi.ListProfilesRequest, personalizationProfileServiceApi.ListProfilesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationSyncServiceApi.ReconcileRecommendationsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      personalizationRecommendationSyncServiceApi.ReconcileRecommendationsResponse.fromPartial({
        recommendation: {
          issuedAt: req?.recommendation?.issuedAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Resolves a recommendation.
   */
  async resolveRecommendationConflict(req: personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictRequest): Promise<personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "ResolveRecommendationConflict", req);
    this.logger.info("resolve_recommendation_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse>> = [];
    for (const item of (req?.recommendation?.attachments ?? [])) {
      tasks1.push(async () => {
        const request1 = personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest.fromPartial({
          context: req?.context,
          recommendation: {
            attachments: [{
              checksum: (item?.checksum ?? ""),
              contentType: (item?.contentType ?? ""),
              sizeBytes: (item?.sizeBytes ?? 0),
              uri: (item?.uri ?? ""),
            }],
          },
        });
        const invoke1: Unary<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse> =
          (input, done) => this.personalizationRecommendationCalculationClient.simulateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse.fromPartial({});
    const request2 = communityBadgeApprovalServiceApi.RejectBadgeRequest.fromPartial({
      badge: {
        audit: { updatedAt: req?.recommendation?.audit?.updatedAt },
        owner: {
          displayName: (reply1?.recommendation?.counterparty?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const cloned2: communityBadgeApprovalServiceApi.RejectBadgeRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse> =
      (input, done) => this.communityBadgeApprovalClient.rejectBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictResponse.fromPartial({
        recommendation: {
          counterparty: { displayName: (reply2?.badge?.owner?.displayName ?? "") },
        },
      }),
      personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictResponse.fromPartial({
        recommendation: {
          dueAt: req?.recommendation?.dueAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Exchanges changes of recommendations with a peer.
   */
  async streamRecommendationChanges(req: personalizationRecommendationSyncServiceApi.StreamRecommendationChangesRequest): Promise<personalizationRecommendationSyncServiceApi.StreamRecommendationChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamRecommendationChanges", req);
    this.logger.info("stream_recommendation_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityImportServiceApi.RetryAffinityImportRequest.fromPartial({
      affinity: {
        subject: {
          displayName: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.counterparty?.displayName ?? ""),
          number: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.number ?? ""),
          recommendationId: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.recommendationId ?? ""),
        },
      },
      context: req?.context,
    });
    const decoded1 = personalizationAffinityImportServiceApi.RetryAffinityImportRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationAffinityImportServiceApi.RetryAffinityImportRequest.toJSON(request1))),
    );
    const invoke1: Unary<personalizationAffinityImportServiceApi.RetryAffinityImportRequest, personalizationAffinityImportServiceApi.RetryAffinityImportResponse> =
      (input, done) => this.personalizationAffinityImportClient.retryAffinityImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityImportServiceApi.RetryAffinityImportRequest, personalizationAffinityImportServiceApi.RetryAffinityImportResponse>(invoke1, decoded1);
    const request2 = communityForumApprovalServiceApi.SubmitForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          audit: {
            createdAt: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.audit?.createdAt,
          },
          children: [{
            location: {
              locality: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.billingAddress?.locality ?? ""),
            },
          }],
          manager: {
            displayName: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.counterparty?.displayName ?? ""),
          },
        }],
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.SubmitForumRequest",
      value: Buffer.from(communityForumApprovalServiceApi.SubmitForumRequest.encode(request2).finish()),
    });
    const unpacked2 = communityForumApprovalServiceApi.SubmitForumRequest.decode(envelope2.value);
    const invoke2: Unary<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse> =
      (input, done) => this.communityForumApprovalClient.submitForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse>(invoke2, unpacked2);
    let selected3_1: string | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected3_1 = ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.billingAddress?.region ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = personalizationProfileServiceApi.SearchProfilesRequest.fromPartial({
      context: req?.context,
      filter: { region: (selected3_1 ?? "") },
    });
    const invoke3: Unary<personalizationProfileServiceApi.SearchProfilesRequest, personalizationProfileServiceApi.SearchProfilesResponse> =
      (input, done) => this.personalizationProfileClient.searchProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationProfileServiceApi.SearchProfilesRequest, personalizationProfileServiceApi.SearchProfilesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      personalizationRecommendationSyncServiceApi.StreamRecommendationChangesResponse.fromPartial({
        result: { status: (reply1?.result?.status ?? "") },
        sequence: (reply1?.affinity?.sequence ?? 0),
      }),
      personalizationRecommendationSyncServiceApi.StreamRecommendationChangesResponse.fromPartial({
        recommendation: { audit: { createdAt: reply2?.forum?.audit?.createdAt } },
      }),
      personalizationRecommendationSyncServiceApi.StreamRecommendationChangesResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          details: (reply3?.result?.details ?? {}),
        },
      }),
      personalizationRecommendationSyncServiceApi.StreamRecommendationChangesResponse.fromPartial({
        recommendation: {
          billingAddress: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.billingAddress,
          recommendationId: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Syncs a recommendation.
   */
  async syncRecommendations(req: personalizationRecommendationSyncServiceApi.SyncRecommendationsRequest): Promise<personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse> {
    validateContext(req.context);
    if (req.recommendation) {
      await this.repository.save(toRecommendationRecord(req.context.tenantId, req.recommendation));
    }
    await this.repository.record(req.context.tenantId, "SyncRecommendations", req);
    this.logger.info("sync_recommendations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileQueryServiceApi.ExportProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.recommendation?.audit?.createdAt,
        ownerId: (req?.recommendation?.counterparty?.profileId ?? ""),
        region: (req?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const stream1 = this.personalizationProfileQueryClient.exportProfiles(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? personalizationProfileQueryServiceApi.ExportProfilesResponse.fromPartial({});
    const request2 = personalizationProfileCalculationServiceApi.SimulateProfileRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (req?.recommendation?.billingAddress?.locality ?? ""),
          region: (req?.recommendation?.billingAddress?.region ?? ""),
        },
      },
      profile: {
        primaryAddress: {
          lines: (req?.recommendation?.billingAddress?.lines ?? []).map((value) => value),
        },
        relationshipManager: { email: (req?.recommendation?.counterparty?.email ?? "") },
      },
    });
    const invoke2: Unary<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.simulateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = notificationsNotificationAdminServiceApi.RepairNotificationRequest.fromPartial({
      context: req?.context,
      notification: { audit: { createdBy: (req?.recommendation?.audit?.createdBy ?? "") } },
    });
    const invoke3: Unary<notificationsNotificationAdminServiceApi.RepairNotificationRequest, notificationsNotificationAdminServiceApi.RepairNotificationResponse> =
      (input, done) => this.notificationsNotificationAdminClient.repairNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<notificationsNotificationAdminServiceApi.RepairNotificationRequest, notificationsNotificationAdminServiceApi.RepairNotificationResponse>(invoke3, request3));
    const request4 = notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: {
          displayName: (reply2?.profile?.relationshipManager?.displayName ?? ""),
          userId: (reply3?.notification?.assignee?.userId ?? ""),
        },
        comments: [{ createdAt: req?.recommendation?.audit?.createdAt }],
      },
    });
    const invoke4: Unary<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.annotateNotificationVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("SyncRecommendations.AnnotateNotificationVersion", () => call<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse.fromPartial({
        recommendation: {
          number: ((reply2?.profile?.identityDocument?.$case === "passport" ? reply2?.profile?.identityDocument.passport : undefined)?.number ?? ""),
        },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.outcome?.status ?? ""),
        },
      }),
      personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse.fromPartial({
        outcome: { message: (reply4?.result?.message ?? "") },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse.fromPartial({
        recommendation: {
          dueAt: req?.recommendation?.dueAt,
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }
}
