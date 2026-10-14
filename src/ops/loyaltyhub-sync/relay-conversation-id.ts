import * as maintenanceWorkOrderCalculationServiceApi from "../../../.cache/proto/acme/maintenance/v1/work_order_calculation_service.js";
import * as messagingConversationServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_service.js";
import * as riskRiskRegisterQueryServiceApi from "../../../.cache/proto/acme/risk/v1/risk_register_query_service.js";
import * as telematicsTelemetryReadingServiceApi from "../../../.cache/proto/acme/telematics/v1/telemetry_reading_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayConversationId keeps of each GetConversation response. */
interface RelayConversationIdRecord {
  conversationId: string;
  subject: string;
  message: string;
}

/** Where relayConversationId hands each record. */
interface RelayConversationIdWriter {
  push(record: RelayConversationIdRecord): Promise<void>;
}

/** Passes records to acme.maintenance.v1.WorkOrderCalculationService. */
class RelayConversationIdWorkOrderCalculation implements RelayConversationIdWriter {
  private readonly client: maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayConversationIdRecord): Promise<void> {
    await call<maintenanceWorkOrderCalculationServiceApi.QuoteWorkOrderRequest, maintenanceWorkOrderCalculationServiceApi.QuoteWorkOrderResponse>(
      (request, done) => this.client.quoteWorkOrder(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      maintenanceWorkOrderCalculationServiceApi.QuoteWorkOrderRequest.fromPartial({ workOrder: { subject: record.conversationId }, reason: record.message, workOrderId: record.subject }));
  }
}

/** Passes records to acme.telematics.v1.TelemetryReadingService. */
class RelayConversationIdTelemetryReading implements RelayConversationIdWriter {
  private readonly client: telematicsTelemetryReadingServiceApi.TelemetryReadingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new telematicsTelemetryReadingServiceApi.TelemetryReadingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayConversationIdRecord): Promise<void> {
    await call<telematicsTelemetryReadingServiceApi.ListTelemetryReadingsRequest, telematicsTelemetryReadingServiceApi.ListTelemetryReadingsResponse>(
      (request, done) => this.client.listTelemetryReadings(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      telematicsTelemetryReadingServiceApi.ListTelemetryReadingsRequest.fromPartial({ filter: { query: record.subject } }));
  }
}

/** Sends records to acme.risk.v1.RiskRegisterQueryService. */
class RelayConversationIdRiskRegisterQuery implements RelayConversationIdWriter {
  private readonly client: riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayConversationIdRecord): Promise<void> {
    await call<riskRiskRegisterQueryServiceApi.BrowseRiskRegistersRequest, riskRiskRegisterQueryServiceApi.BrowseRiskRegistersResponse>(
      (request, done) => this.client.browseRiskRegisters(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      riskRiskRegisterQueryServiceApi.BrowseRiskRegistersRequest.fromPartial({ filter: { ownerId: record.conversationId, region: record.subject }, orderBy: record.message }));
  }
}

/** Reads acme.messaging.v1.ConversationService/GetConversation and hands what it keeps to the sink of its kind. */
export async function relayConversationId(runtime: Runtime): Promise<void> {
  const upstream = new messagingConversationServiceApi.ConversationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<messagingConversationServiceApi.GetConversationRequest, messagingConversationServiceApi.GetConversationResponse>(
    (request, done) => upstream.getConversation(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    messagingConversationServiceApi.GetConversationRequest.fromPartial({ conversationId: "primary-relay-conversation-id" })));
  const row: RelayConversationIdRecord = {
    conversationId: current.conversation?.conversationId ?? "",
    subject: text.normalize(current.conversation?.subject ?? ""),
    message: text.normalize(current.result?.message ?? ""),
  };
  const sinks: RelayConversationIdWriter[] = [
    new RelayConversationIdWorkOrderCalculation(runtime),
    new RelayConversationIdTelemetryReading(runtime),
    new RelayConversationIdRiskRegisterQuery(runtime),
  ];
  await sinks[1]!.push(row);
}
