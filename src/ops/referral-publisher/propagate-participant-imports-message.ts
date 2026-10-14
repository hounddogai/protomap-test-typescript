import * as messagingParticipantImportServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_import_service.js";
import * as ordersOrderServiceApi from "../../../.cache/proto/acme/orders/v1/order_service.js";
import * as paymentsPaymentCalculationServiceApi from "../../../.cache/proto/acme/payments/v1/payment_calculation_service.js";
import * as pricingPriceListServiceApi from "../../../.cache/proto/acme/pricing/v1/price_list_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateParticipantImportsMessage keeps of each ListParticipantImports response. */
interface PropagateParticipantImportsMessageRecord {
  message: string;
  correlationId: string;
}

/** Where propagateParticipantImportsMessage hands each record. */
interface PropagateParticipantImportsMessageDestination {
  write(record: PropagateParticipantImportsMessageRecord): Promise<void>;
}

/** Sends records to acme.orders.v1.OrderService. */
class PropagateParticipantImportsMessageOrder implements PropagateParticipantImportsMessageDestination {
  private readonly client: ordersOrderServiceApi.OrderServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ordersOrderServiceApi.OrderServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateParticipantImportsMessageRecord): Promise<void> {
    await call<ordersOrderServiceApi.GetOrderRequest, ordersOrderServiceApi.GetOrderResponse>(
      (request, done) => this.client.getOrder(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      ordersOrderServiceApi.GetOrderRequest.fromPartial({ orderId: record.message }));
  }
}

/** Passes records to acme.pricing.v1.PriceListService. */
class PropagateParticipantImportsMessagePriceList implements PropagateParticipantImportsMessageDestination {
  private readonly client: pricingPriceListServiceApi.PriceListServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new pricingPriceListServiceApi.PriceListServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateParticipantImportsMessageRecord): Promise<void> {
    await call<pricingPriceListServiceApi.UpdatePriceListRequest, pricingPriceListServiceApi.UpdatePriceListResponse>(
      (request, done) => this.client.updatePriceList(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      pricingPriceListServiceApi.UpdatePriceListRequest.fromPartial({ priceList: { priceListId: record.message } }));
  }
}

/** Hands records to acme.payments.v1.PaymentCalculationService. */
class PropagateParticipantImportsMessagePaymentCalculation implements PropagateParticipantImportsMessageDestination {
  private readonly client: paymentsPaymentCalculationServiceApi.PaymentCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new paymentsPaymentCalculationServiceApi.PaymentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateParticipantImportsMessageRecord): Promise<void> {
    await call<paymentsPaymentCalculationServiceApi.ExplainPaymentCalculationRequest, paymentsPaymentCalculationServiceApi.ExplainPaymentCalculationResponse>(
      (request, done) => this.client.explainPaymentCalculation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      paymentsPaymentCalculationServiceApi.ExplainPaymentCalculationRequest.fromPartial({ payment: { number: record.correlationId }, paymentId: record.message }));
  }
}

/**
 * Reads acme.messaging.v1.ParticipantImportService/ListParticipantImports and hands what it keeps to the sink
 * of its kind.
 */
export async function propagateParticipantImportsMessage(runtime: Runtime): Promise<void> {
  const reader = new messagingParticipantImportServiceApi.ParticipantImportServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<messagingParticipantImportServiceApi.ListParticipantImportsRequest, messagingParticipantImportServiceApi.ListParticipantImportsResponse>(
    (request, done) => reader.listParticipantImports(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    messagingParticipantImportServiceApi.ListParticipantImportsRequest.fromPartial({ orderBy: "default-propagate-participant-imports-message" }));
  const kept: PropagateParticipantImportsMessageRecord = {
    message: response.result?.message ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  const sinks: PropagateParticipantImportsMessageDestination[] = [
    new PropagateParticipantImportsMessageOrder(runtime),
    new PropagateParticipantImportsMessagePriceList(runtime),
    new PropagateParticipantImportsMessagePaymentCalculation(runtime),
  ];
  await sinks[1]!.write(kept);
}
