import * as maintenanceWorkOrderCalculationServiceApi from "../../../.cache/proto/acme/maintenance/v1/work_order_calculation_service.js";
import * as showsShowCalculationServiceApi from "../../../.cache/proto/acme/shows/v1/show_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillShowRatesTitle keeps of each GetShowRates response. */
interface BackfillShowRatesTitleRecord {
  title: string;
  correlationId: string;
  message: string;
}

/**
 * Reads acme.shows.v1.ShowCalculationService/GetShowRates, keeps its fields by name, and passes some of them
 * to acme.maintenance.v1.WorkOrderCalculationService.
 */
export async function backfillShowRatesTitle(runtime: Runtime): Promise<void> {
  const origin = new showsShowCalculationServiceApi.ShowCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<showsShowCalculationServiceApi.GetShowRatesRequest, showsShowCalculationServiceApi.GetShowRatesResponse>(
    (request, done) => origin.getShowRates(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    showsShowCalculationServiceApi.GetShowRatesRequest.fromPartial({ showId: "default-backfill-show-rates-title" }));
  const entry: BackfillShowRatesTitleRecord = {
    title: found.show?.title ?? "",
    correlationId: found.result?.correlationId ?? "",
    message: found.result?.message ?? "",
  };
  const fields = new URLSearchParams();
  fields.set("title", entry.title);
  fields.set("correlation-id", entry.correlationId);
  fields.set("message", entry.message);
  const downstream = new maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<maintenanceWorkOrderCalculationServiceApi.SimulateWorkOrderRequest, maintenanceWorkOrderCalculationServiceApi.SimulateWorkOrderResponse>(
    (request, done) => downstream.simulateWorkOrder(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    maintenanceWorkOrderCalculationServiceApi.SimulateWorkOrderRequest.fromPartial({ workOrder: { subject: fields.get("message") ?? "" }, details: { currencyCode: fields.get("title") ?? "" } })));
}
