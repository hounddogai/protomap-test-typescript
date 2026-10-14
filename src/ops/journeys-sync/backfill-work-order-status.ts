import * as budgetingBudgetQueryServiceApi from "../../../.cache/proto/acme/budgeting/v1/budget_query_service.js";
import * as maintenanceWorkOrderCalculationServiceApi from "../../../.cache/proto/acme/maintenance/v1/work_order_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillWorkOrderStatus keeps of each CalculateWorkOrder response. */
interface BackfillWorkOrderStatusRecord {
  status: string;
  currencyCode: string;
  message: string;
  subject: string;
}

/**
 * Reads acme.maintenance.v1.WorkOrderCalculationService/CalculateWorkOrder, keeps its fields by name, and
 * passes some of them to acme.budgeting.v1.BudgetQueryService.
 */
export async function backfillWorkOrderStatus(runtime: Runtime): Promise<void> {
  const origin = new maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<maintenanceWorkOrderCalculationServiceApi.CalculateWorkOrderRequest, maintenanceWorkOrderCalculationServiceApi.CalculateWorkOrderResponse>(
    (request, done) => origin.calculateWorkOrder(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    maintenanceWorkOrderCalculationServiceApi.CalculateWorkOrderRequest.fromPartial({ workOrderId: "current-backfill-work-order-status" }));
  const record: BackfillWorkOrderStatusRecord = {
    status: current.result?.status ?? "",
    currencyCode: current.breakdown?.currencyCode ?? "",
    message: current.result?.message ?? "",
    subject: current.workOrder?.subject ?? "",
  };
  const carried = new URLSearchParams();
  carried.set("status", record.status);
  carried.set("currency-code", record.currencyCode);
  carried.set("message", record.message);
  carried.set("subject", record.subject);
  const target = new budgetingBudgetQueryServiceApi.BudgetQueryServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<budgetingBudgetQueryServiceApi.SummarizeBudgetsRequest, budgetingBudgetQueryServiceApi.SummarizeBudgetsResponse>(
    (request, done) => target.summarizeBudgets(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    budgetingBudgetQueryServiceApi.SummarizeBudgetsRequest.fromPartial({ details: { format: carried.get("subject") ?? "" }, budgetId: carried.get("message") ?? "" })));
}
