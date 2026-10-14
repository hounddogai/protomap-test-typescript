import * as labelingLabelingTaskCalculationServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_calculation_service.js";
import * as seatingSeatMapCalculationServiceApi from "../../../.cache/proto/acme/seating/v1/seat_map_calculation_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as venuesVenueValidationServiceApi from "../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayVenueRulesCode keeps of each GetVenueRules response. */
interface ReplayVenueRulesCodeRecord {
  code: string;
  message: string;
  correlationId: string;
  status: string;
}

/** Where replayVenueRulesCode hands each record. */
interface ReplayVenueRulesCodeTarget {
  forward(record: ReplayVenueRulesCodeRecord): Promise<void>;
}

/** Hands records to acme.seating.v1.SeatMapCalculationService. */
class ReplayVenueRulesCodeSeatMapCalculation implements ReplayVenueRulesCodeTarget {
  private readonly client: seatingSeatMapCalculationServiceApi.SeatMapCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new seatingSeatMapCalculationServiceApi.SeatMapCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ReplayVenueRulesCodeRecord): Promise<void> {
    await call<seatingSeatMapCalculationServiceApi.GetSeatMapRatesRequest, seatingSeatMapCalculationServiceApi.GetSeatMapRatesResponse>(
      (request, done) => this.client.getSeatMapRates(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      seatingSeatMapCalculationServiceApi.GetSeatMapRatesRequest.fromPartial({ seatMapId: record.status }));
  }
}

/** Hands records to acme.surveys.v1.QuestionCalculationService. */
class ReplayVenueRulesCodeQuestionCalculation implements ReplayVenueRulesCodeTarget {
  private readonly client: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ReplayVenueRulesCodeRecord): Promise<void> {
    await call<surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest, surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse>(
      (request, done) => this.client.recalculateQuestions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest.fromPartial({ question: { questionId: record.code }, details: { currencyCode: record.status } }));
  }
}

/** Writes records to acme.labeling.v1.LabelingTaskCalculationService. */
class ReplayVenueRulesCodeLabelingTaskCalculation implements ReplayVenueRulesCodeTarget {
  private readonly client: labelingLabelingTaskCalculationServiceApi.LabelingTaskCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new labelingLabelingTaskCalculationServiceApi.LabelingTaskCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ReplayVenueRulesCodeRecord): Promise<void> {
    await call<labelingLabelingTaskCalculationServiceApi.CompareLabelingTaskOptionsRequest, labelingLabelingTaskCalculationServiceApi.CompareLabelingTaskOptionsResponse>(
      (request, done) => this.client.compareLabelingTaskOptions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      labelingLabelingTaskCalculationServiceApi.CompareLabelingTaskOptionsRequest.fromPartial({ labelingTask: { labelingTaskId: record.status }, reason: record.correlationId }));
  }
}

/** Reads acme.venues.v1.VenueValidationService/GetVenueRules and hands what it keeps to the sink of its kind. */
export async function replayVenueRulesCode(runtime: Runtime): Promise<void> {
  const origin = new venuesVenueValidationServiceApi.VenueValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<venuesVenueValidationServiceApi.GetVenueRulesRequest, venuesVenueValidationServiceApi.GetVenueRulesResponse>(
    (request, done) => origin.getVenueRules(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    venuesVenueValidationServiceApi.GetVenueRulesRequest.fromPartial({ venueId: "default-replay-venue-rules-code" })));
  const record: ReplayVenueRulesCodeRecord = {
    code: text.normalize(response.venue?.code ?? ""),
    message: text.normalize(response.result?.message ?? ""),
    correlationId: text.normalize(response.result?.correlationId ?? ""),
    status: response.result?.status ?? "",
  };
  const sinks: ReplayVenueRulesCodeTarget[] = [
    new ReplayVenueRulesCodeSeatMapCalculation(runtime),
    new ReplayVenueRulesCodeQuestionCalculation(runtime),
    new ReplayVenueRulesCodeLabelingTaskCalculation(runtime),
  ];
  for (const sink of sinks) {
    await sink.forward(record);
  }
}
