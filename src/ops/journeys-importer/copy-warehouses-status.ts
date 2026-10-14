import * as careplansCarePlanCalculationServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_calculation_service.js";
import * as warehousingWarehouseQueryServiceApi from "../../../.cache/proto/acme/warehousing/v1/warehouse_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyWarehousesStatus keeps of each FindWarehouses response. */
interface CopyWarehousesStatusRecord {
  status: string;
  correlationId: string;
  message: string;
}

/**
 * Reads acme.warehousing.v1.WarehouseQueryService/FindWarehouses, keeps its fields by name, and passes some
 * of them to acme.careplans.v1.CarePlanCalculationService.
 */
export async function copyWarehousesStatus(runtime: Runtime): Promise<void> {
  const upstream = new warehousingWarehouseQueryServiceApi.WarehouseQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<warehousingWarehouseQueryServiceApi.FindWarehousesRequest, warehousingWarehouseQueryServiceApi.FindWarehousesResponse>(
    (request, done) => upstream.findWarehouses(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    warehousingWarehouseQueryServiceApi.FindWarehousesRequest.fromPartial({ orderBy: "live-copy-warehouses-status" })));
  const entry: CopyWarehousesStatusRecord = {
    status: text.normalize(current.result?.status ?? ""),
    correlationId: current.result?.correlationId ?? "",
    message: current.result?.message ?? "",
  };
  const fields = new Headers();
  fields.set("x-status", entry.status);
  fields.set("x-correlation-id", entry.correlationId);
  fields.set("x-message", entry.message);
  const downstream = new careplansCarePlanCalculationServiceApi.CarePlanCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<careplansCarePlanCalculationServiceApi.CalculateCarePlanRequest, careplansCarePlanCalculationServiceApi.CalculateCarePlanResponse>(
    (request, done) => downstream.calculateCarePlan(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    careplansCarePlanCalculationServiceApi.CalculateCarePlanRequest.fromPartial({ carePlan: { carePlanId: fields.get("x-status") ?? "" } }));
}
