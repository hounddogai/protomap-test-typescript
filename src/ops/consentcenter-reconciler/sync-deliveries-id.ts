import * as deliveriesDeliveryQueryServiceApi from "../../../.cache/proto/acme/deliveries/v1/delivery_query_service.js";
import * as fanportalFanSessionQueryServiceApi from "../../../.cache/proto/acme/fanportal/v1/fan_session_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncDeliveriesId keeps of each CountDeliveries response. */
interface SyncDeliveriesIdRecord {
  correlationId: string;
  message: string;
  status: string;
}

/**
 * Reads acme.deliveries.v1.DeliveryQueryService/CountDeliveries, keeps its fields by name, and passes some of
 * them to acme.fanportal.v1.FanSessionQueryService.
 */
export async function syncDeliveriesId(runtime: Runtime): Promise<void> {
  const origin = new deliveriesDeliveryQueryServiceApi.DeliveryQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<deliveriesDeliveryQueryServiceApi.CountDeliveriesRequest, deliveriesDeliveryQueryServiceApi.CountDeliveriesResponse>(
    (request, done) => origin.countDeliveries(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    deliveriesDeliveryQueryServiceApi.CountDeliveriesRequest.fromPartial({ orderBy: "main-sync-deliveries-id" })));
  const row: SyncDeliveriesIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    message: reply.result?.message ?? "",
    status: reply.result?.status ?? "",
  };
  const carried = new URLSearchParams();
  carried.set("correlation-id", row.correlationId);
  carried.set("message", row.message);
  carried.set("status", row.status);
  const writer = new fanportalFanSessionQueryServiceApi.FanSessionQueryServiceClient(runtime.mesh, credentials.createInsecure());
  await call<fanportalFanSessionQueryServiceApi.CountFanSessionsRequest, fanportalFanSessionQueryServiceApi.CountFanSessionsResponse>(
    (request, done) => writer.countFanSessions(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    fanportalFanSessionQueryServiceApi.CountFanSessionsRequest.fromPartial({ filter: { region: carried.get("message") ?? "" } }));
}
