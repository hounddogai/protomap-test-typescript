import * as messagingChatMessageReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_reporting_service.js";
import * as prescriptionsPrescriptionCalculationServiceApi from "../../../.cache/proto/acme/prescriptions/v1/prescription_calculation_service.js";
import * as webbffPageCompositionQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorChatMessageReportMessage keeps of each ShareChatMessageReport response. */
interface MirrorChatMessageReportMessageRecord {
  message: string;
  status: string;
}

/** Where mirrorChatMessageReportMessage hands each record. */
interface MirrorChatMessageReportMessageTarget {
  write(record: MirrorChatMessageReportMessageRecord): Promise<void>;
}

/** Sends records to acme.webbff.v1.PageCompositionQueryService. */
class MirrorChatMessageReportMessagePageCompositionQuery implements MirrorChatMessageReportMessageTarget {
  private readonly client: webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: MirrorChatMessageReportMessageRecord): Promise<void> {
    await call<webbffPageCompositionQueryServiceApi.BrowsePageCompositionsRequest, webbffPageCompositionQueryServiceApi.BrowsePageCompositionsResponse>(
      (request, done) => this.client.browsePageCompositions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webbffPageCompositionQueryServiceApi.BrowsePageCompositionsRequest.fromPartial({ filter: { query: record.message } }));
  }
}

/** Writes records to acme.prescriptions.v1.PrescriptionCalculationService. */
class MirrorChatMessageReportMessagePrescriptionCalculation implements MirrorChatMessageReportMessageTarget {
  private readonly client: prescriptionsPrescriptionCalculationServiceApi.PrescriptionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new prescriptionsPrescriptionCalculationServiceApi.PrescriptionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: MirrorChatMessageReportMessageRecord): Promise<void> {
    await retry(() => call<prescriptionsPrescriptionCalculationServiceApi.EstimatePrescriptionRequest, prescriptionsPrescriptionCalculationServiceApi.EstimatePrescriptionResponse>(
      (request, done) => this.client.estimatePrescription(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      prescriptionsPrescriptionCalculationServiceApi.EstimatePrescriptionRequest.fromPartial({ prescription: { number: record.status } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class MirrorChatMessageReportMessageLogOnly implements MirrorChatMessageReportMessageTarget {
  async write(record: MirrorChatMessageReportMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverMirrorChatMessageReportMessage(kind: string, record: MirrorChatMessageReportMessageRecord, runtime: Runtime): Promise<void> {
  let sink: MirrorChatMessageReportMessageTarget = new MirrorChatMessageReportMessageLogOnly();
  switch (kind) {
    case "page-composition-query":
      sink = new MirrorChatMessageReportMessagePageCompositionQuery(runtime);
      break;
    case "prescription-calculation":
      sink = new MirrorChatMessageReportMessagePrescriptionCalculation(runtime);
      break;
  }
  await sink.write(record);
}

/**
 * Reads acme.messaging.v1.ChatMessageReportingService/ShareChatMessageReport and hands what it keeps to the
 * sink of its kind.
 */
export async function mirrorChatMessageReportMessage(runtime: Runtime): Promise<void> {
  const source = new messagingChatMessageReportingServiceApi.ChatMessageReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<messagingChatMessageReportingServiceApi.ShareChatMessageReportRequest, messagingChatMessageReportingServiceApi.ShareChatMessageReportResponse>(
    (request, done) => source.shareChatMessageReport(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    messagingChatMessageReportingServiceApi.ShareChatMessageReportRequest.fromPartial({ chatMessageId: "primary-mirror-chat-message-report-message" }));
  const record: MirrorChatMessageReportMessageRecord = {
    message: current.outcome?.message ?? "",
    status: current.outcome?.status ?? "",
  };
  await deliverMirrorChatMessageReportMessage("prescription-calculation", record, runtime);
}
