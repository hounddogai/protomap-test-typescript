import * as communityForumApprovalServiceApi from "../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as corporateeventsCorporateEventCalculationServiceApi from "../../../.cache/proto/acme/corporateevents/v1/corporate_event_calculation_service.js";
import * as prescriptionsPrescriptionServiceApi from "../../../.cache/proto/acme/prescriptions/v1/prescription_service.js";
import * as webbffWidgetLayoutServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncPrescriptionNotes keeps of each CreatePrescription response. */
interface SyncPrescriptionNotesRecord {
  notes: string;
  message: string;
}

/** Where syncPrescriptionNotes hands each record. */
interface SyncPrescriptionNotesTarget {
  apply(record: SyncPrescriptionNotesRecord): Promise<void>;
}

/** Hands records to acme.corporateevents.v1.CorporateEventCalculationService. */
class SyncPrescriptionNotesCorporateEventCalculation implements SyncPrescriptionNotesTarget {
  private readonly client: corporateeventsCorporateEventCalculationServiceApi.CorporateEventCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new corporateeventsCorporateEventCalculationServiceApi.CorporateEventCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncPrescriptionNotesRecord): Promise<void> {
    await call<corporateeventsCorporateEventCalculationServiceApi.CalculateCorporateEventRequest, corporateeventsCorporateEventCalculationServiceApi.CalculateCorporateEventResponse>(
      (request, done) => this.client.calculateCorporateEvent(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      corporateeventsCorporateEventCalculationServiceApi.CalculateCorporateEventRequest.fromPartial({ reason: record.notes }));
  }
}

/** Writes records to acme.community.v1.ForumApprovalService. */
class SyncPrescriptionNotesForumApproval implements SyncPrescriptionNotesTarget {
  private readonly client: communityForumApprovalServiceApi.ForumApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityForumApprovalServiceApi.ForumApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncPrescriptionNotesRecord): Promise<void> {
    await call<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse>(
      (request, done) => this.client.submitForum(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      communityForumApprovalServiceApi.SubmitForumRequest.fromPartial({ forum: { forumId: record.notes } }));
  }
}

/** Passes records to acme.webbff.v1.WidgetLayoutService. */
class SyncPrescriptionNotesWidgetLayout implements SyncPrescriptionNotesTarget {
  private readonly client: webbffWidgetLayoutServiceApi.WidgetLayoutServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffWidgetLayoutServiceApi.WidgetLayoutServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncPrescriptionNotesRecord): Promise<void> {
    await call<webbffWidgetLayoutServiceApi.CreateWidgetLayoutRequest, webbffWidgetLayoutServiceApi.CreateWidgetLayoutResponse>(
      (request, done) => this.client.createWidgetLayout(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webbffWidgetLayoutServiceApi.CreateWidgetLayoutRequest.fromPartial({ widgetLayout: { widgetLayoutId: record.message } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class SyncPrescriptionNotesLogOnly implements SyncPrescriptionNotesTarget {
  async apply(record: SyncPrescriptionNotesRecord): Promise<void> {
    console.info("no sink for record", record.notes);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverSyncPrescriptionNotes(kind: string, record: SyncPrescriptionNotesRecord, runtime: Runtime): Promise<void> {
  let sink: SyncPrescriptionNotesTarget = new SyncPrescriptionNotesLogOnly();
  switch (kind) {
    case "corporate-event-calculation":
      sink = new SyncPrescriptionNotesCorporateEventCalculation(runtime);
      break;
    case "forum-approval":
      sink = new SyncPrescriptionNotesForumApproval(runtime);
      break;
    case "widget-layout":
      sink = new SyncPrescriptionNotesWidgetLayout(runtime);
      break;
  }
  await sink.apply(record);
}

/**
 * Reads acme.prescriptions.v1.PrescriptionService/CreatePrescription and hands what it keeps to the sink of
 * its kind.
 */
export async function syncPrescriptionNotes(runtime: Runtime): Promise<void> {
  const upstream = new prescriptionsPrescriptionServiceApi.PrescriptionServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<prescriptionsPrescriptionServiceApi.CreatePrescriptionRequest, prescriptionsPrescriptionServiceApi.CreatePrescriptionResponse>(
    (request, done) => upstream.createPrescription(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    prescriptionsPrescriptionServiceApi.CreatePrescriptionRequest.fromPartial({ requestId: "nightly-sync-prescription-notes" })));
  const row: SyncPrescriptionNotesRecord = {
    notes: found.prescription?.notes ?? "",
    message: found.result?.message ?? "",
  };
  await deliverSyncPrescriptionNotes("forum-approval", row, runtime);
}
