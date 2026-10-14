import * as contractsContractQueryServiceApi from "../../../.cache/proto/acme/contracts/v1/contract_query_service.js";
import * as corporateeventsCorporateEventQueryServiceApi from "../../../.cache/proto/acme/corporateevents/v1/corporate_event_query_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeSurveyResponsesMessage keeps of each BrowseSurveyResponses response. */
interface RouteSurveyResponsesMessageRecord {
  message: string;
  correlationId: string;
  nextPageToken: string;
  status: string;
}

/** Where routeSurveyResponsesMessage hands each record. */
interface RouteSurveyResponsesMessageWriter {
  write(record: RouteSurveyResponsesMessageRecord): Promise<void>;
}

/** Sends records to acme.corporateevents.v1.CorporateEventQueryService. */
class RouteSurveyResponsesMessageCorporateEventQuery implements RouteSurveyResponsesMessageWriter {
  private readonly client: corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RouteSurveyResponsesMessageRecord): Promise<void> {
    await retry(() => call<corporateeventsCorporateEventQueryServiceApi.PeekCorporateEventRequest, corporateeventsCorporateEventQueryServiceApi.PeekCorporateEventResponse>(
      (request, done) => this.client.peekCorporateEvent(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      corporateeventsCorporateEventQueryServiceApi.PeekCorporateEventRequest.fromPartial({ corporateEventId: record.message })));
  }
}

/** Sends records to acme.contracts.v1.ContractQueryService. */
class RouteSurveyResponsesMessageContractQuery implements RouteSurveyResponsesMessageWriter {
  private readonly client: contractsContractQueryServiceApi.ContractQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contractsContractQueryServiceApi.ContractQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RouteSurveyResponsesMessageRecord): Promise<void> {
    await call<contractsContractQueryServiceApi.SummarizeContractsRequest, contractsContractQueryServiceApi.SummarizeContractsResponse>(
      (request, done) => this.client.summarizeContracts(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      contractsContractQueryServiceApi.SummarizeContractsRequest.fromPartial({ reason: record.correlationId, details: { format: record.nextPageToken } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class RouteSurveyResponsesMessageLogOnly implements RouteSurveyResponsesMessageWriter {
  async write(record: RouteSurveyResponsesMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverRouteSurveyResponsesMessage(kind: string, record: RouteSurveyResponsesMessageRecord, runtime: Runtime): Promise<void> {
  let sink: RouteSurveyResponsesMessageWriter = new RouteSurveyResponsesMessageLogOnly();
  switch (kind) {
    case "corporate-event-query":
      sink = new RouteSurveyResponsesMessageCorporateEventQuery(runtime);
      break;
    case "contract-query":
      sink = new RouteSurveyResponsesMessageContractQuery(runtime);
      break;
  }
  await sink.write(record);
}

/**
 * Reads acme.surveys.v1.SurveyResponseQueryService/BrowseSurveyResponses and hands what it keeps to the sink
 * of its kind.
 */
export async function routeSurveyResponsesMessage(runtime: Runtime): Promise<void> {
  const origin = new surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesResponse>(
    (request, done) => origin.browseSurveyResponses(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    surveysSurveyResponseQueryServiceApi.BrowseSurveyResponsesRequest.fromPartial({ orderBy: "default-route-survey-responses-message" })));
  const entry: RouteSurveyResponsesMessageRecord = {
    message: current.result?.message ?? "",
    correlationId: text.normalize(current.result?.correlationId ?? ""),
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
    status: current.result?.status ?? "",
  };
  await deliverRouteSurveyResponsesMessage("corporate-event-query", entry, runtime);
}
