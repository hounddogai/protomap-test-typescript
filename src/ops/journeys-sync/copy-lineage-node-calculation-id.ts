import * as lineageLineageNodeCalculationServiceApi from "../../../.cache/proto/acme/lineage/v1/lineage_node_calculation_service.js";
import * as ticketingTicketQueryServiceApi from "../../../.cache/proto/acme/ticketing/v1/ticket_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyLineageNodeCalculationId keeps of each ExplainLineageNodeCalculation response. */
interface CopyLineageNodeCalculationIdRecord {
  correlationId: string;
  referenceId: string;
}

/** Where copyLineageNodeCalculationId hands each record. */
interface CopyLineageNodeCalculationIdDestination {
  send(record: CopyLineageNodeCalculationIdRecord): Promise<void>;
}

/** Writes records to acme.ticketing.v1.TicketQueryService. */
class CopyLineageNodeCalculationIdTicketQuery implements CopyLineageNodeCalculationIdDestination {
  private readonly client: ticketingTicketQueryServiceApi.TicketQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ticketingTicketQueryServiceApi.TicketQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CopyLineageNodeCalculationIdRecord): Promise<void> {
    await retry(() => call<ticketingTicketQueryServiceApi.FindTicketsRequest, ticketingTicketQueryServiceApi.FindTicketsResponse>(
      (request, done) => this.client.findTickets(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      ticketingTicketQueryServiceApi.FindTicketsRequest.fromPartial({ filter: { region: record.referenceId, query: record.correlationId } })));
  }
}

/**
 * Reads acme.lineage.v1.LineageNodeCalculationService/ExplainLineageNodeCalculation and hands what it keeps
 * to acme.ticketing.v1.TicketQueryService.
 */
export async function copyLineageNodeCalculationId(runtime: Runtime): Promise<void> {
  const reader = new lineageLineageNodeCalculationServiceApi.LineageNodeCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<lineageLineageNodeCalculationServiceApi.ExplainLineageNodeCalculationRequest, lineageLineageNodeCalculationServiceApi.ExplainLineageNodeCalculationResponse>(
    (request, done) => reader.explainLineageNodeCalculation(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    lineageLineageNodeCalculationServiceApi.ExplainLineageNodeCalculationRequest.fromPartial({ reason: "primary-copy-lineage-node-calculation-id" }));
  const row: CopyLineageNodeCalculationIdRecord = {
    correlationId: response.result?.correlationId ?? "",
    referenceId: text.normalize(response.outcome?.referenceId ?? ""),
  };
  await new CopyLineageNodeCalculationIdTicketQuery(runtime).send(row);
}
