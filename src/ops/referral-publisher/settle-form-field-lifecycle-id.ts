import * as experimentsVariantSyncServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as formsFormFieldLifecycleServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_lifecycle_service.js";
import * as localizationTranslationKeyWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleFormFieldLifecycleId keeps of each GetFormFieldLifecycle response. */
interface SettleFormFieldLifecycleIdRecord {
  formFieldId: string;
  message: string;
  correlationId: string;
  description: string;
}

/** Where settleFormFieldLifecycleId hands each record. */
interface SettleFormFieldLifecycleIdTarget {
  forward(record: SettleFormFieldLifecycleIdRecord): Promise<void>;
}

/** Hands records to acme.experiments.v1.VariantSyncService. */
class SettleFormFieldLifecycleIdVariantSync implements SettleFormFieldLifecycleIdTarget {
  private readonly client: experimentsVariantSyncServiceApi.VariantSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantSyncServiceApi.VariantSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleFormFieldLifecycleIdRecord): Promise<void> {
    await call<experimentsVariantSyncServiceApi.ListVariantConflictsRequest, experimentsVariantSyncServiceApi.ListVariantConflictsResponse>(
      (request, done) => this.client.listVariantConflicts(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsVariantSyncServiceApi.ListVariantConflictsRequest.fromPartial({ page: { pageToken: record.description } }));
  }
}

/** Sends records to acme.localization.v1.TranslationKeyWorkflowService. */
class SettleFormFieldLifecycleIdTranslationKeyWorkflow implements SettleFormFieldLifecycleIdTarget {
  private readonly client: localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleFormFieldLifecycleIdRecord): Promise<void> {
    await call<localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowResponse>(
      (request, done) => this.client.resumeTranslationKeyWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowRequest.fromPartial({ reason: record.formFieldId, translationKeyId: record.message }));
  }
}

/**
 * Reads acme.forms.v1.FormFieldLifecycleService/GetFormFieldLifecycle and hands what it keeps to the sink of
 * its kind.
 */
export async function settleFormFieldLifecycleId(runtime: Runtime): Promise<void> {
  const source = new formsFormFieldLifecycleServiceApi.FormFieldLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<formsFormFieldLifecycleServiceApi.GetFormFieldLifecycleRequest, formsFormFieldLifecycleServiceApi.GetFormFieldLifecycleResponse>(
    (request, done) => source.getFormFieldLifecycle(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    formsFormFieldLifecycleServiceApi.GetFormFieldLifecycleRequest.fromPartial({ formFieldId: "primary-settle-form-field-lifecycle-id" }));
  const record: SettleFormFieldLifecycleIdRecord = {
    formFieldId: reply.formField?.formFieldId ?? "",
    message: reply.result?.message ?? "",
    correlationId: reply.result?.correlationId ?? "",
    description: text.normalize(reply.formField?.description ?? ""),
  };
  const sinks = new Map<string, SettleFormFieldLifecycleIdTarget>();
  sinks.set("variant-sync", new SettleFormFieldLifecycleIdVariantSync(runtime));
  sinks.set("translation-key-workflow", new SettleFormFieldLifecycleIdTranslationKeyWorkflow(runtime));
  await sinks.get("variant-sync")!.forward(record);
}
