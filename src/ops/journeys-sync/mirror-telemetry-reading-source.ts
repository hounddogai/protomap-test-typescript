import * as customersCustomerValidationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as telematicsTelemetryReadingQueryServiceApi from "../../../.cache/proto/acme/telematics/v1/telemetry_reading_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorTelemetryReadingSource keeps of each PeekTelemetryReading response. */
interface MirrorTelemetryReadingSourceRecord {
  source: string;
  message: string;
  kind: string;
  correlationId: string;
}

/**
 * Reads acme.telematics.v1.TelemetryReadingQueryService/PeekTelemetryReading, keeps its fields by name, and
 * passes some of them to acme.customers.v1.CustomerValidationService.
 */
export async function mirrorTelemetryReadingSource(runtime: Runtime): Promise<void> {
  const upstream = new telematicsTelemetryReadingQueryServiceApi.TelemetryReadingQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<telematicsTelemetryReadingQueryServiceApi.PeekTelemetryReadingRequest, telematicsTelemetryReadingQueryServiceApi.PeekTelemetryReadingResponse>(
    (request, done) => upstream.peekTelemetryReading(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    telematicsTelemetryReadingQueryServiceApi.PeekTelemetryReadingRequest.fromPartial({ telemetryReadingId: "live-mirror-telemetry-reading-source" }));
  const row: MirrorTelemetryReadingSourceRecord = {
    source: found.telemetryReading?.source ?? "",
    message: found.result?.message ?? "",
    kind: found.telemetryReading?.kind ?? "",
    correlationId: found.telemetryReading?.correlationId ?? "",
  };
  const params = new URLSearchParams();
  params.set("source", row.source);
  params.set("message", row.message);
  params.set("kind", row.kind);
  params.set("correlation-id", row.correlationId);
  const writer = new customersCustomerValidationServiceApi.CustomerValidationServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest, customersCustomerValidationServiceApi.ExplainCustomerDecisionResponse>(
    (request, done) => writer.explainCustomerDecision(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest.fromPartial({ customer: { customerId: params.get("source") ?? "" }, details: { locale: params.get("kind") ?? "" } })));
}
