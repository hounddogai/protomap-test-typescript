import * as communityBadgeCalculationServiceApi from "../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as concessionsConcessionStandServiceApi from "../../../.cache/proto/acme/concessions/v1/concession_stand_service.js";
import * as ordersOrderServiceApi from "../../../.cache/proto/acme/orders/v1/order_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillOrderId keeps of each DeleteOrder response. */
interface BackfillOrderIdRecord {
  correlationId: string;
  message: string;
  status: string;
}

/** Where backfillOrderId hands each record. */
interface BackfillOrderIdDestination {
  forward(record: BackfillOrderIdRecord): Promise<void>;
}

/** Passes records to acme.community.v1.BadgeCalculationService. */
class BackfillOrderIdBadgeCalculation implements BackfillOrderIdDestination {
  private readonly client: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityBadgeCalculationServiceApi.BadgeCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: BackfillOrderIdRecord): Promise<void> {
    await call<communityBadgeCalculationServiceApi.ExplainBadgeCalculationRequest, communityBadgeCalculationServiceApi.ExplainBadgeCalculationResponse>(
      (request, done) => this.client.explainBadgeCalculation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      communityBadgeCalculationServiceApi.ExplainBadgeCalculationRequest.fromPartial({ badge: { description: record.status } }));
  }
}

/** Hands records to acme.concessions.v1.ConcessionStandService. */
class BackfillOrderIdConcessionStand implements BackfillOrderIdDestination {
  private readonly client: concessionsConcessionStandServiceApi.ConcessionStandServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new concessionsConcessionStandServiceApi.ConcessionStandServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: BackfillOrderIdRecord): Promise<void> {
    await call<concessionsConcessionStandServiceApi.CreateConcessionStandRequest, concessionsConcessionStandServiceApi.CreateConcessionStandResponse>(
      (request, done) => this.client.createConcessionStand(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      concessionsConcessionStandServiceApi.CreateConcessionStandRequest.fromPartial({ concessionStand: { name: record.status } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class BackfillOrderIdLogOnly implements BackfillOrderIdDestination {
  async forward(record: BackfillOrderIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverBackfillOrderId(kind: string, record: BackfillOrderIdRecord, runtime: Runtime): Promise<void> {
  let sink: BackfillOrderIdDestination = new BackfillOrderIdLogOnly();
  switch (kind) {
    case "badge-calculation":
      sink = new BackfillOrderIdBadgeCalculation(runtime);
      break;
    case "concession-stand":
      sink = new BackfillOrderIdConcessionStand(runtime);
      break;
  }
  await sink.forward(record);
}

/** Reads acme.orders.v1.OrderService/DeleteOrder and hands what it keeps to the sink of its kind. */
export async function backfillOrderId(runtime: Runtime): Promise<void> {
  const origin = new ordersOrderServiceApi.OrderServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<ordersOrderServiceApi.DeleteOrderRequest, ordersOrderServiceApi.DeleteOrderResponse>(
    (request, done) => origin.deleteOrder(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    ordersOrderServiceApi.DeleteOrderRequest.fromPartial({ orderId: "current-backfill-order-id" })));
  const entry: BackfillOrderIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    message: found.result?.message ?? "",
    status: found.result?.status ?? "",
  };
  await deliverBackfillOrderId("badge-calculation", entry, runtime);
}
