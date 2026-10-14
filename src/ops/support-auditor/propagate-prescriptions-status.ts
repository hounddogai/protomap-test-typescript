import * as experimentsExperimentWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as messagingChatMessageReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_reporting_service.js";
import * as prescriptionsPrescriptionServiceApi from "../../../.cache/proto/acme/prescriptions/v1/prescription_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagatePrescriptionsStatus keeps of each ListPrescriptions response. */
interface PropagatePrescriptionsStatusRecord {
  status: string;
  correlationId: string;
  nextPageToken: string;
  message: string;
}

/** Where propagatePrescriptionsStatus hands each record. */
interface PropagatePrescriptionsStatusWriter {
  forward(record: PropagatePrescriptionsStatusRecord): Promise<void>;
}

/** Hands records to acme.experiments.v1.ExperimentWorkflowService. */
class PropagatePrescriptionsStatusExperimentWorkflow implements PropagatePrescriptionsStatusWriter {
  private readonly client: experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagatePrescriptionsStatusRecord): Promise<void> {
    await retry(() => call<experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowResponse>(
      (request, done) => this.client.advanceExperimentWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowRequest.fromPartial({ details: { step: record.correlationId } })));
  }
}

/** Writes records to acme.messaging.v1.ChatMessageReportingService. */
class PropagatePrescriptionsStatusChatMessageReporting implements PropagatePrescriptionsStatusWriter {
  private readonly client: messagingChatMessageReportingServiceApi.ChatMessageReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageReportingServiceApi.ChatMessageReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagatePrescriptionsStatusRecord): Promise<void> {
    await call<messagingChatMessageReportingServiceApi.FetchChatMessageReportRequest, messagingChatMessageReportingServiceApi.FetchChatMessageReportResponse>(
      (request, done) => this.client.fetchChatMessageReport(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingChatMessageReportingServiceApi.FetchChatMessageReportRequest.fromPartial({ chatMessageId: record.correlationId }));
  }
}

/**
 * Reads acme.prescriptions.v1.PrescriptionService/ListPrescriptions and hands what it keeps to the sink of
 * its kind.
 */
export async function propagatePrescriptionsStatus(runtime: Runtime): Promise<void> {
  const source = new prescriptionsPrescriptionServiceApi.PrescriptionServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<prescriptionsPrescriptionServiceApi.ListPrescriptionsRequest, prescriptionsPrescriptionServiceApi.ListPrescriptionsResponse>(
    (request, done) => source.listPrescriptions(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    prescriptionsPrescriptionServiceApi.ListPrescriptionsRequest.fromPartial({ orderBy: "live-propagate-prescriptions-status" }));
  const record: PropagatePrescriptionsStatusRecord = {
    status: response.result?.status ?? "",
    correlationId: response.result?.correlationId ?? "",
    nextPageToken: text.normalize(response.pageInfo?.nextPageToken ?? ""),
    message: response.result?.message ?? "",
  };
  const sinks: PropagatePrescriptionsStatusWriter[] = [
    new PropagatePrescriptionsStatusExperimentWorkflow(runtime),
    new PropagatePrescriptionsStatusChatMessageReporting(runtime),
  ];
  for (const sink of sinks) {
    await sink.forward(record);
  }
}
