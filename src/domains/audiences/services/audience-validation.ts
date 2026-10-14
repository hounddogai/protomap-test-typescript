/**
 * Checks audiences against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceMemberCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as certificatesCertificateCalculationServiceApi from "../../../../.cache/proto/acme/certificates/v1/certificate_calculation_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetQueryServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_query_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsNotificationExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as webhooksWebhookEndpointServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_service.js";
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
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toAudienceRecord } from "../data/records.js";
import { AudiencesRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience operations and persist audit data.
 */
@injectable()
export class AudienceValidationWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberCalculationService") private readonly audiencesAudienceMemberCalculationClient: audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceClient,
    @inject("grpc:acme.certificates.v1.CertificateCalculationService") private readonly certificatesCertificateCalculationClient: certificatesCertificateCalculationServiceApi.CertificateCalculationServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetQueryService") private readonly mediaMediaAssetQueryClient: mediaMediaAssetQueryServiceApi.MediaAssetQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationExportService") private readonly notificationsNotificationExportClient: notificationsNotificationExportServiceApi.NotificationExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointService") private readonly webhooksWebhookEndpointClient: webhooksWebhookEndpointServiceApi.WebhookEndpointServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks an audience.
   */
  async checkAudienceEligibility(req: audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest): Promise<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "CheckAudienceEligibility", req);
    this.logger.info("check_audience_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsRequest.fromPartial({
      audienceMember: {
        audit: {
          createdAt: req?.audience?.audit?.createdAt,
          updatedBy: (req?.audience?.audit?.updatedBy ?? ""),
        },
        contact: { email: (req?.details?.contact?.email ?? "") },
      },
      context: req?.context,
    });
    const client1 = this.clients.get<audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceClient>("acme.audiences.v1.AudienceMemberCalculationService");
    const invoke1: Unary<audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsRequest, audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsResponse> =
      (input, done) => client1.compareAudienceMemberOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsRequest, audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsResponse>(invoke1, request1);
    const request2 = mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: ((req?.audience?.action?.$case === "block" ? req?.audience?.action.block : undefined)?.reason ?? ""),
    });
    const invoke2: Unary<mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsRequest, mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetQueryClient.summarizeMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsRequest, mediaMediaAssetQueryServiceApi.SummarizeMediaAssetsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = webhooksWebhookEndpointServiceApi.ListWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audience?.audit?.updatedAt,
        ownerId: (req?.audience?.owner?.userId ?? ""),
        region: (reply1?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const invoke3: Unary<webhooksWebhookEndpointServiceApi.ListWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.ListWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointClient.listWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<webhooksWebhookEndpointServiceApi.ListWebhookEndpointsRequest, webhooksWebhookEndpointServiceApi.ListWebhookEndpointsResponse>(invoke3, request3));
    const request4 = audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest.fromPartial({
      audienceMember: {
        audit: { updatedBy: (reply1?.audienceMember?.audit?.updatedBy ?? "") },
        contact: { name: reply1?.audienceMember?.contact?.name },
        relationshipManager: {
          displayName: (reply1?.audienceMember?.relationshipManager?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: {
        destination: {
          postalCode: (reply1?.audienceMember?.primaryAddress?.postalCode ?? ""),
        },
      },
    });
    const invoke4: Unary<audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient.estimateAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("CheckAudienceEligibility.EstimateAudienceMember", () => call<audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse.fromPartial({
        audience: {
          audit: { createdAt: reply1?.audienceMember?.audit?.createdAt },
          owner: { userId: (reply1?.audienceMember?.relationshipManager?.userId ?? "") },
        },
      }),
      audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse.fromPartial({
        audience: {
          owner: { userId: (reply4?.audienceMember?.relationshipManager?.userId ?? "") },
        },
      }),
      audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          description: (req?.audience?.description ?? ""),
        },
      }),
    );
  }

  /**
   * Explains an audience.
   */
  async explainAudienceDecision(req: audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest): Promise<audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "ExplainAudienceDecision", req);
    this.logger.info("explain_audience_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationExportServiceApi.StreamNotificationExportRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audience?.audit?.createdAt,
        ownerId: (req?.audience?.owner?.userId ?? ""),
      },
    });
    const stream1 = this.notificationsNotificationExportClient.streamNotificationExport(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationExportServiceApi.StreamNotificationExportResponse.fromPartial({});
    const request2 = mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        audit: {
          createdAt: req?.audience?.audit?.createdAt,
          updatedAt: req?.audience?.audit?.updatedAt,
          updatedBy: (req?.audience?.audit?.updatedBy ?? ""),
        },
        owner: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.calculateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse.fromPartial({
        audience: {
          description: (reply2?.mediaAsset?.components?.["primary"]?.description ?? ""),
        },
      }),
      audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          parameters: (req?.audience?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Returns an audience.
   */
  async getAudienceRules(req: audiencesAudienceValidationServiceApi.GetAudienceRulesRequest): Promise<audiencesAudienceValidationServiceApi.GetAudienceRulesResponse> {
    validateContext(req.context);
    if (!req.audienceId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAudienceRules", req);
    this.logger.info("get_audience_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        correlationId: (req?.context?.actor?.userId ?? ""),
        measurements: [{ observedAt: req?.context?.deadline }],
        source: (req?.audienceId ?? ""),
      },
      details: { authorEmail: (req?.context?.actor?.email ?? "") },
    });
    const reply1 = await this.workQueue.enqueue<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse>(
      "acme.audiences.v1.AudienceValidationService/GetAudienceRules:0", request1,
    );
    return mergeResponses(
      audiencesAudienceValidationServiceApi.GetAudienceRulesResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      audiencesAudienceValidationServiceApi.GetAudienceRulesResponse.fromPartial({ audience: { audienceId: (req?.audienceId ?? "") } }),
    );
  }

  /**
   * Lints an audience.
   */
  async lintAudiences(req: audiencesAudienceValidationServiceApi.LintAudiencesRequest): Promise<audiencesAudienceValidationServiceApi.LintAudiencesResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "LintAudiences", req);
    this.logger.info("lint_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest.fromPartial({
      audienceMember: { audit: { createdAt: req?.audience?.audit?.createdAt } },
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest, audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient.explainAudienceMemberCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest, audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse>(invoke1, request1));
    const request2 = audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest.fromPartial({
      audienceMember: {
        contact: { name: req?.details?.contact?.name },
        identityDocument: { $case: "passport", passport: {
          expiresAt: (reply1?.audienceMember?.identityDocument?.$case === "passport" ? reply1?.audienceMember?.identityDocument.passport : undefined)?.expiresAt,
        } },
      },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient.estimateAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceValidationServiceApi.LintAudiencesResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      audiencesAudienceValidationServiceApi.LintAudiencesResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      audiencesAudienceValidationServiceApi.LintAudiencesResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          effective: req?.audience?.effective,
        },
      }),
    );
  }

  /**
   * Normalizes an audience.
   */
  async normalizeAudience(req: audiencesAudienceValidationServiceApi.NormalizeAudienceRequest): Promise<audiencesAudienceValidationServiceApi.NormalizeAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "NormalizeAudience", req);
    this.logger.info("normalize_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest.fromPartial({
      audienceMember: { relationshipManager: { email: (req?.details?.contact?.email ?? "") } },
      context: req?.context,
    });
    const invoke1: Unary<audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest, audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient.explainAudienceMemberCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (reply1?.audienceMember?.relationshipManager?.email ?? ""),
          name: reply1?.audienceMember?.contact?.name,
        },
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.validateNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceValidationServiceApi.NormalizeAudienceResponse.fromPartial({
        audience: { owner: { email: (reply1?.audienceMember?.contact?.email ?? "") } },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      audiencesAudienceValidationServiceApi.NormalizeAudienceResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      audiencesAudienceValidationServiceApi.NormalizeAudienceResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          priority: (req?.audience?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Previews an audience.
   */
  async previewAudience(req: audiencesAudienceValidationServiceApi.PreviewAudienceRequest): Promise<audiencesAudienceValidationServiceApi.PreviewAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "PreviewAudience", req);
    this.logger.info("preview_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          name: req?.details?.contact?.name,
        },
      },
      notificationTemplate: {
        counterparty: { displayName: (req?.audience?.owner?.displayName ?? "") },
        lines: [{
          amount: (req?.audience?.action?.$case === "discount" ? req?.audience?.action.discount : undefined)?.amount,
        }],
      },
    });
    const method1 = "lintNotificationTemplates" as const;
    const invoke1: Unary<notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest, notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest, notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse>(invoke1, request1);
    const request2 = certificatesCertificateCalculationServiceApi.RecalculateCertificatesRequest.fromPartial({
      certificate: {
        audit: { etag: (reply1?.notificationTemplate?.audit?.etag ?? "") },
        settlement: { $case: "card", card: {
          holderName: ((reply1?.notificationTemplate?.settlement?.$case === "card" ? reply1?.notificationTemplate?.settlement.card : undefined)?.holderName ?? ""),
        } },
        lines: [{
          tax: {
            amount: (req?.audience?.action?.$case === "discount" ? req?.audience?.action.discount : undefined)?.amount,
          },
        }],
      },
      context: req?.context,
    });
    const proxy2 = forwarding(this.certificatesCertificateCalculationClient);
    const invoke2: Unary<certificatesCertificateCalculationServiceApi.RecalculateCertificatesRequest, certificatesCertificateCalculationServiceApi.RecalculateCertificatesResponse> =
      (input, done) => proxy2.recalculateCertificates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<certificatesCertificateCalculationServiceApi.RecalculateCertificatesRequest, certificatesCertificateCalculationServiceApi.RecalculateCertificatesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceValidationServiceApi.PreviewAudienceResponse.fromPartial({
        outcome: {
          message: (reply1?.outcome?.message ?? ""),
          referenceId: (reply1?.outcome?.referenceId ?? ""),
        },
      }),
      audiencesAudienceValidationServiceApi.PreviewAudienceResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      audiencesAudienceValidationServiceApi.PreviewAudienceResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          version: (req?.audience?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Scores an audience.
   */
  async scoreAudience(req: audiencesAudienceValidationServiceApi.ScoreAudienceRequest): Promise<audiencesAudienceValidationServiceApi.ScoreAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "ScoreAudience", req);
    this.logger.info("score_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationQueryServiceApi.ExportNotificationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audience?.audit?.updatedAt,
        ownerId: (req?.audience?.owner?.userId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const stream1 = this.notificationsNotificationQueryClient.exportNotifications(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationQueryServiceApi.ExportNotificationsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return audiencesAudienceValidationServiceApi.ScoreAudienceResponse.fromPartial({
      audience: {
        audienceId: (req?.audienceId ?? ""),
        name: (req?.audience?.name ?? ""),
      },
    });
  }

  /**
   * Validates an audience.
   */
  async validateAudience(req: audiencesAudienceValidationServiceApi.ValidateAudienceRequest): Promise<audiencesAudienceValidationServiceApi.ValidateAudienceResponse> {
    validateContext(req.context);
    if (req.audience) {
      await this.repository.save(toAudienceRecord(req.context.tenantId, req.audience));
    }
    await this.repository.record(req.context.tenantId, "ValidateAudience", req);
    this.logger.info("validate_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.SearchUsersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audience?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.audience?.parameters ?? {}))),
        ownerId: (req?.audienceId ?? ""),
      },
    });
    const invoke1: Unary<identityUserServiceApi.SearchUsersRequest, identityUserServiceApi.SearchUsersResponse> =
      (input, done) => this.identityUserClient.searchUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserServiceApi.SearchUsersRequest, identityUserServiceApi.SearchUsersResponse>(invoke1, request1);
    const request2 = mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        audit: {
          createdAt: req?.audience?.audit?.createdAt,
          updatedBy: (req?.audience?.audit?.updatedBy ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.simulateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceValidationServiceApi.ValidateAudienceResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      audiencesAudienceValidationServiceApi.ValidateAudienceResponse.fromPartial({
        audience: {
          audit: { updatedAt: reply2?.mediaAsset?.audit?.updatedAt },
          owner: { userId: (reply2?.mediaAsset?.owner?.userId ?? "") },
        },
      }),
      audiencesAudienceValidationServiceApi.ValidateAudienceResponse.fromPartial({
        audience: {
          audienceId: (req?.audienceId ?? ""),
          name: (req?.audience?.name ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for AudienceValidationService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceValidationHandler {
  constructor(@inject(AudienceValidationWorkflow) private readonly workflow: AudienceValidationWorkflow) {}

  /**
   * Checks an audience.
   */
  checkAudienceEligibility = unary<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse>(
    (request) => this.workflow.checkAudienceEligibility(request),
  );

  /**
   * Explains an audience.
   */
  explainAudienceDecision = unary<audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest, audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse>(
    (request) => this.workflow.explainAudienceDecision(request),
  );

  /**
   * Returns an audience.
   */
  getAudienceRules = (call: ServerUnaryCall<audiencesAudienceValidationServiceApi.GetAudienceRulesRequest, audiencesAudienceValidationServiceApi.GetAudienceRulesResponse>, done: sendUnaryData<audiencesAudienceValidationServiceApi.GetAudienceRulesResponse>): void => {
    void this.workflow.getAudienceRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints an audience.
   */
  lintAudiences = unary<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse>(
    (request) => this.workflow.lintAudiences(request),
  );

  /**
   * Normalizes an audience.
   */
  normalizeAudience = unary<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse>(
    (request) => this.workflow.normalizeAudience(request),
  );

  /**
   * Previews an audience.
   */
  previewAudience = (call: ServerUnaryCall<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse>, done: sendUnaryData<audiencesAudienceValidationServiceApi.PreviewAudienceResponse>): void => {
    void this.workflow.previewAudience(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Scores an audience.
   */
  scoreAudience = unary<audiencesAudienceValidationServiceApi.ScoreAudienceRequest, audiencesAudienceValidationServiceApi.ScoreAudienceResponse>(
    (request) => this.workflow.scoreAudience(request),
  );

  /**
   * Validates an audience.
   */
  validateAudience = unary<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse>(
    (request) => this.workflow.validateAudience(request),
  );
}

export function implementation(handler: AudienceValidationHandler): audiencesAudienceValidationServiceApi.AudienceValidationServiceServer {
  return {
    checkAudienceEligibility: handler.checkAudienceEligibility,
    explainAudienceDecision: handler.explainAudienceDecision,
    getAudienceRules: handler.getAudienceRules,
    lintAudiences: handler.lintAudiences,
    normalizeAudience: handler.normalizeAudience,
    previewAudience: handler.previewAudience,
    scoreAudience: handler.scoreAudience,
    validateAudience: handler.validateAudience,
  };
}
