import * as contentContentRevisionWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_workflow_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as payrollPayRunServiceApi from "../../../.cache/proto/acme/payroll/v1/pay_run_service.js";
import * as workplacesBuildingCalculationServiceApi from "../../../.cache/proto/acme/workplaces/v1/building_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleBuildingOptionsStatus keeps of each CompareBuildingOptions response. */
interface SettleBuildingOptionsStatusRecord {
  status: string;
  buildingId: string;
  correlationId: string;
  parentId: string;
}

/** Where settleBuildingOptionsStatus hands each record. */
interface SettleBuildingOptionsStatusSink {
  send(record: SettleBuildingOptionsStatusRecord): Promise<void>;
}

/** Passes records to acme.payroll.v1.PayRunService. */
class SettleBuildingOptionsStatusPayRun implements SettleBuildingOptionsStatusSink {
  private readonly client: payrollPayRunServiceApi.PayRunServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new payrollPayRunServiceApi.PayRunServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleBuildingOptionsStatusRecord): Promise<void> {
    await call<payrollPayRunServiceApi.SearchPayRunsRequest, payrollPayRunServiceApi.SearchPayRunsResponse>(
      (request, done) => this.client.searchPayRuns(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      payrollPayRunServiceApi.SearchPayRunsRequest.fromPartial({ orderBy: record.status, filter: { region: record.buildingId } }));
  }
}

/** Passes records to acme.localization.v1.TranslationJobCalculationService. */
class SettleBuildingOptionsStatusTranslationJobCalculation implements SettleBuildingOptionsStatusSink {
  private readonly client: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleBuildingOptionsStatusRecord): Promise<void> {
    await call<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest, localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse>(
      (request, done) => this.client.explainTranslationJobCalculation(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest.fromPartial({ translationJob: { translationJobId: record.correlationId } }));
  }
}

/** Hands records to acme.content.v1.ContentRevisionWorkflowService. */
class SettleBuildingOptionsStatusContentRevisionWorkflow implements SettleBuildingOptionsStatusSink {
  private readonly client: contentContentRevisionWorkflowServiceApi.ContentRevisionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentRevisionWorkflowServiceApi.ContentRevisionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleBuildingOptionsStatusRecord): Promise<void> {
    await retry(() => call<contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsRequest, contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsResponse>(
      (request, done) => this.client.listContentRevisionWorkflows(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsRequest.fromPartial({ filter: { query: record.status } })));
  }
}

/**
 * Reads acme.workplaces.v1.BuildingCalculationService/CompareBuildingOptions and hands what it keeps to the
 * sink of its kind.
 */
export async function settleBuildingOptionsStatus(runtime: Runtime): Promise<void> {
  const reader = new workplacesBuildingCalculationServiceApi.BuildingCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<workplacesBuildingCalculationServiceApi.CompareBuildingOptionsRequest, workplacesBuildingCalculationServiceApi.CompareBuildingOptionsResponse>(
    (request, done) => reader.compareBuildingOptions(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    workplacesBuildingCalculationServiceApi.CompareBuildingOptionsRequest.fromPartial({ buildingId: "main-settle-building-options-status" }));
  const row: SettleBuildingOptionsStatusRecord = {
    status: response.result?.status ?? "",
    buildingId: text.normalize(response.building?.buildingId ?? ""),
    correlationId: response.result?.correlationId ?? "",
    parentId: response.building?.parentId ?? "",
  };
  const sinks: SettleBuildingOptionsStatusSink[] = [
    new SettleBuildingOptionsStatusPayRun(runtime),
    new SettleBuildingOptionsStatusTranslationJobCalculation(runtime),
    new SettleBuildingOptionsStatusContentRevisionWorkflow(runtime),
  ];
  await sinks[1]!.send(row);
}
