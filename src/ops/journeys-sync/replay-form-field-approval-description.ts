import * as communityModerationCalculationServiceApi from "../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as formsFormFieldApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_approval_service.js";
import * as giftcardsGiftCardCalculationServiceApi from "../../../.cache/proto/acme/giftcards/v1/gift_card_calculation_service.js";
import * as ordersOrderServiceApi from "../../../.cache/proto/acme/orders/v1/order_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayFormFieldApprovalDescription keeps of each DelegateFormFieldApproval response. */
interface ReplayFormFieldApprovalDescriptionRecord {
  description: string;
  status: string;
  message: string;
}

/** Where replayFormFieldApprovalDescription hands each record. */
interface ReplayFormFieldApprovalDescriptionWriter {
  send(record: ReplayFormFieldApprovalDescriptionRecord): Promise<void>;
}

/** Hands records to acme.community.v1.ModerationCalculationService. */
class ReplayFormFieldApprovalDescriptionModerationCalculation implements ReplayFormFieldApprovalDescriptionWriter {
  private readonly client: communityModerationCalculationServiceApi.ModerationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityModerationCalculationServiceApi.ModerationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ReplayFormFieldApprovalDescriptionRecord): Promise<void> {
    await call<communityModerationCalculationServiceApi.GetModerationRatesRequest, communityModerationCalculationServiceApi.GetModerationRatesResponse>(
      (request, done) => this.client.getModerationRates(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      communityModerationCalculationServiceApi.GetModerationRatesRequest.fromPartial({ moderationId: record.status }));
  }
}

/** Writes records to acme.giftcards.v1.GiftCardCalculationService. */
class ReplayFormFieldApprovalDescriptionGiftCardCalculation implements ReplayFormFieldApprovalDescriptionWriter {
  private readonly client: giftcardsGiftCardCalculationServiceApi.GiftCardCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new giftcardsGiftCardCalculationServiceApi.GiftCardCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ReplayFormFieldApprovalDescriptionRecord): Promise<void> {
    await call<giftcardsGiftCardCalculationServiceApi.EstimateGiftCardRequest, giftcardsGiftCardCalculationServiceApi.EstimateGiftCardResponse>(
      (request, done) => this.client.estimateGiftCard(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      giftcardsGiftCardCalculationServiceApi.EstimateGiftCardRequest.fromPartial({ giftCard: { currencyCode: record.description } }));
  }
}

/** Sends records to acme.orders.v1.OrderService. */
class ReplayFormFieldApprovalDescriptionOrder implements ReplayFormFieldApprovalDescriptionWriter {
  private readonly client: ordersOrderServiceApi.OrderServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ordersOrderServiceApi.OrderServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ReplayFormFieldApprovalDescriptionRecord): Promise<void> {
    await call<ordersOrderServiceApi.DeleteOrderRequest, ordersOrderServiceApi.DeleteOrderResponse>(
      (request, done) => this.client.deleteOrder(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      ordersOrderServiceApi.DeleteOrderRequest.fromPartial({ etag: record.description }));
  }
}

/**
 * Reads acme.forms.v1.FormFieldApprovalService/DelegateFormFieldApproval and hands what it keeps to the sink
 * of its kind.
 */
export async function replayFormFieldApprovalDescription(runtime: Runtime): Promise<void> {
  const reader = new formsFormFieldApprovalServiceApi.FormFieldApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest, formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalResponse>(
    (request, done) => reader.delegateFormFieldApproval(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest.fromPartial({ reason: "default-replay-form-field-approval-description" }));
  const kept: ReplayFormFieldApprovalDescriptionRecord = {
    description: current.formField?.description ?? "",
    status: current.outcome?.status ?? "",
    message: current.outcome?.message ?? "",
  };
  const registry: Record<string, ReplayFormFieldApprovalDescriptionWriter> = {};
  for (const entry of [
    { kind: "moderation-calculation", sink: new ReplayFormFieldApprovalDescriptionModerationCalculation(runtime) },
    { kind: "gift-card-calculation", sink: new ReplayFormFieldApprovalDescriptionGiftCardCalculation(runtime) },
    { kind: "order", sink: new ReplayFormFieldApprovalDescriptionOrder(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["moderation-calculation"]!.send(kept);
}
