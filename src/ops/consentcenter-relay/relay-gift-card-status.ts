import * as experimentsExperimentCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as giftcardsGiftCardServiceApi from "../../../.cache/proto/acme/giftcards/v1/gift_card_service.js";
import * as labelingLabelingTaskCalculationServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_calculation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayGiftCardStatus keeps of each DeleteGiftCard response. */
interface RelayGiftCardStatusRecord {
  status: string;
  correlationId: string;
}

/** Where relayGiftCardStatus hands each record. */
interface RelayGiftCardStatusTarget {
  push(record: RelayGiftCardStatusRecord): Promise<void>;
}

/** Writes records to acme.localization.v1.TranslationKeyCalculationService. */
class RelayGiftCardStatusTranslationKeyCalculation implements RelayGiftCardStatusTarget {
  private readonly client: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayGiftCardStatusRecord): Promise<void> {
    await call<localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesRequest, localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesResponse>(
      (request, done) => this.client.getTranslationKeyRates(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesRequest.fromPartial({ translationKeyId: record.status }));
  }
}

/** Passes records to acme.labeling.v1.LabelingTaskCalculationService. */
class RelayGiftCardStatusLabelingTaskCalculation implements RelayGiftCardStatusTarget {
  private readonly client: labelingLabelingTaskCalculationServiceApi.LabelingTaskCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new labelingLabelingTaskCalculationServiceApi.LabelingTaskCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayGiftCardStatusRecord): Promise<void> {
    await call<labelingLabelingTaskCalculationServiceApi.RecalculateLabelingTasksRequest, labelingLabelingTaskCalculationServiceApi.RecalculateLabelingTasksResponse>(
      (request, done) => this.client.recalculateLabelingTasks(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      labelingLabelingTaskCalculationServiceApi.RecalculateLabelingTasksRequest.fromPartial({ details: { currencyCode: record.correlationId }, labelingTaskId: record.status }));
  }
}

/** Writes records to acme.experiments.v1.ExperimentCalculationService. */
class RelayGiftCardStatusExperimentCalculation implements RelayGiftCardStatusTarget {
  private readonly client: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayGiftCardStatusRecord): Promise<void> {
    await call<experimentsExperimentCalculationServiceApi.EstimateExperimentRequest, experimentsExperimentCalculationServiceApi.EstimateExperimentResponse>(
      (request, done) => this.client.estimateExperiment(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      experimentsExperimentCalculationServiceApi.EstimateExperimentRequest.fromPartial({ reason: record.correlationId }));
  }
}

/** Reads acme.giftcards.v1.GiftCardService/DeleteGiftCard and hands what it keeps to the sink of its kind. */
export async function relayGiftCardStatus(runtime: Runtime): Promise<void> {
  const reader = new giftcardsGiftCardServiceApi.GiftCardServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<giftcardsGiftCardServiceApi.DeleteGiftCardRequest, giftcardsGiftCardServiceApi.DeleteGiftCardResponse>(
    (request, done) => reader.deleteGiftCard(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    giftcardsGiftCardServiceApi.DeleteGiftCardRequest.fromPartial({ giftCardId: "primary-relay-gift-card-status" })));
  const record: RelayGiftCardStatusRecord = {
    status: reply.result?.status ?? "",
    correlationId: reply.result?.correlationId ?? "",
  };
  const registry: Record<string, RelayGiftCardStatusTarget> = {};
  for (const entry of [
    { kind: "translation-key-calculation", sink: new RelayGiftCardStatusTranslationKeyCalculation(runtime) },
    { kind: "labeling-task-calculation", sink: new RelayGiftCardStatusLabelingTaskCalculation(runtime) },
    { kind: "experiment-calculation", sink: new RelayGiftCardStatusExperimentCalculation(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["translation-key-calculation"]!.push(record);
}
