import * as admissionsAdmissionQueryServiceApi from "../../../.cache/proto/acme/admissions/v1/admission_query_service.js";
import * as authorizationAccessPolicyValidationServiceApi from "../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as deliveriesDeliveryQueryServiceApi from "../../../.cache/proto/acme/deliveries/v1/delivery_query_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffClientSessionConnectionSubject keeps of each TestClientSessionConnection response. */
interface HandOffClientSessionConnectionSubjectRecord {
  subject: string;
  status: string;
}

/** Where handOffClientSessionConnectionSubject hands each record. */
interface HandOffClientSessionConnectionSubjectWriter {
  forward(record: HandOffClientSessionConnectionSubjectRecord): Promise<void>;
}

/** Sends records to acme.deliveries.v1.DeliveryQueryService. */
class HandOffClientSessionConnectionSubjectDeliveryQuery implements HandOffClientSessionConnectionSubjectWriter {
  private readonly client: deliveriesDeliveryQueryServiceApi.DeliveryQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new deliveriesDeliveryQueryServiceApi.DeliveryQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: HandOffClientSessionConnectionSubjectRecord): Promise<void> {
    await call<deliveriesDeliveryQueryServiceApi.FindDeliveriesRequest, deliveriesDeliveryQueryServiceApi.FindDeliveriesResponse>(
      (request, done) => this.client.findDeliveries(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      deliveriesDeliveryQueryServiceApi.FindDeliveriesRequest.fromPartial({ filter: { query: record.status } }));
  }
}

/** Hands records to acme.authorization.v1.AccessPolicyValidationService. */
class HandOffClientSessionConnectionSubjectAccessPolicyValidation implements HandOffClientSessionConnectionSubjectWriter {
  private readonly client: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: HandOffClientSessionConnectionSubjectRecord): Promise<void> {
    await call<authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest, authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionResponse>(
      (request, done) => this.client.explainAccessPolicyDecision(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      authorizationAccessPolicyValidationServiceApi.ExplainAccessPolicyDecisionRequest.fromPartial({ reason: record.status, accessPolicy: { description: record.subject } }));
  }
}

/** Writes records to acme.admissions.v1.AdmissionQueryService. */
class HandOffClientSessionConnectionSubjectAdmissionQuery implements HandOffClientSessionConnectionSubjectWriter {
  private readonly client: admissionsAdmissionQueryServiceApi.AdmissionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new admissionsAdmissionQueryServiceApi.AdmissionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: HandOffClientSessionConnectionSubjectRecord): Promise<void> {
    await call<admissionsAdmissionQueryServiceApi.CountAdmissionsRequest, admissionsAdmissionQueryServiceApi.CountAdmissionsResponse>(
      (request, done) => this.client.countAdmissions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      admissionsAdmissionQueryServiceApi.CountAdmissionsRequest.fromPartial({ filter: { ownerId: record.status } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class HandOffClientSessionConnectionSubjectLogOnly implements HandOffClientSessionConnectionSubjectWriter {
  async forward(record: HandOffClientSessionConnectionSubjectRecord): Promise<void> {
    console.info("no sink for record", record.subject);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverHandOffClientSessionConnectionSubject(kind: string, record: HandOffClientSessionConnectionSubjectRecord, runtime: Runtime): Promise<void> {
  let sink: HandOffClientSessionConnectionSubjectWriter = new HandOffClientSessionConnectionSubjectLogOnly();
  switch (kind) {
    case "delivery-query":
      sink = new HandOffClientSessionConnectionSubjectDeliveryQuery(runtime);
      break;
    case "access-policy-validation":
      sink = new HandOffClientSessionConnectionSubjectAccessPolicyValidation(runtime);
      break;
    case "admission-query":
      sink = new HandOffClientSessionConnectionSubjectAdmissionQuery(runtime);
      break;
  }
  await sink.forward(record);
}

/**
 * Reads acme.webbff.v1.ClientSessionIntegrationService/TestClientSessionConnection and hands what it keeps to
 * the sink of its kind.
 */
export async function handOffClientSessionConnectionSubject(runtime: Runtime): Promise<void> {
  const origin = new webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest, webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionResponse>(
    (request, done) => origin.testClientSessionConnection(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest.fromPartial({ clientSessionId: "default-hand-off-client-session-connection-subject" }));
  const row: HandOffClientSessionConnectionSubjectRecord = {
    subject: reply.clientSession?.subject ?? "",
    status: reply.result?.status ?? "",
  };
  await deliverHandOffClientSessionConnectionSubject("delivery-query", row, runtime);
}
