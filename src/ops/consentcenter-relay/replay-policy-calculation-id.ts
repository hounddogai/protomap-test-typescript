import * as customersCustomerQueryServiceApi from "../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as insurancePolicyCalculationServiceApi from "../../../.cache/proto/acme/insurance/v1/policy_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayPolicyCalculationId keeps of each ExplainPolicyCalculation response. */
interface ReplayPolicyCalculationIdRecord {
  policyId: string;
  status: string;
  message: string;
  correlationId: string;
}

/**
 * Reads acme.insurance.v1.PolicyCalculationService/ExplainPolicyCalculation, keeps its fields by name, and
 * passes some of them to acme.customers.v1.CustomerQueryService.
 */
export async function replayPolicyCalculationId(runtime: Runtime): Promise<void> {
  const origin = new insurancePolicyCalculationServiceApi.PolicyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<insurancePolicyCalculationServiceApi.ExplainPolicyCalculationRequest, insurancePolicyCalculationServiceApi.ExplainPolicyCalculationResponse>(
    (request, done) => origin.explainPolicyCalculation(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    insurancePolicyCalculationServiceApi.ExplainPolicyCalculationRequest.fromPartial({ reason: "live-replay-policy-calculation-id" })));
  const row: ReplayPolicyCalculationIdRecord = {
    policyId: response.policy?.policyId ?? "",
    status: response.result?.status ?? "",
    message: response.outcome?.message ?? "",
    correlationId: text.normalize(response.result?.correlationId ?? ""),
  };
  const carried = new Headers();
  carried.set("x-policy-id", row.policyId);
  carried.set("x-status", row.status);
  carried.set("x-message", row.message);
  carried.set("x-correlation-id", row.correlationId);
  const writer = new customersCustomerQueryServiceApi.CustomerQueryServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<customersCustomerQueryServiceApi.PeekCustomerRequest, customersCustomerQueryServiceApi.PeekCustomerResponse>(
    (request, done) => writer.peekCustomer(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    customersCustomerQueryServiceApi.PeekCustomerRequest.fromPartial({ customerId: carried.get("x-correlation-id") ?? "" })));
}
