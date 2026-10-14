import * as localizationLocaleValidationServiceApi from "../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as messagingChannelReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_reporting_service.js";
import * as sponsorshipsSponsorServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_service.js";
import * as webhooksWebhookEndpointWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateChannelTotalsId keeps of each CountChannelTotals response. */
interface PropagateChannelTotalsIdRecord {
  correlationId: string;
  message: string;
  status: string;
}

/** Where propagateChannelTotalsId hands each record. */
interface PropagateChannelTotalsIdDestination {
  forward(record: PropagateChannelTotalsIdRecord): Promise<void>;
}

/** Sends records to acme.localization.v1.LocaleValidationService. */
class PropagateChannelTotalsIdLocaleValidation implements PropagateChannelTotalsIdDestination {
  private readonly client: localizationLocaleValidationServiceApi.LocaleValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleValidationServiceApi.LocaleValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagateChannelTotalsIdRecord): Promise<void> {
    await retry(() => call<localizationLocaleValidationServiceApi.PreviewLocaleRequest, localizationLocaleValidationServiceApi.PreviewLocaleResponse>(
      (request, done) => this.client.previewLocale(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationLocaleValidationServiceApi.PreviewLocaleRequest.fromPartial({ localeId: record.status, locale: { description: record.message, localeId: record.correlationId } })));
  }
}

/** Sends records to acme.sponsorships.v1.SponsorService. */
class PropagateChannelTotalsIdSponsor implements PropagateChannelTotalsIdDestination {
  private readonly client: sponsorshipsSponsorServiceApi.SponsorServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sponsorshipsSponsorServiceApi.SponsorServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagateChannelTotalsIdRecord): Promise<void> {
    await call<sponsorshipsSponsorServiceApi.UpdateSponsorRequest, sponsorshipsSponsorServiceApi.UpdateSponsorResponse>(
      (request, done) => this.client.updateSponsor(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      sponsorshipsSponsorServiceApi.UpdateSponsorRequest.fromPartial({ sponsor: { sponsorId: record.status } }));
  }
}

/** Sends records to acme.webhooks.v1.WebhookEndpointWorkflowService. */
class PropagateChannelTotalsIdWebhookEndpointWorkflow implements PropagateChannelTotalsIdDestination {
  private readonly client: webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagateChannelTotalsIdRecord): Promise<void> {
    await retry(() => call<webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowResponse>(
      (request, done) => this.client.cancelWebhookEndpointWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowRequest.fromPartial({ details: { initiatedBy: record.message }, webhookEndpoint: { code: record.correlationId } })));
  }
}

/** Runs the action registered for kind. */
async function actOnPropagateChannelTotalsId(kind: string, record: PropagateChannelTotalsIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "locale-validation": () => new PropagateChannelTotalsIdLocaleValidation(runtime).forward(record),
    "sponsor": () => new PropagateChannelTotalsIdSponsor(runtime).forward(record),
    "webhook-endpoint-workflow": () => new PropagateChannelTotalsIdWebhookEndpointWorkflow(runtime).forward(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.messaging.v1.ChannelReportingService/CountChannelTotals and hands what it keeps to the sink of
 * its kind.
 */
export async function propagateChannelTotalsId(runtime: Runtime): Promise<void> {
  const origin = new messagingChannelReportingServiceApi.ChannelReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<messagingChannelReportingServiceApi.CountChannelTotalsRequest, messagingChannelReportingServiceApi.CountChannelTotalsResponse>(
    (request, done) => origin.countChannelTotals(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    messagingChannelReportingServiceApi.CountChannelTotalsRequest.fromPartial({ orderBy: "main-propagate-channel-totals-id" })));
  const entry: PropagateChannelTotalsIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    message: text.normalize(reply.result?.message ?? ""),
    status: reply.result?.status ?? "",
  };
  await actOnPropagateChannelTotalsId("sponsor", entry, runtime);
}
