import * as experimentsExperimentValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as telehealthVideoVisitCalculationServiceApi from "../../../.cache/proto/acme/telehealth/v1/video_visit_calculation_service.js";
import * as toursTourQueryServiceApi from "../../../.cache/proto/acme/tours/v1/tour_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillVideoVisitTitle keeps of each QuoteVideoVisit response. */
interface BackfillVideoVisitTitleRecord {
  title: string;
  correlationId: string;
  currencyCode: string;
  videoVisitId: string;
}

/** Where backfillVideoVisitTitle hands each record. */
interface BackfillVideoVisitTitleSink {
  push(record: BackfillVideoVisitTitleRecord): Promise<void>;
}

/** Sends records to acme.experiments.v1.ExperimentValidationService. */
class BackfillVideoVisitTitleExperimentValidation implements BackfillVideoVisitTitleSink {
  private readonly client: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: BackfillVideoVisitTitleRecord): Promise<void> {
    await retry(() => call<experimentsExperimentValidationServiceApi.ScoreExperimentRequest, experimentsExperimentValidationServiceApi.ScoreExperimentResponse>(
      (request, done) => this.client.scoreExperiment(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      experimentsExperimentValidationServiceApi.ScoreExperimentRequest.fromPartial({ experimentId: record.currencyCode })));
  }
}

/** Sends records to acme.tours.v1.TourQueryService. */
class BackfillVideoVisitTitleTourQuery implements BackfillVideoVisitTitleSink {
  private readonly client: toursTourQueryServiceApi.TourQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new toursTourQueryServiceApi.TourQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: BackfillVideoVisitTitleRecord): Promise<void> {
    await call<toursTourQueryServiceApi.CountToursRequest, toursTourQueryServiceApi.CountToursResponse>(
      (request, done) => this.client.countTours(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      toursTourQueryServiceApi.CountToursRequest.fromPartial({ page: { pageToken: record.videoVisitId } }));
  }
}

/**
 * Reads acme.telehealth.v1.VideoVisitCalculationService/QuoteVideoVisit and hands what it keeps to the sink
 * of its kind.
 */
export async function backfillVideoVisitTitle(runtime: Runtime): Promise<void> {
  const origin = new telehealthVideoVisitCalculationServiceApi.VideoVisitCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<telehealthVideoVisitCalculationServiceApi.QuoteVideoVisitRequest, telehealthVideoVisitCalculationServiceApi.QuoteVideoVisitResponse>(
    (request, done) => origin.quoteVideoVisit(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    telehealthVideoVisitCalculationServiceApi.QuoteVideoVisitRequest.fromPartial({ videoVisitId: "live-backfill-video-visit-title" })));
  const entry: BackfillVideoVisitTitleRecord = {
    title: current.videoVisit?.title ?? "",
    correlationId: text.normalize(current.result?.correlationId ?? ""),
    currencyCode: current.breakdown?.currencyCode ?? "",
    videoVisitId: current.videoVisit?.videoVisitId ?? "",
  };
  const registry: Record<string, BackfillVideoVisitTitleSink> = {};
  for (const entry of [
    { kind: "experiment-validation", sink: new BackfillVideoVisitTitleExperimentValidation(runtime) },
    { kind: "tour-query", sink: new BackfillVideoVisitTitleTourQuery(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["experiment-validation"]!.push(entry);
}
