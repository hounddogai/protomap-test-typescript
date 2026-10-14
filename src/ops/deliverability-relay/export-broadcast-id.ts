import * as broadcastsBroadcastQueryServiceApi from "../../../.cache/proto/acme/broadcasts/v1/broadcast_query_service.js";
import * as chatHandoffReportingServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as formsFormFieldApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportBroadcastId keeps of each LookupBroadcast response. */
interface ExportBroadcastIdRecord {
  broadcastId: string;
  title: string;
  status: string;
  correlationId: string;
}

/** Where exportBroadcastId hands each record. */
interface ExportBroadcastIdWriter {
  send(record: ExportBroadcastIdRecord): Promise<void>;
}

/** Writes records to acme.forms.v1.FormFieldApprovalService. */
class ExportBroadcastIdFormFieldApproval implements ExportBroadcastIdWriter {
  private readonly client: formsFormFieldApprovalServiceApi.FormFieldApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormFieldApprovalServiceApi.FormFieldApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportBroadcastIdRecord): Promise<void> {
    await call<formsFormFieldApprovalServiceApi.ApproveFormFieldRequest, formsFormFieldApprovalServiceApi.ApproveFormFieldResponse>(
      (request, done) => this.client.approveFormField(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      formsFormFieldApprovalServiceApi.ApproveFormFieldRequest.fromPartial({ details: { comment: record.correlationId } }));
  }
}

/** Hands records to acme.chat.v1.HandoffReportingService. */
class ExportBroadcastIdHandoffReporting implements ExportBroadcastIdWriter {
  private readonly client: chatHandoffReportingServiceApi.HandoffReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatHandoffReportingServiceApi.HandoffReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportBroadcastIdRecord): Promise<void> {
    await call<chatHandoffReportingServiceApi.ScheduleHandoffReportRequest, chatHandoffReportingServiceApi.ScheduleHandoffReportResponse>(
      (request, done) => this.client.scheduleHandoffReport(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      chatHandoffReportingServiceApi.ScheduleHandoffReportRequest.fromPartial({ details: { format: record.status } }));
  }
}

/**
 * Reads acme.broadcasts.v1.BroadcastQueryService/LookupBroadcast and hands what it keeps to the sink of its
 * kind.
 */
export async function exportBroadcastId(runtime: Runtime): Promise<void> {
  const upstream = new broadcastsBroadcastQueryServiceApi.BroadcastQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<broadcastsBroadcastQueryServiceApi.LookupBroadcastRequest, broadcastsBroadcastQueryServiceApi.LookupBroadcastResponse>(
    (request, done) => upstream.lookupBroadcast(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    broadcastsBroadcastQueryServiceApi.LookupBroadcastRequest.fromPartial({ broadcastId: "default-export-broadcast-id" })));
  const kept: ExportBroadcastIdRecord = {
    broadcastId: found.broadcast?.broadcastId ?? "",
    title: found.broadcast?.title ?? "",
    status: text.normalize(found.result?.status ?? ""),
    correlationId: found.result?.correlationId ?? "",
  };
  const entries: Array<{ kind: string; sink: ExportBroadcastIdWriter }> = [
    { kind: "form-field-approval", sink: new ExportBroadcastIdFormFieldApproval(runtime) },
    { kind: "handoff-reporting", sink: new ExportBroadcastIdHandoffReporting(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "form-field-approval") continue;
    await entry.sink.send(kept);
  }
}
