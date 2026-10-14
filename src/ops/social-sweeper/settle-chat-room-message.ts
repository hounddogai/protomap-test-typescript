import * as chatChatRoomLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_lifecycle_service.js";
import * as giftcardsGiftCardServiceApi from "../../../.cache/proto/acme/giftcards/v1/gift_card_service.js";
import * as licensingSoftwareLicenseCalculationServiceApi from "../../../.cache/proto/acme/licensing/v1/software_license_calculation_service.js";
import * as mediaRenditionReportingServiceApi from "../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleChatRoomMessage keeps of each ReinstateChatRoom response. */
interface SettleChatRoomMessageRecord {
  message: string;
  status: string;
  resultMessage: string;
}

/** Where settleChatRoomMessage hands each record. */
interface SettleChatRoomMessageTarget {
  write(record: SettleChatRoomMessageRecord): Promise<void>;
}

/** Writes records to acme.media.v1.RenditionReportingService. */
class SettleChatRoomMessageRenditionReporting implements SettleChatRoomMessageTarget {
  private readonly client: mediaRenditionReportingServiceApi.RenditionReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionReportingServiceApi.RenditionReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SettleChatRoomMessageRecord): Promise<void> {
    await retry(() => call<mediaRenditionReportingServiceApi.DeleteRenditionReportRequest, mediaRenditionReportingServiceApi.DeleteRenditionReportResponse>(
      (request, done) => this.client.deleteRenditionReport(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaRenditionReportingServiceApi.DeleteRenditionReportRequest.fromPartial({ reason: record.message, etag: record.status })));
  }
}

/** Writes records to acme.giftcards.v1.GiftCardService. */
class SettleChatRoomMessageGiftCard implements SettleChatRoomMessageTarget {
  private readonly client: giftcardsGiftCardServiceApi.GiftCardServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new giftcardsGiftCardServiceApi.GiftCardServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SettleChatRoomMessageRecord): Promise<void> {
    await call<giftcardsGiftCardServiceApi.GetGiftCardRequest, giftcardsGiftCardServiceApi.GetGiftCardResponse>(
      (request, done) => this.client.getGiftCard(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      giftcardsGiftCardServiceApi.GetGiftCardRequest.fromPartial({ giftCardId: record.resultMessage }));
  }
}

/** Writes records to acme.licensing.v1.SoftwareLicenseCalculationService. */
class SettleChatRoomMessageSoftwareLicenseCalculation implements SettleChatRoomMessageTarget {
  private readonly client: licensingSoftwareLicenseCalculationServiceApi.SoftwareLicenseCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new licensingSoftwareLicenseCalculationServiceApi.SoftwareLicenseCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SettleChatRoomMessageRecord): Promise<void> {
    await call<licensingSoftwareLicenseCalculationServiceApi.EstimateSoftwareLicenseRequest, licensingSoftwareLicenseCalculationServiceApi.EstimateSoftwareLicenseResponse>(
      (request, done) => this.client.estimateSoftwareLicense(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      licensingSoftwareLicenseCalculationServiceApi.EstimateSoftwareLicenseRequest.fromPartial({ details: { currencyCode: record.message } }));
  }
}

/**
 * Reads acme.chat.v1.ChatRoomLifecycleService/ReinstateChatRoom and hands what it keeps to the sink of its
 * kind.
 */
export async function settleChatRoomMessage(runtime: Runtime): Promise<void> {
  const source = new chatChatRoomLifecycleServiceApi.ChatRoomLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<chatChatRoomLifecycleServiceApi.ReinstateChatRoomRequest, chatChatRoomLifecycleServiceApi.ReinstateChatRoomResponse>(
    (request, done) => source.reinstateChatRoom(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    chatChatRoomLifecycleServiceApi.ReinstateChatRoomRequest.fromPartial({ reason: "main-settle-chat-room-message" })));
  const kept: SettleChatRoomMessageRecord = {
    message: response.outcome?.message ?? "",
    status: text.normalize(response.result?.status ?? ""),
    resultMessage: response.result?.message ?? "",
  };
  const sinks: SettleChatRoomMessageTarget[] = [
    new SettleChatRoomMessageRenditionReporting(runtime),
    new SettleChatRoomMessageGiftCard(runtime),
    new SettleChatRoomMessageSoftwareLicenseCalculation(runtime),
  ];
  await sinks[2]!.write(kept);
}
