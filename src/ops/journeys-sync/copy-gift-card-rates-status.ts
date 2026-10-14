import * as chatChatBotApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_approval_service.js";
import * as giftcardsGiftCardCalculationServiceApi from "../../../.cache/proto/acme/giftcards/v1/gift_card_calculation_service.js";
import * as routingRouteCalculationServiceApi from "../../../.cache/proto/acme/routing/v1/route_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyGiftCardRatesStatus keeps of each GetGiftCardRates response. */
interface CopyGiftCardRatesStatusRecord {
  status: string;
  message: string;
}

/** Where copyGiftCardRatesStatus hands each record. */
interface CopyGiftCardRatesStatusTarget {
  apply(record: CopyGiftCardRatesStatusRecord): Promise<void>;
}

/** Passes records to acme.routing.v1.RouteCalculationService. */
class CopyGiftCardRatesStatusRouteCalculation implements CopyGiftCardRatesStatusTarget {
  private readonly client: routingRouteCalculationServiceApi.RouteCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new routingRouteCalculationServiceApi.RouteCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyGiftCardRatesStatusRecord): Promise<void> {
    await call<routingRouteCalculationServiceApi.SimulateRouteRequest, routingRouteCalculationServiceApi.SimulateRouteResponse>(
      (request, done) => this.client.simulateRoute(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      routingRouteCalculationServiceApi.SimulateRouteRequest.fromPartial({ details: { currencyCode: record.status }, reason: record.message }));
  }
}

/** Passes records to acme.chat.v1.ChatBotApprovalService. */
class CopyGiftCardRatesStatusChatBotApproval implements CopyGiftCardRatesStatusTarget {
  private readonly client: chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyGiftCardRatesStatusRecord): Promise<void> {
    await retry(() => call<chatChatBotApprovalServiceApi.ApproveChatBotRequest, chatChatBotApprovalServiceApi.ApproveChatBotResponse>(
      (request, done) => this.client.approveChatBot(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatBotApprovalServiceApi.ApproveChatBotRequest.fromPartial({ chatBot: { name: record.message }, details: { approverEmail: record.status } })));
  }
}

/**
 * Reads acme.giftcards.v1.GiftCardCalculationService/GetGiftCardRates and hands what it keeps to the sink of
 * its kind.
 */
export async function copyGiftCardRatesStatus(runtime: Runtime): Promise<void> {
  const upstream = new giftcardsGiftCardCalculationServiceApi.GiftCardCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<giftcardsGiftCardCalculationServiceApi.GetGiftCardRatesRequest, giftcardsGiftCardCalculationServiceApi.GetGiftCardRatesResponse>(
    (request, done) => upstream.getGiftCardRates(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    giftcardsGiftCardCalculationServiceApi.GetGiftCardRatesRequest.fromPartial({ giftCardId: "nightly-copy-gift-card-rates-status" }));
  const entry: CopyGiftCardRatesStatusRecord = {
    status: current.result?.status ?? "",
    message: current.result?.message ?? "",
  };
  const entries: Array<{ kind: string; sink: CopyGiftCardRatesStatusTarget }> = [
    { kind: "route-calculation", sink: new CopyGiftCardRatesStatusRouteCalculation(runtime) },
    { kind: "chat-bot-approval", sink: new CopyGiftCardRatesStatusChatBotApproval(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "route-calculation") continue;
    await entry.sink.apply(entry);
  }
}
