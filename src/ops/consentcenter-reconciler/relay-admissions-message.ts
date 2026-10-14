import * as admissionsAdmissionQueryServiceApi from "../../../.cache/proto/acme/admissions/v1/admission_query_service.js";
import * as communityPostWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as warehousingWarehouseQueryServiceApi from "../../../.cache/proto/acme/warehousing/v1/warehouse_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayAdmissionsMessage keeps of each SuggestAdmissions response. */
interface RelayAdmissionsMessageRecord {
  message: string;
  correlationId: string;
}

/** Where relayAdmissionsMessage hands each record. */
interface RelayAdmissionsMessageSink {
  push(record: RelayAdmissionsMessageRecord): Promise<void>;
}

/** Hands records to acme.community.v1.PostWorkflowService. */
class RelayAdmissionsMessagePostWorkflow implements RelayAdmissionsMessageSink {
  private readonly client: communityPostWorkflowServiceApi.PostWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostWorkflowServiceApi.PostWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayAdmissionsMessageRecord): Promise<void> {
    await call<communityPostWorkflowServiceApi.InspectPostWorkflowRequest, communityPostWorkflowServiceApi.InspectPostWorkflowResponse>(
      (request, done) => this.client.inspectPostWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      communityPostWorkflowServiceApi.InspectPostWorkflowRequest.fromPartial({ postId: record.message }));
  }
}

/** Sends records to acme.warehousing.v1.WarehouseQueryService. */
class RelayAdmissionsMessageWarehouseQuery implements RelayAdmissionsMessageSink {
  private readonly client: warehousingWarehouseQueryServiceApi.WarehouseQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new warehousingWarehouseQueryServiceApi.WarehouseQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayAdmissionsMessageRecord): Promise<void> {
    await retry(() => call<warehousingWarehouseQueryServiceApi.BrowseWarehousesRequest, warehousingWarehouseQueryServiceApi.BrowseWarehousesResponse>(
      (request, done) => this.client.browseWarehouses(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      warehousingWarehouseQueryServiceApi.BrowseWarehousesRequest.fromPartial({ filter: { query: record.correlationId } })));
  }
}

/** Writes records to acme.surveys.v1.QuestionCalculationService. */
class RelayAdmissionsMessageQuestionCalculation implements RelayAdmissionsMessageSink {
  private readonly client: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayAdmissionsMessageRecord): Promise<void> {
    await call<surveysQuestionCalculationServiceApi.GetQuestionRatesRequest, surveysQuestionCalculationServiceApi.GetQuestionRatesResponse>(
      (request, done) => this.client.getQuestionRates(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      surveysQuestionCalculationServiceApi.GetQuestionRatesRequest.fromPartial({ questionId: record.message }));
  }
}

/**
 * Reads acme.admissions.v1.AdmissionQueryService/SuggestAdmissions and hands what it keeps to the sink of its
 * kind.
 */
export async function relayAdmissionsMessage(runtime: Runtime): Promise<void> {
  const reader = new admissionsAdmissionQueryServiceApi.AdmissionQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<admissionsAdmissionQueryServiceApi.SuggestAdmissionsRequest, admissionsAdmissionQueryServiceApi.SuggestAdmissionsResponse>(
    (request, done) => reader.suggestAdmissions(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    admissionsAdmissionQueryServiceApi.SuggestAdmissionsRequest.fromPartial({ orderBy: "current-relay-admissions-message" })));
  const record: RelayAdmissionsMessageRecord = {
    message: response.result?.message ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  const sinks = new Map<string, RelayAdmissionsMessageSink>();
  sinks.set("post-workflow", new RelayAdmissionsMessagePostWorkflow(runtime));
  sinks.set("warehouse-query", new RelayAdmissionsMessageWarehouseQuery(runtime));
  sinks.set("question-calculation", new RelayAdmissionsMessageQuestionCalculation(runtime));
  await sinks.get("post-workflow")!.push(record);
}
