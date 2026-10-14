import * as communityForumWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as formsFormFieldWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_workflow_service.js";
import * as fuelFuelCardServiceApi from "../../../.cache/proto/acme/fuel/v1/fuel_card_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillForumWorkflowStatus keeps of each InspectForumWorkflow response. */
interface BackfillForumWorkflowStatusRecord {
  status: string;
  parentId: string;
  correlationId: string;
  message: string;
}

/** Where backfillForumWorkflowStatus hands each record. */
interface BackfillForumWorkflowStatusWriter {
  write(record: BackfillForumWorkflowStatusRecord): Promise<void>;
}

/** Writes records to acme.forms.v1.FormFieldWorkflowService. */
class BackfillForumWorkflowStatusFormFieldWorkflow implements BackfillForumWorkflowStatusWriter {
  private readonly client: formsFormFieldWorkflowServiceApi.FormFieldWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormFieldWorkflowServiceApi.FormFieldWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: BackfillForumWorkflowStatusRecord): Promise<void> {
    await call<formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowResponse>(
      (request, done) => this.client.startFormFieldWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowRequest.fromPartial({ reason: record.correlationId, formFieldId: record.status }));
  }
}

/** Passes records to acme.fuel.v1.FuelCardService. */
class BackfillForumWorkflowStatusFuelCard implements BackfillForumWorkflowStatusWriter {
  private readonly client: fuelFuelCardServiceApi.FuelCardServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fuelFuelCardServiceApi.FuelCardServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: BackfillForumWorkflowStatusRecord): Promise<void> {
    await call<fuelFuelCardServiceApi.SearchFuelCardsRequest, fuelFuelCardServiceApi.SearchFuelCardsResponse>(
      (request, done) => this.client.searchFuelCards(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      fuelFuelCardServiceApi.SearchFuelCardsRequest.fromPartial({ filter: { query: record.message, region: record.parentId } }));
  }
}

/**
 * Reads acme.community.v1.ForumWorkflowService/InspectForumWorkflow and hands what it keeps to the sink of
 * its kind.
 */
export async function backfillForumWorkflowStatus(runtime: Runtime): Promise<void> {
  const reader = new communityForumWorkflowServiceApi.ForumWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<communityForumWorkflowServiceApi.InspectForumWorkflowRequest, communityForumWorkflowServiceApi.InspectForumWorkflowResponse>(
    (request, done) => reader.inspectForumWorkflow(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    communityForumWorkflowServiceApi.InspectForumWorkflowRequest.fromPartial({ forumId: "nightly-backfill-forum-workflow-status" }));
  const row: BackfillForumWorkflowStatusRecord = {
    status: response.result?.status ?? "",
    parentId: text.normalize(response.forum?.parentId ?? ""),
    correlationId: text.normalize(response.result?.correlationId ?? ""),
    message: text.normalize(response.result?.message ?? ""),
  };
  const sinks = new Map<string, BackfillForumWorkflowStatusWriter>();
  sinks.set("form-field-workflow", new BackfillForumWorkflowStatusFormFieldWorkflow(runtime));
  sinks.set("fuel-card", new BackfillForumWorkflowStatusFuelCard(runtime));
  await sinks.get("fuel-card")!.write(row);
}
