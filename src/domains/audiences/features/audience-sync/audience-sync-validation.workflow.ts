/**
 * Checks audience syncs against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceMemberCalculationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import * as audiencesAudienceMemberValidationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceSyncValidationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as contentContentBlockCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as documentsDocumentServiceApi from "../../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as formsFormServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as routingRouteQueryServiceApi from "../../../../../.cache/proto/acme/routing/v1/route_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
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
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toAudienceSyncRecord } from "../../data/records.js";
import { AudiencesRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience sync operations and persist audit data.
 */
@injectable()
export class AudienceSyncValidationWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberCalculationService") private readonly audiencesAudienceMemberCalculationClient: audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberValidationService") private readonly audiencesAudienceMemberValidationClient: audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncCalculationService") private readonly audiencesAudienceSyncCalculationClient: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceValidationService") private readonly audiencesAudienceValidationClient: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockCalculationService") private readonly contentContentBlockCalculationClient: contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.forms.v1.FormService") private readonly formsFormClient: formsFormServiceApi.FormServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyQueryService") private readonly localizationTranslationKeyQueryClient: localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.routing.v1.RouteQueryService") private readonly routingRouteQueryClient: routingRouteQueryServiceApi.RouteQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Explains an audience sync.
   */
  async explainAudienceSyncDecision(req: audiencesAudienceSyncValidationServiceApi.ExplainAudienceSyncDecisionRequest): Promise<audiencesAudienceSyncValidationServiceApi.ExplainAudienceSyncDecisionResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "ExplainAudienceSyncDecision", req);
    this.logger.info("explain_audience_sync_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.SimulateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            manager: {
              displayName: (req?.audienceSync?.subject?.displayName ?? ""),
              email: (req?.audienceSync?.subject?.email ?? ""),
            },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockCalculationServiceApi.SimulateContentBlockRequest, contentContentBlockCalculationServiceApi.SimulateContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.simulateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncRequest.fromPartial({
      audienceSync: {
        subject: {
          audienceMemberId: (req?.audienceSync?.subject?.audienceMemberId ?? ""),
          displayName: (req?.audienceSync?.subject?.displayName ?? ""),
          email: (req?.audienceSync?.subject?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.quoteAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncValidationServiceApi.ExplainAudienceSyncDecisionResponse.fromPartial({
        audienceSync: { subject: { email: (reply1?.contentBlock?.manager?.email ?? "") } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      audiencesAudienceSyncValidationServiceApi.ExplainAudienceSyncDecisionResponse.fromPartial({
        audienceSync: { correlationId: (reply2?.audienceSync?.correlationId ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      audiencesAudienceSyncValidationServiceApi.ExplainAudienceSyncDecisionResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          source: (req?.audienceSync?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Returns an audience sync.
   */
  async getAudienceSyncRules(req: audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesRequest): Promise<audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesResponse> {
    validateContext(req.context);
    if (!req.audienceSyncId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_sync_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAudienceSyncRules", req);
    this.logger.info("get_audience_sync_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormServiceApi.CreateFormRequest.fromPartial({
      context: req?.context,
      form: { counterparty: { email: (req?.context?.actor?.email ?? "") } },
    });
    const method1 = "createForm" as const;
    const invoke1: Unary<formsFormServiceApi.CreateFormRequest, formsFormServiceApi.CreateFormResponse> =
      (input, done) => this.formsFormClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormServiceApi.CreateFormRequest, formsFormServiceApi.CreateFormResponse>(invoke1, request1);
    const request2 = audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberRequest.fromPartial({
      audienceMember: {
        audit: {
          createdAt: reply1?.form?.audit?.createdAt,
          updatedAt: reply1?.form?.audit?.updatedAt,
        },
        primaryAddress: { region: (reply1?.form?.billingAddress?.region ?? "") },
      },
      context: req?.context,
    });
    const proxy2 = forwarding(this.audiencesAudienceMemberCalculationClient);
    const invoke2: Unary<audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberResponse> =
      (input, done) => proxy2.calculateAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberResponse>(invoke2, request2);
    return mergeResponses(
      audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesResponse.fromPartial({
        audienceSync: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          subject: {
            displayName: (reply2?.audienceMember?.relationshipManager?.displayName ?? ""),
          },
        },
      }),
      audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesResponse.fromPartial({ audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") } }),
    );
  }

  /**
   * Lints an audience sync.
   */
  async lintAudienceSyncs(req: audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsRequest): Promise<audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "LintAudienceSyncs", req);
    this.logger.info("lint_audience_syncs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = routingRouteQueryServiceApi.SummarizeRoutesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.audienceSync?.attributes ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<routingRouteQueryServiceApi.SummarizeRoutesRequest, routingRouteQueryServiceApi.SummarizeRoutesResponse> =
      (input, done) => this.routingRouteQueryClient.summarizeRoutes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<routingRouteQueryServiceApi.SummarizeRoutesRequest, routingRouteQueryServiceApi.SummarizeRoutesResponse>(invoke1, request1);
    const request2 = notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.contact?.email ?? ""),
          name: req?.details?.contact?.name,
          phone: (req?.details?.contact?.phone ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse> =
      (input, done) => this.notificationsNotificationNotificationClient.unsubscribeNotificationUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.UnsubscribeNotificationUpdatesResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesRequest.fromPartial({
      audienceMemberId: (input3?.audienceSync?.subject?.audienceMemberId ?? ""),
      context: input3?.context,
    });
    const invoke3: Unary<audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesRequest, audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient.getAudienceMemberRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesRequest, audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesResponse>(invoke3, request3);
    const request4 = notificationsNotificationValidationServiceApi.NormalizeNotificationRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
      notification: {
        audit: { createdBy: (reply3?.audienceMember?.audit?.createdBy ?? "") },
      },
    });
    const cloned4: notificationsNotificationValidationServiceApi.NormalizeNotificationRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<notificationsNotificationValidationServiceApi.NormalizeNotificationRequest, notificationsNotificationValidationServiceApi.NormalizeNotificationResponse> =
      (input, done) => this.notificationsNotificationValidationClient.normalizeNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsNotificationValidationServiceApi.NormalizeNotificationRequest, notificationsNotificationValidationServiceApi.NormalizeNotificationResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.details?.locale ?? "") });
    return mergeResponses(
      audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsResponse.fromPartial({
        audienceSync: { subject: { email: (reply2?.notification?.requester?.email ?? "") } },
      }),
      audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsResponse.fromPartial({
        audienceSync: { attributes: (reply3?.audienceMember?.attributes ?? {}) },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsResponse.fromPartial({ outcome: { status: (reply4?.outcome?.status ?? "") } }),
      audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsResponse.fromPartial({
        audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") },
        result: { correlationId: (req?.audienceSync?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Normalizes an audience sync.
   */
  async normalizeAudienceSync(req: audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncRequest): Promise<audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "NormalizeAudienceSync", req);
    this.logger.info("normalize_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentServiceApi.CreateDocumentRequest.fromPartial({
      context: req?.context,
      document: {
        counterparty: { displayName: (req?.audienceSync?.subject?.displayName ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.audienceSync?.attributes ?? {}))),
        }],
      },
    });
    const decoded1 = documentsDocumentServiceApi.CreateDocumentRequest.fromJSON(
      JSON.parse(JSON.stringify(documentsDocumentServiceApi.CreateDocumentRequest.toJSON(request1))),
    );
    const invoke1: Unary<documentsDocumentServiceApi.CreateDocumentRequest, documentsDocumentServiceApi.CreateDocumentResponse> =
      (input, done) => this.documentsDocumentClient.createDocument(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<documentsDocumentServiceApi.CreateDocumentRequest, documentsDocumentServiceApi.CreateDocumentResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncResponse.fromPartial({
        audienceSync: { audienceSyncId: (req?.audienceSyncId ?? "") },
        result: { correlationId: (req?.audienceSync?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Previews an audience sync.
   */
  async previewAudienceSync(req: audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncRequest): Promise<audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "PreviewAudienceSync", req);
    this.logger.info("preview_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest.fromPartial({
      audienceMember: {
        contact: { phone: (req?.details?.contact?.phone ?? "") },
        relationshipManager: { email: (req?.audienceSync?.subject?.email ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.audiences.v1.NormalizeAudienceMemberRequest",
      value: Buffer.from(audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest.encode(request1).finish()),
    });
    const unpacked1 = audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest.decode(envelope1.value);
    const invoke1: Unary<audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient.normalizeAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncResponse.fromPartial({
        audienceSync: {
          subject: {
            audienceMemberId: (reply1?.audienceMember?.audienceMemberId ?? ""),
            displayName: (reply1?.audienceMember?.relationshipManager?.displayName ?? ""),
          },
        },
      }),
      audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          occurredAt: req?.audienceSync?.occurredAt,
        },
      }),
    );
  }

  /**
   * Scores an audience sync.
   */
  async scoreAudienceSync(req: audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncRequest): Promise<audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "ScoreAudienceSync", req);
    this.logger.info("score_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.audienceSync?.measurements ?? []).map(async (item) => {
      const request1 = notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest.fromPartial({
        context: req?.context,
        subscription: {
          audit: { createdAt: item?.observedAt },
          action: { $case: "block", block: { reason: (req?.reason ?? "") } },
          owner: {
            displayName: (req?.audienceSync?.subject?.displayName ?? ""),
            email: (req?.audienceSync?.subject?.email ?? ""),
          },
        },
      });
      const invoke1: Unary<notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse> =
        (input, done) => this.notificationsSubscriptionSyncClient.syncSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsSubscriptionSyncServiceApi.SyncSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? notificationsSubscriptionSyncServiceApi.SyncSubscriptionsResponse.fromPartial({});
    const request2 = audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest.fromPartial({
      audienceMember: {
        audit: { etag: (reply1?.subscription?.audit?.etag ?? "") },
        primaryAddress: { countryCode: (req?.details?.destination?.countryCode ?? "") },
        relationshipManager: { userId: (reply1?.subscription?.owner?.userId ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.audienceSync?.subject?.email ?? "") } },
    });
    const client2 = this.clients.get<audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceClient>("acme.audiences.v1.AudienceMemberCalculationService");
    const invoke2: Unary<audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest, audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse> =
      (input, done) => client2.explainAudienceMemberCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest, audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse>(invoke2, request2);
    const request3 = localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
    });
    const invoke3: Unary<localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyQueryClient.browseTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.details?.destination?.postalCode ?? "") });
    return mergeResponses(
      audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncResponse.fromPartial({
        audienceSync: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncResponse.fromPartial({
        audienceSync: {
          attributes: (req?.audienceSync?.attributes ?? {}),
          audienceSyncId: (req?.audienceSyncId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates an audience sync.
   */
  async validateAudienceSync(req: audiencesAudienceSyncValidationServiceApi.ValidateAudienceSyncRequest): Promise<audiencesAudienceSyncValidationServiceApi.ValidateAudienceSyncResponse> {
    validateContext(req.context);
    if (req.audienceSync) {
      await this.repository.save(toAudienceSyncRecord(req.context.tenantId, req.audienceSync));
    }
    await this.repository.record(req.context.tenantId, "ValidateAudienceSync", req);
    this.logger.info("validate_audience_sync", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceValidationServiceApi.NormalizeAudienceRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
    });
    const invoke1: Unary<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.normalizeAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse>(invoke1, request1));
    const request2 = audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest.fromPartial({
      audience: { owner: { email: (reply1?.audience?.owner?.email ?? "") } },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest, audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse> =
      (input, done) => this.audiencesAudienceValidationClient.explainAudienceDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ValidateAudienceSync.ExplainAudienceDecision", () => call<audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest, audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse>(invoke2, request2));
    const request3 = routingRouteQueryServiceApi.ExportRoutesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.audience?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.audienceSync?.attributes ?? {}))),
        ownerId: (req?.audienceSync?.subject?.audienceMemberId ?? ""),
      },
    });
    const stream3 = this.routingRouteQueryClient.exportRoutes(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? routingRouteQueryServiceApi.ExportRoutesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceSyncValidationServiceApi.ValidateAudienceSyncResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.outcome?.message ?? ""),
        },
      }),
      audiencesAudienceSyncValidationServiceApi.ValidateAudienceSyncResponse.fromPartial({
        audienceSync: {
          subject: { displayName: (reply2?.audience?.owner?.displayName ?? "") },
        },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      audiencesAudienceSyncValidationServiceApi.ValidateAudienceSyncResponse.fromPartial({
        audienceSync: {
          audienceSyncId: (req?.audienceSyncId ?? ""),
          sequence: (req?.audienceSync?.sequence ?? 0),
        },
      }),
    );
  }
}
