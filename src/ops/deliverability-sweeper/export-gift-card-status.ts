import * as giftcardsGiftCardServiceApi from "../../../.cache/proto/acme/giftcards/v1/gift_card_service.js";
import * as labelingLabelingTaskServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_service.js";
import * as mediaRenditionValidationServiceApi from "../../../.cache/proto/acme/media/v1/rendition_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportGiftCardStatus keeps of each GetGiftCard response. */
interface ExportGiftCardStatusRecord {
  status: string;
  currencyCode: string;
  message: string;
}

/** Where exportGiftCardStatus hands each record. */
interface ExportGiftCardStatusDestination {
  forward(record: ExportGiftCardStatusRecord): Promise<void>;
}

/** Hands records to acme.labeling.v1.LabelingTaskService. */
class ExportGiftCardStatusLabelingTask implements ExportGiftCardStatusDestination {
  private readonly client: labelingLabelingTaskServiceApi.LabelingTaskServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new labelingLabelingTaskServiceApi.LabelingTaskServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ExportGiftCardStatusRecord): Promise<void> {
    await retry(() => call<labelingLabelingTaskServiceApi.ListLabelingTasksRequest, labelingLabelingTaskServiceApi.ListLabelingTasksResponse>(
      (request, done) => this.client.listLabelingTasks(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      labelingLabelingTaskServiceApi.ListLabelingTasksRequest.fromPartial({ filter: { region: record.message }, page: { pageToken: record.status }, orderBy: record.currencyCode })));
  }
}

/** Sends records to acme.media.v1.RenditionValidationService. */
class ExportGiftCardStatusRenditionValidation implements ExportGiftCardStatusDestination {
  private readonly client: mediaRenditionValidationServiceApi.RenditionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionValidationServiceApi.RenditionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ExportGiftCardStatusRecord): Promise<void> {
    await call<mediaRenditionValidationServiceApi.NormalizeRenditionRequest, mediaRenditionValidationServiceApi.NormalizeRenditionResponse>(
      (request, done) => this.client.normalizeRendition(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaRenditionValidationServiceApi.NormalizeRenditionRequest.fromPartial({ rendition: { renditionId: record.status }, details: { locale: record.message } }));
  }
}

/** Reads acme.giftcards.v1.GiftCardService/GetGiftCard and hands what it keeps to the sink of its kind. */
export async function exportGiftCardStatus(runtime: Runtime): Promise<void> {
  const upstream = new giftcardsGiftCardServiceApi.GiftCardServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<giftcardsGiftCardServiceApi.GetGiftCardRequest, giftcardsGiftCardServiceApi.GetGiftCardResponse>(
    (request, done) => upstream.getGiftCard(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    giftcardsGiftCardServiceApi.GetGiftCardRequest.fromPartial({ giftCardId: "primary-export-gift-card-status" })));
  const kept: ExportGiftCardStatusRecord = {
    status: found.result?.status ?? "",
    currencyCode: found.giftCard?.currencyCode ?? "",
    message: found.result?.message ?? "",
  };
  const sinks: ExportGiftCardStatusDestination[] = [
    new ExportGiftCardStatusLabelingTask(runtime),
    new ExportGiftCardStatusRenditionValidation(runtime),
  ];
  await sinks[1]!.forward(kept);
}
