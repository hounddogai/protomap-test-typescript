import * as contentContentBlockWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/content_block_workflow_service.js";
import * as dispatchDispatchOrderQueryServiceApi from "../../../.cache/proto/acme/dispatch/v1/dispatch_order_query_service.js";
import * as formsFormFieldCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardTranslationKeyName keeps of each RecallTranslationKey response. */
interface ForwardTranslationKeyNameRecord {
  name: string;
  translationKeyId: string;
  message: string;
}

/** Where forwardTranslationKeyName hands each record. */
interface ForwardTranslationKeyNameDestination {
  deliver(record: ForwardTranslationKeyNameRecord): Promise<void>;
}

/** Hands records to acme.content.v1.ContentBlockWorkflowService. */
class ForwardTranslationKeyNameContentBlockWorkflow implements ForwardTranslationKeyNameDestination {
  private readonly client: contentContentBlockWorkflowServiceApi.ContentBlockWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentBlockWorkflowServiceApi.ContentBlockWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ForwardTranslationKeyNameRecord): Promise<void> {
    await retry(() => call<contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowResponse>(
      (request, done) => this.client.startContentBlockWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowRequest.fromPartial({ reason: record.name, details: { step: record.translationKeyId } })));
  }
}

/** Passes records to acme.dispatch.v1.DispatchOrderQueryService. */
class ForwardTranslationKeyNameDispatchOrderQuery implements ForwardTranslationKeyNameDestination {
  private readonly client: dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ForwardTranslationKeyNameRecord): Promise<void> {
    await call<dispatchDispatchOrderQueryServiceApi.BrowseDispatchOrdersRequest, dispatchDispatchOrderQueryServiceApi.BrowseDispatchOrdersResponse>(
      (request, done) => this.client.browseDispatchOrders(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      dispatchDispatchOrderQueryServiceApi.BrowseDispatchOrdersRequest.fromPartial({ page: { pageToken: record.name } }));
  }
}

/** Hands records to acme.forms.v1.FormFieldCalculationService. */
class ForwardTranslationKeyNameFormFieldCalculation implements ForwardTranslationKeyNameDestination {
  private readonly client: formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ForwardTranslationKeyNameRecord): Promise<void> {
    await retry(() => call<formsFormFieldCalculationServiceApi.QuoteFormFieldRequest, formsFormFieldCalculationServiceApi.QuoteFormFieldResponse>(
      (request, done) => this.client.quoteFormField(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      formsFormFieldCalculationServiceApi.QuoteFormFieldRequest.fromPartial({ formField: { name: record.translationKeyId }, formFieldId: record.name })));
  }
}

/** Writes records to acme.localization.v1.TranslationJobReportingService. */
class ForwardTranslationKeyNameTranslationJobReporting implements ForwardTranslationKeyNameDestination {
  private readonly client: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ForwardTranslationKeyNameRecord): Promise<void> {
    await call<localizationTranslationJobReportingServiceApi.FetchTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.FetchTranslationJobReportResponse>(
      (request, done) => this.client.fetchTranslationJobReport(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      localizationTranslationJobReportingServiceApi.FetchTranslationJobReportRequest.fromPartial({ translationJobId: record.message }));
  }
}

/**
 * Reads acme.localization.v1.TranslationKeyApprovalService/RecallTranslationKey and hands what it keeps to
 * the sink of its kind.
 */
export async function forwardTranslationKeyName(runtime: Runtime): Promise<void> {
  const upstream = new localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyResponse>(
    (request, done) => upstream.recallTranslationKey(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    localizationTranslationKeyApprovalServiceApi.RecallTranslationKeyRequest.fromPartial({ reason: "nightly-forward-translation-key-name" })));
  const entry: ForwardTranslationKeyNameRecord = {
    name: found.translationKey?.name ?? "",
    translationKeyId: found.translationKey?.translationKeyId ?? "",
    message: found.result?.message ?? "",
  };
  const sinks: ForwardTranslationKeyNameDestination[] = [
    new ForwardTranslationKeyNameContentBlockWorkflow(runtime),
    new ForwardTranslationKeyNameDispatchOrderQuery(runtime),
    new ForwardTranslationKeyNameFormFieldCalculation(runtime),
    new ForwardTranslationKeyNameTranslationJobReporting(runtime),
  ];
  for (const sink of sinks) {
    await sink.deliver(entry);
  }
}
