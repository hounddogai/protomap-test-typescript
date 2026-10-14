import * as cartCartCalculationServiceApi from "../../../.cache/proto/acme/cart/v1/cart_calculation_service.js";
import * as routingRouteCalculationServiceApi from "../../../.cache/proto/acme/routing/v1/route_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncCartId keeps of each CalculateCart response. */
interface SyncCartIdRecord {
  correlationId: string;
  currencyCode: string;
  status: string;
}

/**
 * Reads acme.cart.v1.CartCalculationService/CalculateCart, keeps its fields by name, and passes some of them
 * to acme.routing.v1.RouteCalculationService.
 */
export async function syncCartId(runtime: Runtime): Promise<void> {
  const source = new cartCartCalculationServiceApi.CartCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<cartCartCalculationServiceApi.CalculateCartRequest, cartCartCalculationServiceApi.CalculateCartResponse>(
    (request, done) => source.calculateCart(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    cartCartCalculationServiceApi.CalculateCartRequest.fromPartial({ reason: "default-sync-cart-id" }));
  const entry: SyncCartIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    currencyCode: reply.breakdown?.currencyCode ?? "",
    status: reply.result?.status ?? "",
  };
  const carried = new URLSearchParams();
  carried.set("correlation-id", entry.correlationId);
  carried.set("currency-code", entry.currencyCode);
  carried.set("status", entry.status);
  const writer = new routingRouteCalculationServiceApi.RouteCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<routingRouteCalculationServiceApi.CalculateRouteRequest, routingRouteCalculationServiceApi.CalculateRouteResponse>(
    (request, done) => writer.calculateRoute(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    routingRouteCalculationServiceApi.CalculateRouteRequest.fromPartial({ route: { routeId: carried.get("currency-code") ?? "" } })));
}
