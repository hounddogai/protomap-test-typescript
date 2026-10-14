import * as experimentsVariantSyncServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as messagingConversationWorkflowServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_workflow_service.js";
import * as patientappPatientHomeServiceApi from "../../../.cache/proto/acme/patientapp/v1/patient_home_service.js";
import * as pricingPriceListServiceApi from "../../../.cache/proto/acme/pricing/v1/price_list_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportConversationWorkflowId keeps of each StartConversationWorkflow response. */
interface ExportConversationWorkflowIdRecord {
  conversationId: string;
  message: string;
  resultMessage: string;
  referenceId: string;
}

/** Where exportConversationWorkflowId hands each record. */
interface ExportConversationWorkflowIdTarget {
  deliver(record: ExportConversationWorkflowIdRecord): Promise<void>;
}

/** Writes records to acme.patientapp.v1.PatientHomeService. */
class ExportConversationWorkflowIdPatientHome implements ExportConversationWorkflowIdTarget {
  private readonly client: patientappPatientHomeServiceApi.PatientHomeServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new patientappPatientHomeServiceApi.PatientHomeServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportConversationWorkflowIdRecord): Promise<void> {
    await retry(() => call<patientappPatientHomeServiceApi.DeletePatientHomeRequest, patientappPatientHomeServiceApi.DeletePatientHomeResponse>(
      (request, done) => this.client.deletePatientHome(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      patientappPatientHomeServiceApi.DeletePatientHomeRequest.fromPartial({ etag: record.referenceId, reason: record.message, patientHomeId: record.resultMessage })));
  }
}

/** Writes records to acme.pricing.v1.PriceListService. */
class ExportConversationWorkflowIdPriceList implements ExportConversationWorkflowIdTarget {
  private readonly client: pricingPriceListServiceApi.PriceListServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new pricingPriceListServiceApi.PriceListServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportConversationWorkflowIdRecord): Promise<void> {
    await call<pricingPriceListServiceApi.UpdatePriceListRequest, pricingPriceListServiceApi.UpdatePriceListResponse>(
      (request, done) => this.client.updatePriceList(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      pricingPriceListServiceApi.UpdatePriceListRequest.fromPartial({ priceList: { priceListId: record.message, name: record.conversationId, description: record.resultMessage } }));
  }
}

/** Writes records to acme.experiments.v1.VariantSyncService. */
class ExportConversationWorkflowIdVariantSync implements ExportConversationWorkflowIdTarget {
  private readonly client: experimentsVariantSyncServiceApi.VariantSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantSyncServiceApi.VariantSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportConversationWorkflowIdRecord): Promise<void> {
    await call<experimentsVariantSyncServiceApi.ResolveVariantConflictRequest, experimentsVariantSyncServiceApi.ResolveVariantConflictResponse>(
      (request, done) => this.client.resolveVariantConflict(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsVariantSyncServiceApi.ResolveVariantConflictRequest.fromPartial({ variant: { description: record.conversationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ExportConversationWorkflowIdLogOnly implements ExportConversationWorkflowIdTarget {
  async deliver(record: ExportConversationWorkflowIdRecord): Promise<void> {
    console.info("no sink for record", record.conversationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchExportConversationWorkflowId(kind: string, record: ExportConversationWorkflowIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: ExportConversationWorkflowIdRecord): Promise<void> => new ExportConversationWorkflowIdLogOnly().deliver(item);
  switch (kind) {
    case "patient-home":
      write = (item) => new ExportConversationWorkflowIdPatientHome(runtime).deliver(item);
      break;
    case "price-list":
      write = (item) => new ExportConversationWorkflowIdPriceList(runtime).deliver(item);
      break;
    case "variant-sync":
      write = (item) => new ExportConversationWorkflowIdVariantSync(runtime).deliver(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.messaging.v1.ConversationWorkflowService/StartConversationWorkflow and hands what it keeps to
 * the sink of its kind.
 */
export async function exportConversationWorkflowId(runtime: Runtime): Promise<void> {
  const origin = new messagingConversationWorkflowServiceApi.ConversationWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<messagingConversationWorkflowServiceApi.StartConversationWorkflowRequest, messagingConversationWorkflowServiceApi.StartConversationWorkflowResponse>(
    (request, done) => origin.startConversationWorkflow(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    messagingConversationWorkflowServiceApi.StartConversationWorkflowRequest.fromPartial({ reason: "nightly-export-conversation-workflow-id" }));
  const kept: ExportConversationWorkflowIdRecord = {
    conversationId: text.normalize(current.conversation?.conversationId ?? ""),
    message: current.outcome?.message ?? "",
    resultMessage: current.result?.message ?? "",
    referenceId: current.outcome?.referenceId ?? "",
  };
  await dispatchExportConversationWorkflowId("patient-home", kept, runtime);
}
