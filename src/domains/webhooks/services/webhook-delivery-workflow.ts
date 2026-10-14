/**
 * Runs the long-lived workflow that takes a webhook delivery from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as budgetingBudgetQueryServiceApi from "../../../../.cache/proto/acme/budgeting/v1/budget_query_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
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
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toWebhookDeliveryRecord } from "../data/records.js";
import { WebhooksRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook delivery operations and persist audit data.
 */
@injectable()
export class WebhookDeliveryWorkflowWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.budgeting.v1.BudgetQueryService") private readonly budgetingBudgetQueryClient: budgetingBudgetQueryServiceApi.BudgetQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyApprovalService") private readonly localizationTranslationKeyApprovalClient: localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileApprovalService") private readonly personalizationProfileApprovalClient: personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationWorkflowService") private readonly personalizationRecommendationWorkflowClient: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryApprovalService") private readonly webhooksWebhookDeliveryApprovalClient: webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryQueryService") private readonly webhooksWebhookDeliveryQueryClient: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryValidationService") private readonly webhooksWebhookDeliveryValidationClient: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointApprovalService") private readonly webhooksWebhookEndpointApprovalClient: webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretValidationService") private readonly webhooksWebhookSecretValidationClient: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a webhook delivery.
   */
  async advanceWebhookDeliveryWorkflow(req: webhooksWebhookDeliveryWorkflowServiceApi.AdvanceWebhookDeliveryWorkflowRequest): Promise<webhooksWebhookDeliveryWorkflowServiceApi.AdvanceWebhookDeliveryWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "AdvanceWebhookDeliveryWorkflow", req);
    this.logger.info("advance_webhook_delivery_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.webhookDelivery?.occurredAt },
    });
    const proxy1 = forwarding(this.webhooksWebhookDeliveryQueryClient);
    const invoke1: Unary<webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse> =
      (input, done) => proxy1.suggestWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse>(invoke1, request1);
    const request2 = webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.notify?.name } },
      webhookEndpoint: { owner: { email: (req?.details?.notify?.email ?? "") } },
    });
    const invoke2: Unary<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.normalizeWebhookEndpoint(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointRequest, webhooksWebhookEndpointValidationServiceApi.NormalizeWebhookEndpointResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryWorkflowServiceApi.AdvanceWebhookDeliveryWorkflowResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.AdvanceWebhookDeliveryWorkflowResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      webhooksWebhookDeliveryWorkflowServiceApi.AdvanceWebhookDeliveryWorkflowResponse.fromPartial({
        webhookDelivery: {
          source: (req?.webhookDelivery?.source ?? ""),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a webhook delivery.
   */
  async inspectWebhookDeliveryWorkflow(req: webhooksWebhookDeliveryWorkflowServiceApi.InspectWebhookDeliveryWorkflowRequest): Promise<webhooksWebhookDeliveryWorkflowServiceApi.InspectWebhookDeliveryWorkflowResponse> {
    validateContext(req.context);
    if (!req.webhookDeliveryId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_delivery_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectWebhookDeliveryWorkflow", req);
    this.logger.info("inspect_webhook_delivery_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserValidationServiceApi.ValidateUserRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      user: {
        audit: { updatedAt: req?.context?.deadline },
        contact: { email: (req?.context?.actor?.email ?? "") },
        userId: (req?.context?.actor?.userId ?? ""),
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<identityUserValidationServiceApi.ValidateUserRequest, identityUserValidationServiceApi.ValidateUserResponse> =
      (input, done) => this.identityUserValidationClient.validateUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserValidationServiceApi.ValidateUserRequest, identityUserValidationServiceApi.ValidateUserResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest.fromPartial({
      context: input2?.context,
      details: { contact: { name: reply1?.user?.contact?.name } },
    });
    const invoke2: Unary<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient.checkWebhookSecretEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse>(invoke2, request2);
    return mergeResponses(
      webhooksWebhookDeliveryWorkflowServiceApi.InspectWebhookDeliveryWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      webhooksWebhookDeliveryWorkflowServiceApi.InspectWebhookDeliveryWorkflowResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.InspectWebhookDeliveryWorkflowResponse.fromPartial({
        webhookDelivery: { webhookDeliveryId: (req?.webhookDeliveryId ?? "") },
      }),
    );
  }

  /**
   * Lists webhook deliveries a page at a time.
   */
  async listWebhookDeliveryWorkflows(req: webhooksWebhookDeliveryWorkflowServiceApi.ListWebhookDeliveryWorkflowsRequest): Promise<webhooksWebhookDeliveryWorkflowServiceApi.ListWebhookDeliveryWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListWebhookDeliveryWorkflows", req);
    this.logger.info("list_webhook_delivery_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookDeliveryWorkflowServiceApi.ListWebhookDeliveryWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a webhook delivery.
   */
  async pauseWebhookDeliveryWorkflow(req: webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowRequest): Promise<webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "PauseWebhookDeliveryWorkflow", req);
    this.logger.info("pause_webhook_delivery_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.webhookDelivery?.occurredAt },
    });
    const cloned1: webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesRequest, webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesResponse> =
      (input, done) => this.webhooksWebhookDeliveryApprovalClient.listPendingWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesRequest, webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesResponse>(invoke1, cloned1);
    const request2 = webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
      webhookDelivery: {
        subject: { displayName: (req?.webhookDelivery?.subject?.displayName ?? "") },
      },
    });
    const decoded2 = webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest.fromJSON(
      JSON.parse(JSON.stringify(webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest.toJSON(request2))),
    );
    const invoke2: Unary<webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.previewWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.PreviewWebhookDeliveryResponse>(invoke2, decoded2);
    const request3 = personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.details?.notify?.email ?? "") } },
      recommendation: {
        counterparty: { displayName: (reply2?.webhookDelivery?.subject?.displayName ?? "") },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.RetryRecommendationWorkflowRequest",
      value: Buffer.from(personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowRequest.encode(request3).finish()),
    });
    const unpacked3 = personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowRequest.decode(envelope3.value);
    const invoke3: Unary<personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowResponse> =
      (input, done) => this.personalizationRecommendationWorkflowClient.retryRecommendationWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowResponse>(invoke3, unpacked3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.webhookDelivery?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowResponse.fromPartial({
        webhookDelivery: {
          kind: (req?.webhookDelivery?.kind ?? ""),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a webhook delivery.
   */
  async resumeWebhookDeliveryWorkflow(req: webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest): Promise<webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "ResumeWebhookDeliveryWorkflow", req);
    this.logger.info("resume_webhook_delivery_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileApprovalServiceApi.ListPendingProfilesRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.webhookDelivery?.subject?.webhookEndpointId ?? "") },
    });
    const client1 = this.clients.get<personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient>("acme.personalization.v1.ProfileApprovalService");
    const invoke1: Unary<personalizationProfileApprovalServiceApi.ListPendingProfilesRequest, personalizationProfileApprovalServiceApi.ListPendingProfilesResponse> =
      (input, done) => client1.listPendingProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileApprovalServiceApi.ListPendingProfilesRequest, personalizationProfileApprovalServiceApi.ListPendingProfilesResponse>(invoke1, request1);
    const request2 = webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.webhookDelivery?.subject?.displayName ?? ""),
          email: (req?.details?.notify?.email ?? ""),
        },
      },
      webhookDelivery: {
        kind: (req?.webhookDelivery?.kind ?? ""),
        subject: {
          webhookEndpointId: (req?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
        },
      },
    });
    const invoke2: Unary<webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryApprovalClient.recallWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const tasks3: Array<() => Promise<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse>> = [];
    for (const item of (req?.webhookDelivery?.measurements ?? [])) {
      tasks3.push(async () => {
        const request3 = webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest.fromPartial({
          context: req?.context,
          webhookDelivery: {
            measurements: [{
              metric: (item?.metric ?? ""),
              observedAt: item?.observedAt,
              unit: (item?.unit ?? ""),
            }],
          },
        });
        const invoke3: Unary<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse> =
          (input, done) => this.webhooksWebhookDeliveryValidationClient.validateWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply3 = await call<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse>(invoke3, request3);
        return reply3;
      });
    }
    const results3 = await Promise.all(tasks3.map((task) => task()));
    const reply3 = results3.at(-1) ?? webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse.fromPartial({});
    const request4 = authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest.fromPartial({
      accessPolicy: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: {
          displayName: (req?.webhookDelivery?.subject?.displayName ?? ""),
          email: (req?.details?.notify?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke4: Unary<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.scoreAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse.fromPartial({
        result: { message: (reply4?.result?.message ?? "") },
        webhookDelivery: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse.fromPartial({
        webhookDelivery: {
          subject: req?.webhookDelivery?.subject,
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a webhook delivery.
   */
  async retryWebhookDeliveryWorkflow(req: webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowRequest): Promise<webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "RetryWebhookDeliveryWorkflow", req);
    this.logger.info("retry_webhook_delivery_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookDelivery?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.details?.parameters ?? {}))),
        ownerId: (req?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
      },
    });
    const invoke1: Unary<localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysRequest, localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyApprovalClient.listPendingTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("RetryWebhookDeliveryWorkflow.ListPendingTranslationKeys", () => call<localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysRequest, localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysResponse>(invoke1, request1));
    const request2 = notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        attributes: Object.fromEntries(Object.entries((req?.webhookDelivery?.attributes ?? {}))),
        subject: { displayName: (req?.webhookDelivery?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.SimulateDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.simulateDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowResponse.fromPartial({
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
        webhookDelivery: { kind: (reply2?.deliveryAttempt?.kind ?? "") },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowResponse.fromPartial({
        webhookDelivery: {
          attributes: (req?.webhookDelivery?.attributes ?? {}),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a webhook delivery.
   */
  async signalWebhookDeliveryWorkflow(req: webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest): Promise<webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "SignalWebhookDeliveryWorkflow", req);
    this.logger.info("signal_webhook_delivery_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusRequest.fromPartial({
      context: req?.context,
      webhookEndpointId: (req?.webhookDelivery?.subject?.webhookEndpointId ?? ""),
    });
    const reply1 = await this.workQueue.enqueue<webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusRequest, webhooksWebhookEndpointApprovalServiceApi.GetWebhookEndpointApprovalStatusResponse>(
      "acme.webhooks.v1.WebhookDeliveryWorkflowService/SignalWebhookDeliveryWorkflow:0", request1,
    );
    const request2 = notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: { createdBy: (reply1?.webhookEndpoint?.audit?.createdBy ?? "") },
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateSyncClient.syncNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesRequest, notificationsNotificationTemplateSyncServiceApi.SyncNotificationTemplatesResponse>(invoke2, request2));
    const request3 = budgetingBudgetQueryServiceApi.SuggestBudgetsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply2?.notificationTemplate?.billingAddress?.region ?? "") },
    });
    const invoke3: Unary<budgetingBudgetQueryServiceApi.SuggestBudgetsRequest, budgetingBudgetQueryServiceApi.SuggestBudgetsResponse> =
      (input, done) => this.budgetingBudgetQueryClient.suggestBudgets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<budgetingBudgetQueryServiceApi.SuggestBudgetsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = budgetingBudgetQueryServiceApi.CountBudgetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.webhookEndpoint?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply3?.result?.details ?? {}))),
        ownerId: (reply1?.webhookEndpoint?.owner?.userId ?? ""),
        region: (reply2?.notificationTemplate?.billingAddress?.region ?? ""),
      },
    });
    const invoke4: Unary<budgetingBudgetQueryServiceApi.CountBudgetsRequest, budgetingBudgetQueryServiceApi.CountBudgetsResponse> =
      (input, done) => this.budgetingBudgetQueryClient.countBudgets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse.fromPartial({ result: { correlationId: (reply4?.result?.correlationId ?? "") } }),
      webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse.fromPartial({
        webhookDelivery: {
          kind: (req?.webhookDelivery?.kind ?? ""),
          webhookDeliveryId: (req?.webhookDeliveryId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a webhook delivery.
   */
  async startWebhookDeliveryWorkflow(req: webhooksWebhookDeliveryWorkflowServiceApi.StartWebhookDeliveryWorkflowRequest): Promise<webhooksWebhookDeliveryWorkflowServiceApi.StartWebhookDeliveryWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookDelivery) {
      await this.repository.save(toWebhookDeliveryRecord(req.context.tenantId, req.webhookDelivery));
    }
    await this.repository.record(req.context.tenantId, "StartWebhookDeliveryWorkflow", req);
    this.logger.info("start_webhook_delivery_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      webhookDelivery: {
        sequence: (req?.webhookDelivery?.sequence ?? 0),
        subject: { code: (req?.webhookDelivery?.subject?.code ?? "") },
        webhookDeliveryId: (req?.webhookDelivery?.webhookDeliveryId ?? ""),
      },
    });
    const invoke1: Unary<webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.ApproveWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryApprovalClient.approveWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookDeliveryWorkflowServiceApi.StartWebhookDeliveryWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        webhookDelivery: { webhookDeliveryId: (reply1?.webhookDelivery?.webhookDeliveryId ?? "") },
      }),
      webhooksWebhookDeliveryWorkflowServiceApi.StartWebhookDeliveryWorkflowResponse.fromPartial({
        webhookDelivery: {
          kind: (req?.webhookDelivery?.kind ?? ""),
          occurredAt: req?.webhookDelivery?.occurredAt,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for WebhookDeliveryWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookDeliveryWorkflowHandler {
  constructor(@inject(WebhookDeliveryWorkflowWorkflow) private readonly workflow: WebhookDeliveryWorkflowWorkflow) {}

  /**
   * Advances a webhook delivery.
   */
  advanceWebhookDeliveryWorkflow = unary<webhooksWebhookDeliveryWorkflowServiceApi.AdvanceWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.AdvanceWebhookDeliveryWorkflowResponse>(
    (request) => this.workflow.advanceWebhookDeliveryWorkflow(request),
  );

  /**
   * Returns a webhook delivery.
   */
  inspectWebhookDeliveryWorkflow = unary<webhooksWebhookDeliveryWorkflowServiceApi.InspectWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.InspectWebhookDeliveryWorkflowResponse>(
    (request) => this.workflow.inspectWebhookDeliveryWorkflow(request),
  );

  /**
   * Lists webhook deliveries a page at a time.
   */
  listWebhookDeliveryWorkflows = (call: ServerUnaryCall<webhooksWebhookDeliveryWorkflowServiceApi.ListWebhookDeliveryWorkflowsRequest, webhooksWebhookDeliveryWorkflowServiceApi.ListWebhookDeliveryWorkflowsResponse>, done: sendUnaryData<webhooksWebhookDeliveryWorkflowServiceApi.ListWebhookDeliveryWorkflowsResponse>): void => {
    void this.workflow.listWebhookDeliveryWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a webhook delivery.
   */
  pauseWebhookDeliveryWorkflow = unary<webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.PauseWebhookDeliveryWorkflowResponse>(
    (request) => this.workflow.pauseWebhookDeliveryWorkflow(request),
  );

  /**
   * Resumes a webhook delivery.
   */
  resumeWebhookDeliveryWorkflow = unary<webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse>(
    (request) => this.workflow.resumeWebhookDeliveryWorkflow(request),
  );

  /**
   * Retrys a webhook delivery.
   */
  retryWebhookDeliveryWorkflow = (call: ServerUnaryCall<webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowResponse>, done: sendUnaryData<webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowResponse>): void => {
    void this.workflow.retryWebhookDeliveryWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a webhook delivery.
   */
  signalWebhookDeliveryWorkflow = unary<webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse>(
    (request) => this.workflow.signalWebhookDeliveryWorkflow(request),
  );

  /**
   * Starts a webhook delivery.
   */
  startWebhookDeliveryWorkflow = unary<webhooksWebhookDeliveryWorkflowServiceApi.StartWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.StartWebhookDeliveryWorkflowResponse>(
    (request) => this.workflow.startWebhookDeliveryWorkflow(request),
  );
}

export function implementation(handler: WebhookDeliveryWorkflowHandler): webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceServer {
  return {
    advanceWebhookDeliveryWorkflow: handler.advanceWebhookDeliveryWorkflow,
    inspectWebhookDeliveryWorkflow: handler.inspectWebhookDeliveryWorkflow,
    listWebhookDeliveryWorkflows: handler.listWebhookDeliveryWorkflows,
    pauseWebhookDeliveryWorkflow: handler.pauseWebhookDeliveryWorkflow,
    resumeWebhookDeliveryWorkflow: handler.resumeWebhookDeliveryWorkflow,
    retryWebhookDeliveryWorkflow: handler.retryWebhookDeliveryWorkflow,
    signalWebhookDeliveryWorkflow: handler.signalWebhookDeliveryWorkflow,
    startWebhookDeliveryWorkflow: handler.startWebhookDeliveryWorkflow,
  };
}
