import * as contentContentBlockWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/content_block_workflow_service.js";
import * as contentContentRevisionValidationServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as corporateeventsCorporateEventCalculationServiceApi from "../../../.cache/proto/acme/corporateevents/v1/corporate_event_calculation_service.js";
import * as licensingSoftwareLicenseCalculationServiceApi from "../../../.cache/proto/acme/licensing/v1/software_license_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyContentBlockWorkflowStatus keeps of each StartContentBlockWorkflow response. */
interface CopyContentBlockWorkflowStatusRecord {
  status: string;
  message: string;
  referenceId: string;
  contentBlockId: string;
}

/** Where copyContentBlockWorkflowStatus hands each record. */
interface CopyContentBlockWorkflowStatusWriter {
  write(record: CopyContentBlockWorkflowStatusRecord): Promise<void>;
}

/** Sends records to acme.corporateevents.v1.CorporateEventCalculationService. */
class CopyContentBlockWorkflowStatusCorporateEventCalculation implements CopyContentBlockWorkflowStatusWriter {
  private readonly client: corporateeventsCorporateEventCalculationServiceApi.CorporateEventCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new corporateeventsCorporateEventCalculationServiceApi.CorporateEventCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CopyContentBlockWorkflowStatusRecord): Promise<void> {
    await call<corporateeventsCorporateEventCalculationServiceApi.ExplainCorporateEventCalculationRequest, corporateeventsCorporateEventCalculationServiceApi.ExplainCorporateEventCalculationResponse>(
      (request, done) => this.client.explainCorporateEventCalculation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      corporateeventsCorporateEventCalculationServiceApi.ExplainCorporateEventCalculationRequest.fromPartial({ reason: record.message, corporateEvent: { title: record.referenceId }, corporateEventId: record.status }));
  }
}

/** Writes records to acme.content.v1.ContentRevisionValidationService. */
class CopyContentBlockWorkflowStatusContentRevisionValidation implements CopyContentBlockWorkflowStatusWriter {
  private readonly client: contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CopyContentBlockWorkflowStatusRecord): Promise<void> {
    await retry(() => call<contentContentRevisionValidationServiceApi.CheckContentRevisionEligibilityRequest, contentContentRevisionValidationServiceApi.CheckContentRevisionEligibilityResponse>(
      (request, done) => this.client.checkContentRevisionEligibility(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      contentContentRevisionValidationServiceApi.CheckContentRevisionEligibilityRequest.fromPartial({ contentRevision: { contentRevisionId: record.referenceId } })));
  }
}

/** Writes records to acme.licensing.v1.SoftwareLicenseCalculationService. */
class CopyContentBlockWorkflowStatusSoftwareLicenseCalculation implements CopyContentBlockWorkflowStatusWriter {
  private readonly client: licensingSoftwareLicenseCalculationServiceApi.SoftwareLicenseCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new licensingSoftwareLicenseCalculationServiceApi.SoftwareLicenseCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CopyContentBlockWorkflowStatusRecord): Promise<void> {
    await call<licensingSoftwareLicenseCalculationServiceApi.GetSoftwareLicenseRatesRequest, licensingSoftwareLicenseCalculationServiceApi.GetSoftwareLicenseRatesResponse>(
      (request, done) => this.client.getSoftwareLicenseRates(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      licensingSoftwareLicenseCalculationServiceApi.GetSoftwareLicenseRatesRequest.fromPartial({ softwareLicenseId: record.status }));
  }
}

/**
 * Reads acme.content.v1.ContentBlockWorkflowService/StartContentBlockWorkflow and hands what it keeps to the
 * sink of its kind.
 */
export async function copyContentBlockWorkflowStatus(runtime: Runtime): Promise<void> {
  const origin = new contentContentBlockWorkflowServiceApi.ContentBlockWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowResponse>(
    (request, done) => origin.startContentBlockWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowRequest.fromPartial({ reason: "live-copy-content-block-workflow-status" }));
  const entry: CopyContentBlockWorkflowStatusRecord = {
    status: response.outcome?.status ?? "",
    message: text.normalize(response.outcome?.message ?? ""),
    referenceId: response.outcome?.referenceId ?? "",
    contentBlockId: response.contentBlock?.contentBlockId ?? "",
  };
  const entries: Array<{ kind: string; sink: CopyContentBlockWorkflowStatusWriter }> = [
    { kind: "corporate-event-calculation", sink: new CopyContentBlockWorkflowStatusCorporateEventCalculation(runtime) },
    { kind: "content-revision-validation", sink: new CopyContentBlockWorkflowStatusContentRevisionValidation(runtime) },
    { kind: "software-license-calculation", sink: new CopyContentBlockWorkflowStatusSoftwareLicenseCalculation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "corporate-event-calculation") continue;
    await entry.sink.write(entry);
  }
}
