import * as lendingLoanApplicationCalculationServiceApi from "../../../.cache/proto/acme/lending/v1/loan_application_calculation_service.js";
import * as modelregistryRegisteredModelQueryServiceApi from "../../../.cache/proto/acme/modelregistry/v1/registered_model_query_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayRegisteredModelStatus keeps of each LookupRegisteredModel response. */
interface ReplayRegisteredModelStatusRecord {
  status: string;
  name: string;
  registeredModelId: string;
  message: string;
}

/** Where replayRegisteredModelStatus hands each record. */
interface ReplayRegisteredModelStatusTarget {
  push(record: ReplayRegisteredModelStatusRecord): Promise<void>;
}

/** Writes records to acme.personalization.v1.AffinityApprovalService. */
class ReplayRegisteredModelStatusAffinityApproval implements ReplayRegisteredModelStatusTarget {
  private readonly client: personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayRegisteredModelStatusRecord): Promise<void> {
    await call<personalizationAffinityApprovalServiceApi.RejectAffinityRequest, personalizationAffinityApprovalServiceApi.RejectAffinityResponse>(
      (request, done) => this.client.rejectAffinity(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationAffinityApprovalServiceApi.RejectAffinityRequest.fromPartial({ affinity: { correlationId: record.status } }));
  }
}

/** Writes records to acme.lending.v1.LoanApplicationCalculationService. */
class ReplayRegisteredModelStatusLoanApplicationCalculation implements ReplayRegisteredModelStatusTarget {
  private readonly client: lendingLoanApplicationCalculationServiceApi.LoanApplicationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new lendingLoanApplicationCalculationServiceApi.LoanApplicationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayRegisteredModelStatusRecord): Promise<void> {
    await call<lendingLoanApplicationCalculationServiceApi.CalculateLoanApplicationRequest, lendingLoanApplicationCalculationServiceApi.CalculateLoanApplicationResponse>(
      (request, done) => this.client.calculateLoanApplication(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      lendingLoanApplicationCalculationServiceApi.CalculateLoanApplicationRequest.fromPartial({ reason: record.status, loanApplication: { notes: record.message } }));
  }
}

/**
 * Reads acme.modelregistry.v1.RegisteredModelQueryService/LookupRegisteredModel and hands what it keeps to
 * the sink of its kind.
 */
export async function replayRegisteredModelStatus(runtime: Runtime): Promise<void> {
  const upstream = new modelregistryRegisteredModelQueryServiceApi.RegisteredModelQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<modelregistryRegisteredModelQueryServiceApi.LookupRegisteredModelRequest, modelregistryRegisteredModelQueryServiceApi.LookupRegisteredModelResponse>(
    (request, done) => upstream.lookupRegisteredModel(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    modelregistryRegisteredModelQueryServiceApi.LookupRegisteredModelRequest.fromPartial({ registeredModelId: "live-replay-registered-model-status" }));
  const entry: ReplayRegisteredModelStatusRecord = {
    status: text.normalize(response.result?.status ?? ""),
    name: response.registeredModel?.name ?? "",
    registeredModelId: response.registeredModel?.registeredModelId ?? "",
    message: text.normalize(response.result?.message ?? ""),
  };
  const sinks = new Map<string, ReplayRegisteredModelStatusTarget>();
  sinks.set("affinity-approval", new ReplayRegisteredModelStatusAffinityApproval(runtime));
  sinks.set("loan-application-calculation", new ReplayRegisteredModelStatusLoanApplicationCalculation(runtime));
  await sinks.get("affinity-approval")!.push(entry);
}
