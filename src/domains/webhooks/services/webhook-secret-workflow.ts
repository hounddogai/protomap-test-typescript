/**
 * Runs the long-lived workflow that takes a webhook secret from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as experimentsExposureImportServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as messagingConversationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as webhooksWebhookEndpointWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_workflow_service.js";
import * as webhooksWebhookSecretApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_approval_service.js";
import * as webhooksWebhookSecretWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_workflow_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
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
import { upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toWebhookSecretRecord } from "../data/records.js";
import { WebhooksRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate webhook secret operations and persist audit data.
 */
@injectable()
export class WebhookSecretWorkflowWorkflow {
  constructor(
    @inject(WebhooksRepository) private readonly repository: WebhooksRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationService") private readonly messagingConversationClient: messagingConversationServiceApi.ConversationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryWorkflowService") private readonly webhooksWebhookDeliveryWorkflowClient: webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointWorkflowService") private readonly webhooksWebhookEndpointWorkflowClient: webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretApprovalService") private readonly webhooksWebhookSecretApprovalClient: webhooksWebhookSecretApprovalServiceApi.WebhookSecretApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a webhook secret.
   */
  async advanceWebhookSecretWorkflow(req: webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowRequest): Promise<webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "AdvanceWebhookSecretWorkflow", req);
    this.logger.info("advance_webhook_secret_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        contact: { phone: (req?.webhookSecret?.contact?.phone ?? "") },
        holder: { displayName: (req?.webhookSecret?.holder?.displayName ?? "") },
      },
    });
    const invoke1: Unary<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.normalizeLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.webhookSecret?.contact?.name,
        },
      },
    });
    const invoke2: Unary<webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse> =
      (input, done) => this.webhooksWebhookDeliveryWorkflowClient.resumeWebhookDeliveryWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = messagingConversationServiceApi.BatchCreateConversationsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.details?.notify,
      } },
    });
    const reply3 = await upload<messagingConversationServiceApi.BatchCreateConversationsRequest, messagingConversationServiceApi.BatchCreateConversationsResponse>(
      (done) => this.messagingConversationClient.batchCreateConversations(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        webhookSecret: { currencyCode: (reply1?.ledgerAccount?.currencyCode ?? "") },
      }),
      webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowResponse.fromPartial({
        result: { correlationId: (reply2?.webhookDelivery?.correlationId ?? "") },
      }),
      webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowResponse.fromPartial({
        webhookSecret: {
          contact: req?.webhookSecret?.contact,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a webhook secret.
   */
  async cancelWebhookSecretWorkflow(req: webhooksWebhookSecretWorkflowServiceApi.CancelWebhookSecretWorkflowRequest): Promise<webhooksWebhookSecretWorkflowServiceApi.CancelWebhookSecretWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "CancelWebhookSecretWorkflow", req);
    this.logger.info("cancel_webhook_secret_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointWorkflowServiceApi.PauseWebhookEndpointWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { name: req?.webhookSecret?.contact?.name } },
    });
    const invoke1: Unary<webhooksWebhookEndpointWorkflowServiceApi.PauseWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.PauseWebhookEndpointWorkflowResponse> =
      (input, done) => this.webhooksWebhookEndpointWorkflowClient.pauseWebhookEndpointWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretWorkflowServiceApi.CancelWebhookSecretWorkflowResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      webhooksWebhookSecretWorkflowServiceApi.CancelWebhookSecretWorkflowResponse.fromPartial({
        webhookSecret: {
          contact: req?.webhookSecret?.contact,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a webhook secret.
   */
  async inspectWebhookSecretWorkflow(req: webhooksWebhookSecretWorkflowServiceApi.InspectWebhookSecretWorkflowRequest): Promise<webhooksWebhookSecretWorkflowServiceApi.InspectWebhookSecretWorkflowResponse> {
    validateContext(req.context);
    if (!req.webhookSecretId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "webhook_secret_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectWebhookSecretWorkflow", req);
    this.logger.info("inspect_webhook_secret_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const method1 = "normalizeLedgerAccount" as const;
    const invoke1: Unary<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse>(invoke1, request1);
    const request2 = notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest.fromPartial({
      context: req?.context,
      details: { currencyCode: (reply1?.ledgerAccount?.currencyCode ?? "") },
      notification: {
        audit: { createdAt: reply1?.ledgerAccount?.audit?.createdAt },
        requester: {
          email: (reply1?.ledgerAccount?.contact?.email ?? ""),
          phone: (reply1?.ledgerAccount?.contact?.phone ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.notificationsNotificationCalculationClient);
    const invoke2: Unary<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse> =
      (input, done) => proxy2.recalculateNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse>(invoke2, request2);
    return mergeResponses(
      webhooksWebhookSecretWorkflowServiceApi.InspectWebhookSecretWorkflowResponse.fromPartial({
        webhookSecret: { contact: { name: reply1?.ledgerAccount?.contact?.name } },
      }),
      webhooksWebhookSecretWorkflowServiceApi.InspectWebhookSecretWorkflowResponse.fromPartial({
        webhookSecret: {
          audit: { createdBy: (reply2?.notification?.audit?.createdBy ?? "") },
          contact: {
            preferredChannel: (reply2?.notification?.requester?.preferredChannel ?? ""),
          },
        },
      }),
      webhooksWebhookSecretWorkflowServiceApi.InspectWebhookSecretWorkflowResponse.fromPartial({ webhookSecret: { webhookSecretId: (req?.webhookSecretId ?? "") } }),
    );
  }

  /**
   * Lists webhook secrets a page at a time.
   */
  async listWebhookSecretWorkflows(req: webhooksWebhookSecretWorkflowServiceApi.ListWebhookSecretWorkflowsRequest): Promise<webhooksWebhookSecretWorkflowServiceApi.ListWebhookSecretWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListWebhookSecretWorkflows", req);
    this.logger.info("list_webhook_secret_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
      webhookEndpoint: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
      },
    });
    const invoke1: Unary<webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowResponse> =
      (input, done) => this.webhooksWebhookEndpointWorkflowClient.resumeWebhookEndpointWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webhooksWebhookSecretWorkflowServiceApi.ListWebhookSecretWorkflowsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } });
  }

  /**
   * Pauses a webhook secret.
   */
  async pauseWebhookSecretWorkflow(req: webhooksWebhookSecretWorkflowServiceApi.PauseWebhookSecretWorkflowRequest): Promise<webhooksWebhookSecretWorkflowServiceApi.PauseWebhookSecretWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "PauseWebhookSecretWorkflow", req);
    this.logger.info("pause_webhook_secret_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureReportingServiceApi.ShareExposureReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          phone: (req?.webhookSecret?.contact?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<experimentsExposureReportingServiceApi.ShareExposureReportRequest, experimentsExposureReportingServiceApi.ShareExposureReportResponse> =
      (input, done) => this.experimentsExposureReportingClient.shareExposureReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureReportingServiceApi.ShareExposureReportRequest, experimentsExposureReportingServiceApi.ShareExposureReportResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = notificationsNotificationSyncServiceApi.PushNotificationRequest.fromPartial({
      context: input2?.context,
      notification: {
        requester: {
          email: (input2?.details?.notify?.email ?? ""),
          phone: (input2?.details?.notify?.phone ?? ""),
          preferredChannel: (input2?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse> =
      (input, done) => this.notificationsNotificationSyncClient.pushNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse>(invoke2, request2);
    const request3 = webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusRequest.fromPartial({
      context: req?.context,
      webhookSecretId: (req?.webhookSecret?.webhookSecretId ?? ""),
    });
    const cloned3: webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusRequest, webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusResponse> =
      (input, done) => this.webhooksWebhookSecretApprovalClient.getWebhookSecretApprovalStatus(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusRequest, webhooksWebhookSecretApprovalServiceApi.GetWebhookSecretApprovalStatusResponse>(invoke3, cloned3);
    const request4 = webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        audit: {
          createdAt: reply3?.webhookSecret?.audit?.createdAt,
          etag: (reply3?.webhookSecret?.audit?.etag ?? ""),
          updatedBy: (reply2?.notification?.audit?.updatedBy ?? ""),
        },
      },
    });
    const decoded4 = webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest.fromJSON(
      JSON.parse(JSON.stringify(webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest.toJSON(request4))),
    );
    const invoke4: Unary<webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowResponse> =
      (input, done) => this.webhooksWebhookEndpointWorkflowClient.startWebhookEndpointWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretWorkflowServiceApi.PauseWebhookSecretWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.exposure?.correlationId ?? ""),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      webhooksWebhookSecretWorkflowServiceApi.PauseWebhookSecretWorkflowResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      webhooksWebhookSecretWorkflowServiceApi.PauseWebhookSecretWorkflowResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      webhooksWebhookSecretWorkflowServiceApi.PauseWebhookSecretWorkflowResponse.fromPartial({
        outcome: { effectiveAt: reply4?.outcome?.effectiveAt },
        webhookSecret: {
          audit: { updatedBy: (reply4?.webhookEndpoint?.audit?.updatedBy ?? "") },
        },
      }),
      webhooksWebhookSecretWorkflowServiceApi.PauseWebhookSecretWorkflowResponse.fromPartial({
        webhookSecret: {
          status: req?.webhookSecret?.status,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a webhook secret.
   */
  async resumeWebhookSecretWorkflow(req: webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowRequest): Promise<webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "ResumeWebhookSecretWorkflow", req);
    this.logger.info("resume_webhook_secret_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.webhookSecret?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.webhookSecret?.labels ?? {}))),
        ownerId: ((req?.webhookSecret?.funding?.$case === "externalAccountId" ? req?.webhookSecret?.funding.externalAccountId : undefined) ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.ListWebhookEndpointWorkflowsRequest",
      value: Buffer.from(webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsRequest.encode(request1).finish()),
    });
    const unpacked1 = webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsRequest.decode(envelope1.value);
    const invoke1: Unary<webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsRequest, webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsResponse> =
      (input, done) => this.webhooksWebhookEndpointWorkflowClient.listWebhookEndpointWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsRequest, webhooksWebhookEndpointWorkflowServiceApi.ListWebhookEndpointWorkflowsResponse>(invoke1, unpacked1);
    const request2 = webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowRequest.fromPartial({
      context: req?.context,
      webhookDelivery: {
        subject: {
          webhookEndpointId: (req?.webhookSecret?.holder?.webhookEndpointId ?? ""),
        },
      },
    });
    const client2 = this.clients.get<webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient>("acme.webhooks.v1.WebhookDeliveryWorkflowService");
    const invoke2: Unary<webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowResponse> =
      (input, done) => client2.retryWebhookDeliveryWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowResponse>(invoke2, request2);
    const request3 = experimentsExposureImportServiceApi.ImportExposuresRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.details?.notify,
      } },
    });
    const reply3 = await upload<experimentsExposureImportServiceApi.ImportExposuresRequest, experimentsExposureImportServiceApi.ImportExposuresResponse>(
      (done) => this.experimentsExposureImportClient.importExposures(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowResponse.fromPartial({
        webhookSecret: { holder: { code: (reply2?.webhookDelivery?.subject?.code ?? "") } },
      }),
      webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowResponse.fromPartial({
        webhookSecret: {
          labels: (req?.webhookSecret?.labels ?? {}),
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a webhook secret.
   */
  async retryWebhookSecretWorkflow(req: webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowRequest): Promise<webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "RetryWebhookSecretWorkflow", req);
    this.logger.info("retry_webhook_secret_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.EstimateNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        requester: {
          email: (req?.webhookSecret?.contact?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.EstimateNotificationRequest, notificationsNotificationCalculationServiceApi.EstimateNotificationResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.estimateNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsNotificationCalculationServiceApi.EstimateNotificationRequest, notificationsNotificationCalculationServiceApi.EstimateNotificationResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowResponse.fromPartial({
        webhookSecret: {
          holder: req?.webhookSecret?.holder,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a webhook secret.
   */
  async startWebhookSecretWorkflow(req: webhooksWebhookSecretWorkflowServiceApi.StartWebhookSecretWorkflowRequest): Promise<webhooksWebhookSecretWorkflowServiceApi.StartWebhookSecretWorkflowResponse> {
    validateContext(req.context);
    if (req.webhookSecret) {
      await this.repository.save(toWebhookSecretRecord(req.context.tenantId, req.webhookSecret));
    }
    await this.repository.record(req.context.tenantId, "StartWebhookSecretWorkflow", req);
    this.logger.info("start_webhook_secret_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        audit: { etag: (req?.webhookSecret?.audit?.etag ?? "") },
        owner: {
          displayName: (req?.webhookSecret?.holder?.displayName ?? ""),
          email: (req?.details?.notify?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowResponse> =
      (input, done) => this.webhooksWebhookEndpointWorkflowClient.advanceWebhookEndpointWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.AdvanceWebhookEndpointWorkflowResponse>(invoke1, request1));
    const request2 = webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          preferredChannel: (req?.webhookSecret?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse> =
      (input, done) => this.webhooksWebhookDeliveryWorkflowClient.signalWebhookDeliveryWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("StartWebhookSecretWorkflow.SignalWebhookDeliveryWorkflow", () => call<webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse>(invoke2, request2));
    const request3 = webhooksWebhookDeliveryWorkflowServiceApi.AdvanceWebhookDeliveryWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          preferredChannel: (req?.webhookSecret?.contact?.preferredChannel ?? ""),
        },
      },
      webhookDelivery: { subject: { code: (req?.webhookSecret?.holder?.code ?? "") } },
    });
    const invoke3: Unary<webhooksWebhookDeliveryWorkflowServiceApi.AdvanceWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.AdvanceWebhookDeliveryWorkflowResponse> =
      (input, done) => this.webhooksWebhookDeliveryWorkflowClient.advanceWebhookDeliveryWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest.fromPartial({
      context: req?.context,
      webhookEndpointId: (req?.webhookSecret?.holder?.webhookEndpointId ?? ""),
    });
    const reply4 = await this.workQueue.enqueue<webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesRequest, webhooksWebhookEndpointValidationServiceApi.GetWebhookEndpointRulesResponse>(
      "acme.webhooks.v1.WebhookSecretWorkflowService/StartWebhookSecretWorkflow:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      webhooksWebhookSecretWorkflowServiceApi.StartWebhookSecretWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      webhooksWebhookSecretWorkflowServiceApi.StartWebhookSecretWorkflowResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      webhooksWebhookSecretWorkflowServiceApi.StartWebhookSecretWorkflowResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      webhooksWebhookSecretWorkflowServiceApi.StartWebhookSecretWorkflowResponse.fromPartial({
        result: { status: (reply4?.result?.status ?? "") },
        webhookSecret: { audit: { etag: (reply4?.webhookEndpoint?.audit?.etag ?? "") } },
      }),
      webhooksWebhookSecretWorkflowServiceApi.StartWebhookSecretWorkflowResponse.fromPartial({
        webhookSecret: {
          contact: req?.webhookSecret?.contact,
          webhookSecretId: (req?.webhookSecretId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for WebhookSecretWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class WebhookSecretWorkflowHandler {
  constructor(@inject(WebhookSecretWorkflowWorkflow) private readonly workflow: WebhookSecretWorkflowWorkflow) {}

  /**
   * Advances a webhook secret.
   */
  advanceWebhookSecretWorkflow = unary<webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowResponse>(
    (request) => this.workflow.advanceWebhookSecretWorkflow(request),
  );

  /**
   * Cancels a webhook secret.
   */
  cancelWebhookSecretWorkflow = unary<webhooksWebhookSecretWorkflowServiceApi.CancelWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.CancelWebhookSecretWorkflowResponse>(
    (request) => this.workflow.cancelWebhookSecretWorkflow(request),
  );

  /**
   * Returns a webhook secret.
   */
  inspectWebhookSecretWorkflow = (call: ServerUnaryCall<webhooksWebhookSecretWorkflowServiceApi.InspectWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.InspectWebhookSecretWorkflowResponse>, done: sendUnaryData<webhooksWebhookSecretWorkflowServiceApi.InspectWebhookSecretWorkflowResponse>): void => {
    void this.workflow.inspectWebhookSecretWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists webhook secrets a page at a time.
   */
  listWebhookSecretWorkflows = unary<webhooksWebhookSecretWorkflowServiceApi.ListWebhookSecretWorkflowsRequest, webhooksWebhookSecretWorkflowServiceApi.ListWebhookSecretWorkflowsResponse>(
    (request) => this.workflow.listWebhookSecretWorkflows(request),
  );

  /**
   * Pauses a webhook secret.
   */
  pauseWebhookSecretWorkflow = unary<webhooksWebhookSecretWorkflowServiceApi.PauseWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.PauseWebhookSecretWorkflowResponse>(
    (request) => this.workflow.pauseWebhookSecretWorkflow(request),
  );

  /**
   * Resumes a webhook secret.
   */
  resumeWebhookSecretWorkflow = (call: ServerUnaryCall<webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowResponse>, done: sendUnaryData<webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowResponse>): void => {
    void this.workflow.resumeWebhookSecretWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Retrys a webhook secret.
   */
  retryWebhookSecretWorkflow = unary<webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowResponse>(
    (request) => this.workflow.retryWebhookSecretWorkflow(request),
  );

  /**
   * Starts a webhook secret.
   */
  startWebhookSecretWorkflow = unary<webhooksWebhookSecretWorkflowServiceApi.StartWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.StartWebhookSecretWorkflowResponse>(
    (request) => this.workflow.startWebhookSecretWorkflow(request),
  );
}

export function implementation(handler: WebhookSecretWorkflowHandler): webhooksWebhookSecretWorkflowServiceApi.WebhookSecretWorkflowServiceServer {
  return {
    advanceWebhookSecretWorkflow: handler.advanceWebhookSecretWorkflow,
    cancelWebhookSecretWorkflow: handler.cancelWebhookSecretWorkflow,
    inspectWebhookSecretWorkflow: handler.inspectWebhookSecretWorkflow,
    listWebhookSecretWorkflows: handler.listWebhookSecretWorkflows,
    pauseWebhookSecretWorkflow: handler.pauseWebhookSecretWorkflow,
    resumeWebhookSecretWorkflow: handler.resumeWebhookSecretWorkflow,
    retryWebhookSecretWorkflow: handler.retryWebhookSecretWorkflow,
    startWebhookSecretWorkflow: handler.startWebhookSecretWorkflow,
  };
}
