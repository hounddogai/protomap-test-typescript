import * as experimentsExperimentQueryServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as formsFormApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as licensingSoftwareLicenseQueryServiceApi from "../../../.cache/proto/acme/licensing/v1/software_license_query_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayFormNotes keeps of each EscalateForm response. */
interface RelayFormNotesRecord {
  notes: string;
  number: string;
  referenceId: string;
}

/** Where relayFormNotes hands each record. */
interface RelayFormNotesTarget {
  send(record: RelayFormNotesRecord): Promise<void>;
}

/** Hands records to acme.licensing.v1.SoftwareLicenseQueryService. */
class RelayFormNotesSoftwareLicenseQuery implements RelayFormNotesTarget {
  private readonly client: licensingSoftwareLicenseQueryServiceApi.SoftwareLicenseQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new licensingSoftwareLicenseQueryServiceApi.SoftwareLicenseQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RelayFormNotesRecord): Promise<void> {
    await call<licensingSoftwareLicenseQueryServiceApi.SummarizeSoftwareLicensesRequest, licensingSoftwareLicenseQueryServiceApi.SummarizeSoftwareLicensesResponse>(
      (request, done) => this.client.summarizeSoftwareLicenses(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      licensingSoftwareLicenseQueryServiceApi.SummarizeSoftwareLicensesRequest.fromPartial({ softwareLicenseId: record.notes, details: { format: record.number, cron: record.referenceId } }));
  }
}

/** Hands records to acme.webhooks.v1.WebhookDeliveryQueryService. */
class RelayFormNotesWebhookDeliveryQuery implements RelayFormNotesTarget {
  private readonly client: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RelayFormNotesRecord): Promise<void> {
    await call<webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesResponse>(
      (request, done) => this.client.suggestWebhookDeliveries(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webhooksWebhookDeliveryQueryServiceApi.SuggestWebhookDeliveriesRequest.fromPartial({ page: { pageToken: record.referenceId }, orderBy: record.number }));
  }
}

/** Hands records to acme.notifications.v1.NotificationQueryService. */
class RelayFormNotesNotificationQuery implements RelayFormNotesTarget {
  private readonly client: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationQueryServiceApi.NotificationQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RelayFormNotesRecord): Promise<void> {
    await call<notificationsNotificationQueryServiceApi.FindNotificationsRequest, notificationsNotificationQueryServiceApi.FindNotificationsResponse>(
      (request, done) => this.client.findNotifications(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsNotificationQueryServiceApi.FindNotificationsRequest.fromPartial({ filter: { ownerId: record.notes, region: record.number } }));
  }
}

/** Writes records to acme.experiments.v1.ExperimentQueryService. */
class RelayFormNotesExperimentQuery implements RelayFormNotesTarget {
  private readonly client: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RelayFormNotesRecord): Promise<void> {
    await call<experimentsExperimentQueryServiceApi.SummarizeExperimentsRequest, experimentsExperimentQueryServiceApi.SummarizeExperimentsResponse>(
      (request, done) => this.client.summarizeExperiments(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsExperimentQueryServiceApi.SummarizeExperimentsRequest.fromPartial({ experimentId: record.number }));
  }
}

/** Only logs, for kinds no service takes yet. */
class RelayFormNotesLogOnly implements RelayFormNotesTarget {
  async send(record: RelayFormNotesRecord): Promise<void> {
    console.info("no sink for record", record.notes);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverRelayFormNotes(kind: string, record: RelayFormNotesRecord, runtime: Runtime): Promise<void> {
  let sink: RelayFormNotesTarget = new RelayFormNotesLogOnly();
  switch (kind) {
    case "software-license-query":
      sink = new RelayFormNotesSoftwareLicenseQuery(runtime);
      break;
    case "webhook-delivery-query":
      sink = new RelayFormNotesWebhookDeliveryQuery(runtime);
      break;
    case "notification-query":
      sink = new RelayFormNotesNotificationQuery(runtime);
      break;
    case "experiment-query":
      sink = new RelayFormNotesExperimentQuery(runtime);
      break;
  }
  await sink.send(record);
}

/** Reads acme.forms.v1.FormApprovalService/EscalateForm and hands what it keeps to the sink of its kind. */
export async function relayFormNotes(runtime: Runtime): Promise<void> {
  const upstream = new formsFormApprovalServiceApi.FormApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<formsFormApprovalServiceApi.EscalateFormRequest, formsFormApprovalServiceApi.EscalateFormResponse>(
    (request, done) => upstream.escalateForm(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    formsFormApprovalServiceApi.EscalateFormRequest.fromPartial({ reason: "current-relay-form-notes" }));
  const entry: RelayFormNotesRecord = {
    notes: found.form?.notes ?? "",
    number: found.form?.number ?? "",
    referenceId: text.normalize(found.outcome?.referenceId ?? ""),
  };
  await deliverRelayFormNotes("experiment-query", entry, runtime);
}
