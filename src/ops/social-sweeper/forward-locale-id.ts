import * as formsFormFieldLifecycleServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_lifecycle_service.js";
import * as localizationLocaleLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import * as mediaRenditionQueryServiceApi from "../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as performersPerformerServiceApi from "../../../.cache/proto/acme/performers/v1/performer_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardLocaleId keeps of each RenewLocale response. */
interface ForwardLocaleIdRecord {
  localeId: string;
  correlationId: string;
}

/** Where forwardLocaleId hands each record. */
interface ForwardLocaleIdDestination {
  send(record: ForwardLocaleIdRecord): Promise<void>;
}

/** Passes records to acme.media.v1.RenditionQueryService. */
class ForwardLocaleIdRenditionQuery implements ForwardLocaleIdDestination {
  private readonly client: mediaRenditionQueryServiceApi.RenditionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionQueryServiceApi.RenditionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardLocaleIdRecord): Promise<void> {
    await call<mediaRenditionQueryServiceApi.SuggestRenditionsRequest, mediaRenditionQueryServiceApi.SuggestRenditionsResponse>(
      (request, done) => this.client.suggestRenditions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaRenditionQueryServiceApi.SuggestRenditionsRequest.fromPartial({ filter: { ownerId: record.localeId } }));
  }
}

/** Sends records to acme.performers.v1.PerformerService. */
class ForwardLocaleIdPerformer implements ForwardLocaleIdDestination {
  private readonly client: performersPerformerServiceApi.PerformerServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new performersPerformerServiceApi.PerformerServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardLocaleIdRecord): Promise<void> {
    await call<performersPerformerServiceApi.DeletePerformerRequest, performersPerformerServiceApi.DeletePerformerResponse>(
      (request, done) => this.client.deletePerformer(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      performersPerformerServiceApi.DeletePerformerRequest.fromPartial({ reason: record.localeId }));
  }
}

/** Passes records to acme.forms.v1.FormFieldLifecycleService. */
class ForwardLocaleIdFormFieldLifecycle implements ForwardLocaleIdDestination {
  private readonly client: formsFormFieldLifecycleServiceApi.FormFieldLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormFieldLifecycleServiceApi.FormFieldLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardLocaleIdRecord): Promise<void> {
    await call<formsFormFieldLifecycleServiceApi.RenewFormFieldRequest, formsFormFieldLifecycleServiceApi.RenewFormFieldResponse>(
      (request, done) => this.client.renewFormField(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      formsFormFieldLifecycleServiceApi.RenewFormFieldRequest.fromPartial({ formFieldId: record.correlationId }));
  }
}

/**
 * Reads acme.localization.v1.LocaleLifecycleService/RenewLocale and hands what it keeps to the sink of its
 * kind.
 */
export async function forwardLocaleId(runtime: Runtime): Promise<void> {
  const origin = new localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<localizationLocaleLifecycleServiceApi.RenewLocaleRequest, localizationLocaleLifecycleServiceApi.RenewLocaleResponse>(
    (request, done) => origin.renewLocale(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    localizationLocaleLifecycleServiceApi.RenewLocaleRequest.fromPartial({ reason: "live-forward-locale-id" })));
  const record: ForwardLocaleIdRecord = {
    localeId: reply.locale?.localeId ?? "",
    correlationId: reply.result?.correlationId ?? "",
  };
  const sinks: ForwardLocaleIdDestination[] = [
    new ForwardLocaleIdRenditionQuery(runtime),
    new ForwardLocaleIdPerformer(runtime),
    new ForwardLocaleIdFormFieldLifecycle(runtime),
  ];
  for (const sink of sinks) {
    await sink.send(record);
  }
}
