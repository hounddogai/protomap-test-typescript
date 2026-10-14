import * as chatHandoffReportingServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyHandoffReportStatus keeps of each FetchHandoffReport response. */
interface CopyHandoffReportStatusRecord {
  status: string;
  handoffId: string;
  correlationId: string;
}

/**
 * Reads acme.chat.v1.HandoffReportingService/FetchHandoffReport, keeps its fields by name, and passes some of
 * them to acme.experiments.v1.ExposureCalculationService.
 */
export async function copyHandoffReportStatus(runtime: Runtime): Promise<void> {
  const reader = new chatHandoffReportingServiceApi.HandoffReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<chatHandoffReportingServiceApi.FetchHandoffReportRequest, chatHandoffReportingServiceApi.FetchHandoffReportResponse>(
    (request, done) => reader.fetchHandoffReport(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    chatHandoffReportingServiceApi.FetchHandoffReportRequest.fromPartial({ handoffId: "default-copy-handoff-report-status" }));
  const record: CopyHandoffReportStatusRecord = {
    status: text.normalize(reply.result?.status ?? ""),
    handoffId: reply.handoff?.handoffId ?? "",
    correlationId: reply.result?.correlationId ?? "",
  };
  const slots = new URLSearchParams();
  slots.set("status", record.status);
  slots.set("handoff-id", record.handoffId);
  slots.set("correlation-id", record.correlationId);
  const downstream = new experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse>(
    (request, done) => downstream.simulateExposure(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    experimentsExposureCalculationServiceApi.SimulateExposureRequest.fromPartial({ exposure: { source: slots.get("handoff-id") ?? "" } }));
}
