import * as audiencesAudienceMemberApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as patientsPatientServiceApi from "../../../.cache/proto/acme/patients/v1/patient_service.js";
import * as schedulingShiftServiceApi from "../../../.cache/proto/acme/scheduling/v1/shift_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyShiftsMessage keeps of each SearchShifts response. */
interface CopyShiftsMessageRecord {
  message: string;
  nextPageToken: string;
}

/** Where copyShiftsMessage hands each record. */
interface CopyShiftsMessageWriter {
  push(record: CopyShiftsMessageRecord): Promise<void>;
}

/** Hands records to acme.audiences.v1.AudienceMemberApprovalService. */
class CopyShiftsMessageAudienceMemberApproval implements CopyShiftsMessageWriter {
  private readonly client: audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CopyShiftsMessageRecord): Promise<void> {
    await call<audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusRequest, audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusResponse>(
      (request, done) => this.client.getAudienceMemberApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusRequest.fromPartial({ audienceMemberId: record.nextPageToken }));
  }
}

/** Passes records to acme.patients.v1.PatientService. */
class CopyShiftsMessagePatient implements CopyShiftsMessageWriter {
  private readonly client: patientsPatientServiceApi.PatientServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new patientsPatientServiceApi.PatientServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CopyShiftsMessageRecord): Promise<void> {
    await call<patientsPatientServiceApi.CreatePatientRequest, patientsPatientServiceApi.CreatePatientResponse>(
      (request, done) => this.client.createPatient(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      patientsPatientServiceApi.CreatePatientRequest.fromPartial({ patient: { patientId: record.nextPageToken } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CopyShiftsMessageLogOnly implements CopyShiftsMessageWriter {
  async push(record: CopyShiftsMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchCopyShiftsMessage(kind: string, record: CopyShiftsMessageRecord, runtime: Runtime): Promise<void> {
  let write = (item: CopyShiftsMessageRecord): Promise<void> => new CopyShiftsMessageLogOnly().push(item);
  switch (kind) {
    case "audience-member-approval":
      write = (item) => new CopyShiftsMessageAudienceMemberApproval(runtime).push(item);
      break;
    case "patient":
      write = (item) => new CopyShiftsMessagePatient(runtime).push(item);
      break;
  }
  await write(record);
}

/** Reads acme.scheduling.v1.ShiftService/SearchShifts and hands what it keeps to the sink of its kind. */
export async function copyShiftsMessage(runtime: Runtime): Promise<void> {
  const upstream = new schedulingShiftServiceApi.ShiftServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<schedulingShiftServiceApi.SearchShiftsRequest, schedulingShiftServiceApi.SearchShiftsResponse>(
    (request, done) => upstream.searchShifts(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    schedulingShiftServiceApi.SearchShiftsRequest.fromPartial({ orderBy: "main-copy-shifts-message" }));
  const record: CopyShiftsMessageRecord = {
    message: text.normalize(current.result?.message ?? ""),
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
  };
  await dispatchCopyShiftsMessage("audience-member-approval", record, runtime);
}
