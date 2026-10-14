/**
 * Runs the long-lived workflow that takes a badge from start to finish. Remote work stays behind typed client ports.
 */

import * as auditAuditEventServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as auditAuditEventValidationServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as authorizationAccessPolicyQueryServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as commonMoneyApi from "../../../../../.cache/proto/acme/common/v1/money.js";
import * as communityBadgeApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityBadgeWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as communityPostWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as configurationConfigSetServiceApi from "../../../../../.cache/proto/acme/configuration/v1/config_set_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as documentsDocumentValidationServiceApi from "../../../../../.cache/proto/acme/documents/v1/document_validation_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
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
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toBadgeRecord } from "../../data/records.js";
import { CommunityRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate badge operations and persist audit data.
 */
@injectable()
export class BadgeWorkflowWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostWorkflowService") private readonly communityPostWorkflowClient: communityPostWorkflowServiceApi.PostWorkflowServiceClient,
    @inject("grpc:acme.configuration.v1.ConfigSetService") private readonly configurationConfigSetClient: configurationConfigSetServiceApi.ConfigSetServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentValidationService") private readonly documentsDocumentValidationClient: documentsDocumentValidationServiceApi.DocumentValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretValidationService") private readonly webhooksWebhookSecretValidationClient: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a badge.
   */
  async advanceBadgeWorkflow(req: communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowRequest): Promise<communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "AdvanceBadgeWorkflow", req);
    this.logger.info("advance_badge_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: commonMoneyApi.Money | undefined;
    switch (req?.badge?.action?.$case) {
      case "discount":
        selected1_2 = (req?.badge?.action?.$case === "discount" ? req?.badge?.action.discount : undefined)?.amount;
        break;
      default:
        selected1_2 = undefined;
    }
    const request1 = documentsDocumentValidationServiceApi.LintDocumentsRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.notify?.phone ?? "") } },
      document: {
        audit: { createdAt: req?.badge?.audit?.createdAt },
        lines: [{ tax: { amount: selected1_2 } }],
      },
    });
    const invoke1: Unary<documentsDocumentValidationServiceApi.LintDocumentsRequest, documentsDocumentValidationServiceApi.LintDocumentsResponse> =
      (input, done) => this.documentsDocumentValidationClient.lintDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<documentsDocumentValidationServiceApi.LintDocumentsRequest, documentsDocumentValidationServiceApi.LintDocumentsResponse>(invoke1, request1);
    const request2 = communityPostWorkflowServiceApi.CancelPostWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.details?.notify?.email ?? "") } },
      post: {
        settlement: { $case: "card", card: {
          last4: ((reply1?.document?.settlement?.$case === "card" ? reply1?.document?.settlement.card : undefined)?.last4 ?? ""),
        } },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityPostWorkflowServiceApi.CancelPostWorkflowRequest, communityPostWorkflowServiceApi.CancelPostWorkflowResponse> =
      (input, done) => this.communityPostWorkflowClient.cancelPostWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostWorkflowServiceApi.CancelPostWorkflowRequest, communityPostWorkflowServiceApi.CancelPostWorkflowResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse.fromPartial({
        outcome: {
          referenceId: (reply1?.outcome?.referenceId ?? ""),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse.fromPartial({
        badge: { audit: { createdBy: (reply2?.post?.audit?.createdBy ?? "") } },
      }),
      communityBadgeWorkflowServiceApi.AdvanceBadgeWorkflowResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          description: (req?.badge?.description ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a badge.
   */
  async cancelBadgeWorkflow(req: communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest): Promise<communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "CancelBadgeWorkflow", req);
    this.logger.info("cancel_badge_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = auditAuditEventValidationServiceApi.LintAuditEventsRequest.fromPartial({
      context: input1?.context,
      details: {
        contact: {
          name: input1?.details?.notify?.name,
          phone: (input1?.details?.notify?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<auditAuditEventValidationServiceApi.LintAuditEventsRequest, auditAuditEventValidationServiceApi.LintAuditEventsResponse> =
      (input, done) => this.auditAuditEventValidationClient.lintAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventValidationServiceApi.LintAuditEventsRequest, auditAuditEventValidationServiceApi.LintAuditEventsResponse>(invoke1, request1);
    const request2 = configurationConfigSetServiceApi.WatchConfigSetsRequest.fromPartial({
      context: req?.context,
      subscriber: { email: (req?.details?.notify?.email ?? "") },
    });
    const stream2 = this.configurationConfigSetClient.watchConfigSets(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? configurationConfigSetServiceApi.WatchConfigSetsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse.fromPartial({
        outcome: {
          nextSteps: (reply1?.outcome?.nextSteps ?? []),
          referenceId: (reply1?.outcome?.referenceId ?? ""),
        },
      }),
      communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          status: req?.badge?.status,
        },
      }),
    );
  }

  /**
   * Returns a badge.
   */
  async inspectBadgeWorkflow(req: communityBadgeWorkflowServiceApi.InspectBadgeWorkflowRequest): Promise<communityBadgeWorkflowServiceApi.InspectBadgeWorkflowResponse> {
    validateContext(req.context);
    if (!req.badgeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "badge_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectBadgeWorkflow", req);
    this.logger.info("inspect_badge_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventServiceApi.BatchGetAuditEventsRequest.fromPartial({ context: req?.context });
    const cloned1: auditAuditEventServiceApi.BatchGetAuditEventsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<auditAuditEventServiceApi.BatchGetAuditEventsRequest, auditAuditEventServiceApi.BatchGetAuditEventsResponse> =
      (input, done) => this.auditAuditEventClient.batchGetAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventServiceApi.BatchGetAuditEventsRequest, auditAuditEventServiceApi.BatchGetAuditEventsResponse>(invoke1, cloned1);
    return mergeResponses(
      communityBadgeWorkflowServiceApi.InspectBadgeWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      communityBadgeWorkflowServiceApi.InspectBadgeWorkflowResponse.fromPartial({ badge: { badgeId: (req?.badgeId ?? "") } }),
    );
  }

  /**
   * Lists badges a page at a time.
   */
  async listBadgeWorkflows(req: communityBadgeWorkflowServiceApi.ListBadgeWorkflowsRequest): Promise<communityBadgeWorkflowServiceApi.ListBadgeWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListBadgeWorkflows", req);
    this.logger.info("list_badge_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityBadgeWorkflowServiceApi.ListBadgeWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a badge.
   */
  async pauseBadgeWorkflow(req: communityBadgeWorkflowServiceApi.PauseBadgeWorkflowRequest): Promise<communityBadgeWorkflowServiceApi.PauseBadgeWorkflowResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "PauseBadgeWorkflow", req);
    this.logger.info("pause_badge_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeApprovalServiceApi.EscalateBadgeRequest.fromPartial({
      badge: {
        audit: {
          createdAt: req?.badge?.audit?.createdAt,
          etag: (req?.badge?.audit?.etag ?? ""),
          updatedBy: (req?.badge?.audit?.updatedBy ?? ""),
        },
        owner: { email: (req?.details?.notify?.email ?? "") },
      },
      context: req?.context,
    });
    const decoded1 = communityBadgeApprovalServiceApi.EscalateBadgeRequest.fromJSON(
      JSON.parse(JSON.stringify(communityBadgeApprovalServiceApi.EscalateBadgeRequest.toJSON(request1))),
    );
    const invoke1: Unary<communityBadgeApprovalServiceApi.EscalateBadgeRequest, communityBadgeApprovalServiceApi.EscalateBadgeResponse> =
      (input, done) => this.communityBadgeApprovalClient.escalateBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeApprovalServiceApi.EscalateBadgeRequest, communityBadgeApprovalServiceApi.EscalateBadgeResponse>(invoke1, decoded1);
    const request2 = personalizationAffinityValidationServiceApi.NormalizeAffinityRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.notify?.phone ?? "") } },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.NormalizeAffinityRequest",
      value: Buffer.from(personalizationAffinityValidationServiceApi.NormalizeAffinityRequest.encode(request2).finish()),
    });
    const unpacked2 = personalizationAffinityValidationServiceApi.NormalizeAffinityRequest.decode(envelope2.value);
    const invoke2: Unary<personalizationAffinityValidationServiceApi.NormalizeAffinityRequest, personalizationAffinityValidationServiceApi.NormalizeAffinityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.normalizeAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityValidationServiceApi.NormalizeAffinityRequest, personalizationAffinityValidationServiceApi.NormalizeAffinityResponse>(invoke2, unpacked2);
    const request3 = customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest.fromPartial({
      consentRecord: {
        attributes: Object.fromEntries(Object.entries((reply2?.affinity?.attributes ?? {}))),
        correlationId: (reply1?.result?.correlationId ?? ""),
        kind: (reply2?.affinity?.kind ?? ""),
        subject: { displayName: (req?.badge?.owner?.displayName ?? "") },
      },
      context: req?.context,
    });
    const client3 = this.clients.get<customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient>("acme.customers.v1.ConsentRecordCalculationService");
    const invoke3: Unary<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse> =
      (input, done) => client3.recalculateConsentRecords(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeWorkflowServiceApi.PauseBadgeWorkflowResponse.fromPartial({
        badge: { effective: reply1?.badge?.effective },
        outcome: { message: (reply1?.result?.message ?? "") },
      }),
      communityBadgeWorkflowServiceApi.PauseBadgeWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      communityBadgeWorkflowServiceApi.PauseBadgeWorkflowResponse.fromPartial({
        badge: {
          owner: { displayName: (reply3?.consentRecord?.subject?.displayName ?? "") },
        },
        result: { correlationId: (reply3?.consentRecord?.correlationId ?? "") },
      }),
      communityBadgeWorkflowServiceApi.PauseBadgeWorkflowResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          parameters: (req?.details?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Retrys a badge.
   */
  async retryBadgeWorkflow(req: communityBadgeWorkflowServiceApi.RetryBadgeWorkflowRequest): Promise<communityBadgeWorkflowServiceApi.RetryBadgeWorkflowResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "RetryBadgeWorkflow", req);
    this.logger.info("retry_badge_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.badge?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.badge?.parameters ?? {}))),
        ownerId: (req?.badge?.owner?.userId ?? ""),
      },
    });
    const invoke1: Unary<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.findAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeWorkflowServiceApi.RetryBadgeWorkflowResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      communityBadgeWorkflowServiceApi.RetryBadgeWorkflowResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          parameters: (req?.details?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Signals a badge.
   */
  async signalBadgeWorkflow(req: communityBadgeWorkflowServiceApi.SignalBadgeWorkflowRequest): Promise<communityBadgeWorkflowServiceApi.SignalBadgeWorkflowResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "SignalBadgeWorkflow", req);
    this.logger.info("signal_badge_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient.previewWebhookSecret(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.PreviewWebhookSecretResponse>(invoke1, request1));
    const request2 = authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.webhookSecret?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.webhookSecret?.labels ?? {}))),
        ownerId: (req?.badge?.owner?.userId ?? ""),
      },
    });
    const invoke2: Unary<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.findAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("SignalBadgeWorkflow.FindAccessPolicies", () => call<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse>(invoke2, request2));
    const request3 = personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          name: reply1?.webhookSecret?.contact?.name,
        },
      },
      profile: {
        audit: { createdAt: reply1?.webhookSecret?.audit?.createdAt },
        name: req?.details?.notify?.name,
      },
    });
    const invoke3: Unary<personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest, personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse> =
      (input, done) => this.personalizationProfileValidationClient.explainProfileDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: reply1?.webhookSecret?.contact?.name } },
      webhookSecret: { audit: { createdAt: reply1?.webhookSecret?.audit?.createdAt } },
    });
    const reply4 = await this.workQueue.enqueue<webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretResponse>(
      "acme.community.v1.BadgeWorkflowService/SignalBadgeWorkflow:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeWorkflowServiceApi.SignalBadgeWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      communityBadgeWorkflowServiceApi.SignalBadgeWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      communityBadgeWorkflowServiceApi.SignalBadgeWorkflowResponse.fromPartial({
        badge: {
          audit: { etag: (reply3?.profile?.audit?.etag ?? "") },
          owner: { email: (reply3?.profile?.relationshipManager?.email ?? "") },
        },
      }),
      communityBadgeWorkflowServiceApi.SignalBadgeWorkflowResponse.fromPartial({
        badge: { audit: { updatedBy: (reply4?.webhookSecret?.audit?.updatedBy ?? "") } },
        outcome: { message: (reply4?.result?.message ?? "") },
      }),
      communityBadgeWorkflowServiceApi.SignalBadgeWorkflowResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          status: req?.badge?.status,
        },
      }),
    );
  }

  /**
   * Starts a badge.
   */
  async startBadgeWorkflow(req: communityBadgeWorkflowServiceApi.StartBadgeWorkflowRequest): Promise<communityBadgeWorkflowServiceApi.StartBadgeWorkflowResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "StartBadgeWorkflow", req);
    this.logger.info("start_badge_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.badge?.action?.$case) {
      case "block":
        selected1_2 = ((req?.badge?.action?.$case === "block" ? req?.badge?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      consentRecord: {
        measurements: [{ observedAt: req?.badge?.audit?.updatedAt }],
        subject: { displayName: (req?.badge?.owner?.displayName ?? "") },
      },
      context: req?.context,
      reason: (selected1_2 ?? ""),
    });
    const invoke1: Unary<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.compareConsentRecordOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse>(invoke1, request1);
    const request2 = messagingConversationCalculationServiceApi.EstimateConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { email: (req?.details?.notify?.email ?? "") },
        audit: { updatedBy: (req?.badge?.audit?.updatedBy ?? "") },
        origin: { $case: "customer", customer: { displayName: (req?.badge?.owner?.displayName ?? "") } },
      },
    });
    const invoke2: Unary<messagingConversationCalculationServiceApi.EstimateConversationRequest, messagingConversationCalculationServiceApi.EstimateConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient.estimateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<messagingConversationCalculationServiceApi.EstimateConversationResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = communityBadgeApprovalServiceApi.ApproveBadgeRequest.fromPartial({
      badge: {
        owner: {
          displayName: ((reply2?.conversation?.origin?.$case === "customer" ? reply2?.conversation?.origin.customer : undefined)?.displayName ?? ""),
          email: (req?.badge?.owner?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke3: Unary<communityBadgeApprovalServiceApi.ApproveBadgeRequest, communityBadgeApprovalServiceApi.ApproveBadgeResponse> =
      (input, done) => this.communityBadgeApprovalClient.approveBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeWorkflowServiceApi.StartBadgeWorkflowResponse.fromPartial({
        result: { correlationId: (reply1?.consentRecord?.correlationId ?? "") },
      }),
      communityBadgeWorkflowServiceApi.StartBadgeWorkflowResponse.fromPartial({
        badge: {
          audit: { updatedBy: (reply2?.conversation?.audit?.updatedBy ?? "") },
          priority: (reply2?.conversation?.priority ?? 0),
        },
      }),
      communityBadgeWorkflowServiceApi.StartBadgeWorkflowResponse.fromPartial({
        badge: { description: (reply3?.badge?.description ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      communityBadgeWorkflowServiceApi.StartBadgeWorkflowResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          parameters: (req?.badge?.parameters ?? {}),
        },
      }),
    );
  }
}
