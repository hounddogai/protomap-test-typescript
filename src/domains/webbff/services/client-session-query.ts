/**
 * Answers read-only questions about client sessions, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as chatHandoffWorkflowServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_workflow_service.js";
import * as contentContentBlockApprovalServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_approval_service.js";
import * as edgegatewayRouteBindingQueryServiceApi from "../../../../.cache/proto/acme/edgegateway/v1/route_binding_query_service.js";
import * as fanportalFanSessionServiceApi from "../../../../.cache/proto/acme/fanportal/v1/fan_session_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as patientappPatientHomeServiceApi from "../../../../.cache/proto/acme/patientapp/v1/patient_home_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import * as webbffClientSessionQueryServiceApi from "../../../../.cache/proto/acme/webbff/v1/client_session_query_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
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
import { WebbffRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate client session operations and persist audit data.
 */
@injectable()
export class ClientSessionQueryWorkflow {
  constructor(
    @inject(WebbffRepository) private readonly repository: WebbffRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.HandoffWorkflowService") private readonly chatHandoffWorkflowClient: chatHandoffWorkflowServiceApi.HandoffWorkflowServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockApprovalService") private readonly contentContentBlockApprovalClient: contentContentBlockApprovalServiceApi.ContentBlockApprovalServiceClient,
    @inject("grpc:acme.edgegateway.v1.RouteBindingQueryService") private readonly edgegatewayRouteBindingQueryClient: edgegatewayRouteBindingQueryServiceApi.RouteBindingQueryServiceClient,
    @inject("grpc:acme.fanportal.v1.FanSessionService") private readonly fanportalFanSessionClient: fanportalFanSessionServiceApi.FanSessionServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.patientapp.v1.PatientHomeService") private readonly patientappPatientHomeClient: patientappPatientHomeServiceApi.PatientHomeServiceClient,
    @inject("grpc:acme.webbff.v1.ClientSessionIntegrationService") private readonly webbffClientSessionIntegrationClient: webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient,
    @inject("grpc:acme.webbff.v1.WidgetLayoutIntegrationService") private readonly webbffWidgetLayoutIntegrationClient: webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists client sessions a page at a time.
   */
  async browseClientSessions(req: webbffClientSessionQueryServiceApi.BrowseClientSessionsRequest): Promise<webbffClientSessionQueryServiceApi.BrowseClientSessionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseClientSessions", req);
    this.logger.info("browse_client_sessions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = edgegatewayRouteBindingQueryServiceApi.BrowseRouteBindingsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.edgegateway.v1.BrowseRouteBindingsRequest",
      value: Buffer.from(edgegatewayRouteBindingQueryServiceApi.BrowseRouteBindingsRequest.encode(request1).finish()),
    });
    const unpacked1 = edgegatewayRouteBindingQueryServiceApi.BrowseRouteBindingsRequest.decode(envelope1.value);
    const invoke1: Unary<edgegatewayRouteBindingQueryServiceApi.BrowseRouteBindingsRequest, edgegatewayRouteBindingQueryServiceApi.BrowseRouteBindingsResponse> =
      (input, done) => this.edgegatewayRouteBindingQueryClient.browseRouteBindings(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<edgegatewayRouteBindingQueryServiceApi.BrowseRouteBindingsRequest, edgegatewayRouteBindingQueryServiceApi.BrowseRouteBindingsResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffClientSessionQueryServiceApi.BrowseClientSessionsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } });
  }

  /**
   * Counts client sessions by status.
   */
  async countClientSessions(req: webbffClientSessionQueryServiceApi.CountClientSessionsRequest): Promise<webbffClientSessionQueryServiceApi.CountClientSessionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountClientSessions", req);
    this.logger.info("count_client_sessions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      context: req?.context,
      details: {
        messageId: (req?.filter?.ownerId ?? ""),
        receivedAt: req?.filter?.createdAfter,
      },
    });
    const client1 = this.clients.get<webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient>("acme.webbff.v1.WidgetLayoutIntegrationService");
    const invoke1: Unary<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse> =
      (input, done) => client1.disconnectWidgetLayoutSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse>(invoke1, request1);
    const request2 = patientappPatientHomeServiceApi.SearchPatientHomesRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        region: (reply1?.widgetLayout?.location?.region ?? ""),
      },
      orderBy: (req?.orderBy ?? ""),
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke2: Unary<patientappPatientHomeServiceApi.SearchPatientHomesRequest, patientappPatientHomeServiceApi.SearchPatientHomesResponse> =
      (input, done) => this.patientappPatientHomeClient.searchPatientHomes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<patientappPatientHomeServiceApi.SearchPatientHomesRequest, patientappPatientHomeServiceApi.SearchPatientHomesResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.filter?.region ?? "") });
    return mergeResponses(
      webbffClientSessionQueryServiceApi.CountClientSessionsResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      webbffClientSessionQueryServiceApi.CountClientSessionsResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
    );
  }

  /**
   * Streams every matching client session.
   */
  async exportClientSessions(req: webbffClientSessionQueryServiceApi.ExportClientSessionsRequest): Promise<webbffClientSessionQueryServiceApi.ExportClientSessionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportClientSessions", req);
    this.logger.info("export_client_sessions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceRequest.fromPartial({
      context: req?.context,
      details: { receivedAt: req?.filter?.createdAfter },
    });
    const invoke1: Unary<webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.disconnectClientSessionSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse>(invoke1, request1));
    const request2 = chatHandoffWorkflowServiceApi.ListHandoffWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
        query: (req?.filter?.query ?? ""),
      },
    });
    const invoke2: Unary<chatHandoffWorkflowServiceApi.ListHandoffWorkflowsRequest, chatHandoffWorkflowServiceApi.ListHandoffWorkflowsResponse> =
      (input, done) => this.chatHandoffWorkflowClient.listHandoffWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ExportClientSessions.ListHandoffWorkflows", () => call<chatHandoffWorkflowServiceApi.ListHandoffWorkflowsRequest, chatHandoffWorkflowServiceApi.ListHandoffWorkflowsResponse>(invoke2, request2));
    const request3 = featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest.fromPartial({ context: req?.context });
    const invoke3: Unary<featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.batchGetFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      webbffClientSessionQueryServiceApi.ExportClientSessionsResponse.fromPartial({
        clientSession: {
          customFields: (reply1?.clientSession?.customFields ?? {}),
          subject: (reply1?.clientSession?.subject ?? ""),
        },
      }),
      webbffClientSessionQueryServiceApi.ExportClientSessionsResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      webbffClientSessionQueryServiceApi.ExportClientSessionsResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
    );
  }

  /**
   * Lists client sessions a page at a time.
   */
  async findClientSessions(req: webbffClientSessionQueryServiceApi.FindClientSessionsRequest): Promise<webbffClientSessionQueryServiceApi.FindClientSessionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindClientSessions", req);
    this.logger.info("find_client_sessions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockApprovalServiceApi.RecallContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          audit: { updatedAt: req?.filter?.createdAfter },
          children: [{ manager: { userId: (req?.context?.actor?.userId ?? "") } }],
        }],
        location: { region: (req?.filter?.region ?? "") },
      },
      context: req?.context,
      details: { approver: { email: (req?.context?.actor?.email ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<contentContentBlockApprovalServiceApi.RecallContentBlockRequest, contentContentBlockApprovalServiceApi.RecallContentBlockResponse>(
      "acme.webbff.v1.ClientSessionQueryService/FindClientSessions:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffClientSessionQueryServiceApi.FindClientSessionsResponse.fromPartial({
      clientSessions: [{
        audit: { createdBy: (reply1?.contentBlock?.audit?.createdBy ?? "") },
        requester: { email: (reply1?.contentBlock?.manager?.email ?? "") },
      }],
    });
  }

  /**
   * Returns a client session.
   */
  async lookupClientSession(req: webbffClientSessionQueryServiceApi.LookupClientSessionRequest): Promise<webbffClientSessionQueryServiceApi.LookupClientSessionResponse> {
    validateContext(req.context);
    if (!req.clientSessionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "client_session_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupClientSession", req);
    this.logger.info("lookup_client_session", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountValidationServiceApi.LintLedgerAccountsRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      ledgerAccount: {
        audit: { updatedAt: req?.context?.deadline },
        contact: { email: (req?.context?.actor?.email ?? "") },
        funding: { $case: "externalAccountId", externalAccountId: (req?.clientSessionId ?? "") },
      },
    });
    const invoke1: Unary<ledgerLedgerAccountValidationServiceApi.LintLedgerAccountsRequest, ledgerLedgerAccountValidationServiceApi.LintLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.lintLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<ledgerLedgerAccountValidationServiceApi.LintLedgerAccountsRequest, ledgerLedgerAccountValidationServiceApi.LintLedgerAccountsResponse>(invoke1, request1));
    const request2 = webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((reply1?.ledgerAccount?.labels ?? {}))),
      clientSessionId: (req?.clientSessionId ?? ""),
      context: req?.context,
      details: {
        messageId: (reply1?.result?.message ?? ""),
        receivedAt: reply1?.outcome?.effectiveAt,
      },
    });
    const invoke2: Unary<webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.connectClientSessionSource(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return mergeResponses(
      webbffClientSessionQueryServiceApi.LookupClientSessionResponse.fromPartial({
        clientSession: {
          assignee: {
            displayName: (reply1?.ledgerAccount?.holder?.displayName ?? ""),
            email: (reply1?.ledgerAccount?.contact?.email ?? ""),
          },
        },
      }),
      webbffClientSessionQueryServiceApi.LookupClientSessionResponse.fromPartial({
        clientSession: {
          comments: [{ createdAt: reply2?.clientSession?.audit?.createdAt }],
          sla: { policyId: (reply2?.clientSession?.sla?.policyId ?? "") },
        },
      }),
      webbffClientSessionQueryServiceApi.LookupClientSessionResponse.fromPartial({ clientSession: { clientSessionId: (req?.clientSessionId ?? "") } }),
    );
  }

  /**
   * Lists client sessions a page at a time.
   */
  async suggestClientSessions(req: webbffClientSessionQueryServiceApi.SuggestClientSessionsRequest): Promise<webbffClientSessionQueryServiceApi.SuggestClientSessionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestClientSessions", req);
    this.logger.info("suggest_client_sessions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        ownerId: (req?.filter?.ownerId ?? ""),
      },
      page: { pageSize: (req?.page?.pageSize ?? 0) },
    });
    const invoke1: Unary<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest, webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse> =
      (input, done) => this.webbffClientSessionIntegrationClient.listClientSessionSources(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return webbffClientSessionQueryServiceApi.SuggestClientSessionsResponse.fromPartial({
      result: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        message: (reply1?.result?.message ?? ""),
      },
    });
  }

  /**
   * Summarizes a client session.
   */
  async summarizeClientSessions(req: webbffClientSessionQueryServiceApi.SummarizeClientSessionsRequest): Promise<webbffClientSessionQueryServiceApi.SummarizeClientSessionsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeClientSessions", req);
    this.logger.info("summarize_client_sessions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fanportalFanSessionServiceApi.CreateFanSessionRequest.fromPartial({
      context: req?.context,
      fanSession: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<fanportalFanSessionServiceApi.CreateFanSessionRequest, fanportalFanSessionServiceApi.CreateFanSessionResponse> =
      (input, done) => this.fanportalFanSessionClient.createFanSession(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (reply1?.fanSession?.assignee?.email ?? ""),
          name: reply1?.fanSession?.requester?.name,
          preferredChannel: (reply1?.fanSession?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const method2 = "shareDeliveryAttemptExport" as const;
    const invoke2: Unary<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse> =
      (input, done) => this.notificationsDeliveryAttemptExportClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse>(invoke2, request2);
    const request3 = webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      clientSessionId: (req?.clientSessionId ?? ""),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const proxy3 = forwarding(this.webbffClientSessionIntegrationClient);
    const invoke3: Unary<webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest, webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse> =
      (input, done) => proxy3.replayClientSessionEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest, webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      webbffClientSessionQueryServiceApi.SummarizeClientSessionsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      webbffClientSessionQueryServiceApi.SummarizeClientSessionsResponse.fromPartial({
        result: {
          correlationId: (reply2?.deliveryAttempt?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      webbffClientSessionQueryServiceApi.SummarizeClientSessionsResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          message: (reply3?.outcome?.message ?? ""),
        },
      }),
      webbffClientSessionQueryServiceApi.SummarizeClientSessionsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for ClientSessionQueryService; workflows own validation and database transactions.
 */
@injectable()
export class ClientSessionQueryHandler {
  constructor(@inject(ClientSessionQueryWorkflow) private readonly workflow: ClientSessionQueryWorkflow) {}

  /**
   * Lists client sessions a page at a time.
   */
  browseClientSessions = unary<webbffClientSessionQueryServiceApi.BrowseClientSessionsRequest, webbffClientSessionQueryServiceApi.BrowseClientSessionsResponse>(
    (request) => this.workflow.browseClientSessions(request),
  );

  /**
   * Counts client sessions by status.
   */
  countClientSessions = unary<webbffClientSessionQueryServiceApi.CountClientSessionsRequest, webbffClientSessionQueryServiceApi.CountClientSessionsResponse>(
    (request) => this.workflow.countClientSessions(request),
  );

  /**
   * Streams every matching client session.
   */
  exportClientSessions = serverStream<webbffClientSessionQueryServiceApi.ExportClientSessionsRequest, webbffClientSessionQueryServiceApi.ExportClientSessionsResponse>(
    (request) => this.workflow.exportClientSessions(request),
  );

  /**
   * Lists client sessions a page at a time.
   */
  findClientSessions = unary<webbffClientSessionQueryServiceApi.FindClientSessionsRequest, webbffClientSessionQueryServiceApi.FindClientSessionsResponse>(
    (request) => this.workflow.findClientSessions(request),
  );

  /**
   * Returns a client session.
   */
  lookupClientSession = unary<webbffClientSessionQueryServiceApi.LookupClientSessionRequest, webbffClientSessionQueryServiceApi.LookupClientSessionResponse>(
    (request) => this.workflow.lookupClientSession(request),
  );

  /**
   * Lists client sessions a page at a time.
   */
  suggestClientSessions = (call: ServerUnaryCall<webbffClientSessionQueryServiceApi.SuggestClientSessionsRequest, webbffClientSessionQueryServiceApi.SuggestClientSessionsResponse>, done: sendUnaryData<webbffClientSessionQueryServiceApi.SuggestClientSessionsResponse>): void => {
    void this.workflow.suggestClientSessions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Summarizes a client session.
   */
  summarizeClientSessions = unary<webbffClientSessionQueryServiceApi.SummarizeClientSessionsRequest, webbffClientSessionQueryServiceApi.SummarizeClientSessionsResponse>(
    (request) => this.workflow.summarizeClientSessions(request),
  );
}

export function implementation(handler: ClientSessionQueryHandler): webbffClientSessionQueryServiceApi.ClientSessionQueryServiceServer {
  return {
    browseClientSessions: handler.browseClientSessions,
    countClientSessions: handler.countClientSessions,
    exportClientSessions: handler.exportClientSessions,
    findClientSessions: handler.findClientSessions,
    lookupClientSession: handler.lookupClientSession,
    suggestClientSessions: handler.suggestClientSessions,
    summarizeClientSessions: handler.summarizeClientSessions,
  };
}
