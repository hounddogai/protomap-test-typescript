import * as cartCartCalculationServiceApi from "../../../.cache/proto/acme/cart/v1/cart_calculation_service.js";
import * as webbffClientSessionNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncClientSessionUpdatesStatus keeps of each UnsubscribeClientSessionUpdates response. */
interface SyncClientSessionUpdatesStatusRecord {
  status: string;
  referenceId: string;
}

/** Where syncClientSessionUpdatesStatus hands each record. */
interface SyncClientSessionUpdatesStatusTarget {
  deliver(record: SyncClientSessionUpdatesStatusRecord): Promise<void>;
}

/** Hands records to acme.cart.v1.CartCalculationService. */
class SyncClientSessionUpdatesStatusCartCalculation implements SyncClientSessionUpdatesStatusTarget {
  private readonly client: cartCartCalculationServiceApi.CartCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new cartCartCalculationServiceApi.CartCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncClientSessionUpdatesStatusRecord): Promise<void> {
    await call<cartCartCalculationServiceApi.CalculateCartRequest, cartCartCalculationServiceApi.CalculateCartResponse>(
      (request, done) => this.client.calculateCart(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      cartCartCalculationServiceApi.CalculateCartRequest.fromPartial({ cartId: record.referenceId, details: { currencyCode: record.status } }));
  }
}

/**
 * Reads acme.webbff.v1.ClientSessionNotificationService/UnsubscribeClientSessionUpdates and hands what it
 * keeps to acme.cart.v1.CartCalculationService.
 */
export async function syncClientSessionUpdatesStatus(runtime: Runtime): Promise<void> {
  const upstream = new webbffClientSessionNotificationServiceApi.ClientSessionNotificationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesRequest, webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesResponse>(
    (request, done) => upstream.unsubscribeClientSessionUpdates(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    webbffClientSessionNotificationServiceApi.UnsubscribeClientSessionUpdatesRequest.fromPartial({ clientSessionId: "primary-sync-client-session-updates-status" }));
  const record: SyncClientSessionUpdatesStatusRecord = {
    status: found.result?.status ?? "",
    referenceId: found.outcome?.referenceId ?? "",
  };
  await new SyncClientSessionUpdatesStatusCartCalculation(runtime).deliver(record);
}
