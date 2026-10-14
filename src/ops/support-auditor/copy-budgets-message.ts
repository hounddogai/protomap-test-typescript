import * as budgetingBudgetQueryServiceApi from "../../../.cache/proto/acme/budgeting/v1/budget_query_service.js";
import * as careplansCarePlanCalculationServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyBudgetsMessage keeps of each SuggestBudgets response. */
interface CopyBudgetsMessageRecord {
  message: string;
  correlationId: string;
  status: string;
  nextPageToken: string;
}

/**
 * Reads acme.budgeting.v1.BudgetQueryService/SuggestBudgets, keeps its fields by name, and passes some of
 * them to acme.careplans.v1.CarePlanCalculationService.
 */
export async function copyBudgetsMessage(runtime: Runtime): Promise<void> {
  const source = new budgetingBudgetQueryServiceApi.BudgetQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<budgetingBudgetQueryServiceApi.SuggestBudgetsRequest, budgetingBudgetQueryServiceApi.SuggestBudgetsResponse>(
    (request, done) => source.suggestBudgets(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    budgetingBudgetQueryServiceApi.SuggestBudgetsRequest.fromPartial({ orderBy: "default-copy-budgets-message" }));
  const entry: CopyBudgetsMessageRecord = {
    message: current.result?.message ?? "",
    correlationId: current.result?.correlationId ?? "",
    status: current.result?.status ?? "",
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
  };
  const params = new URLSearchParams();
  params.set("message", entry.message);
  params.set("correlation-id", entry.correlationId);
  params.set("status", entry.status);
  params.set("next-page-token", entry.nextPageToken);
  const target = new careplansCarePlanCalculationServiceApi.CarePlanCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<careplansCarePlanCalculationServiceApi.CompareCarePlanOptionsRequest, careplansCarePlanCalculationServiceApi.CompareCarePlanOptionsResponse>(
    (request, done) => target.compareCarePlanOptions(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    careplansCarePlanCalculationServiceApi.CompareCarePlanOptionsRequest.fromPartial({ carePlan: { notes: params.get("next-page-token") ?? "" }, reason: params.get("correlation-id") ?? "" }));
}
