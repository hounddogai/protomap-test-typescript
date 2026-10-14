import * as catalogProductServiceApi from "../../../.cache/proto/acme/catalog/v1/product_service.js";
import * as identitySessionValidationServiceApi from "../../../.cache/proto/acme/identity/v1/session_validation_service.js";
import * as licensingSoftwareLicenseServiceApi from "../../../.cache/proto/acme/licensing/v1/software_license_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillProductMessage keeps of each GetProduct response. */
interface BackfillProductMessageRecord {
  message: string;
  code: string;
  productId: string;
  name: string;
}

/** Where backfillProductMessage hands each record. */
interface BackfillProductMessageSink {
  apply(record: BackfillProductMessageRecord): Promise<void>;
}

/** Writes records to acme.webhooks.v1.WebhookDeliveryValidationService. */
class BackfillProductMessageWebhookDeliveryValidation implements BackfillProductMessageSink {
  private readonly client: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillProductMessageRecord): Promise<void> {
    await call<webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest, webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesResponse>(
      (request, done) => this.client.lintWebhookDeliveries(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookDeliveryValidationServiceApi.LintWebhookDeliveriesRequest.fromPartial({ webhookDeliveryId: record.productId, webhookDelivery: { kind: record.name } }));
  }
}

/** Writes records to acme.identity.v1.SessionValidationService. */
class BackfillProductMessageSessionValidation implements BackfillProductMessageSink {
  private readonly client: identitySessionValidationServiceApi.SessionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new identitySessionValidationServiceApi.SessionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillProductMessageRecord): Promise<void> {
    await retry(() => call<identitySessionValidationServiceApi.ExplainSessionDecisionRequest, identitySessionValidationServiceApi.ExplainSessionDecisionResponse>(
      (request, done) => this.client.explainSessionDecision(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      identitySessionValidationServiceApi.ExplainSessionDecisionRequest.fromPartial({ reason: record.message, session: { sessionId: record.productId } })));
  }
}

/** Writes records to acme.licensing.v1.SoftwareLicenseService. */
class BackfillProductMessageSoftwareLicense implements BackfillProductMessageSink {
  private readonly client: licensingSoftwareLicenseServiceApi.SoftwareLicenseServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new licensingSoftwareLicenseServiceApi.SoftwareLicenseServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillProductMessageRecord): Promise<void> {
    await call<licensingSoftwareLicenseServiceApi.CreateSoftwareLicenseRequest, licensingSoftwareLicenseServiceApi.CreateSoftwareLicenseResponse>(
      (request, done) => this.client.createSoftwareLicense(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      licensingSoftwareLicenseServiceApi.CreateSoftwareLicenseRequest.fromPartial({ requestId: record.message, softwareLicense: { currencyCode: record.productId } }));
  }
}

/** Runs the action registered for kind. */
async function actOnBackfillProductMessage(kind: string, record: BackfillProductMessageRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "webhook-delivery-validation": () => new BackfillProductMessageWebhookDeliveryValidation(runtime).apply(record),
    "session-validation": () => new BackfillProductMessageSessionValidation(runtime).apply(record),
    "software-license": () => new BackfillProductMessageSoftwareLicense(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/** Reads acme.catalog.v1.ProductService/GetProduct and hands what it keeps to the sink of its kind. */
export async function backfillProductMessage(runtime: Runtime): Promise<void> {
  const source = new catalogProductServiceApi.ProductServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<catalogProductServiceApi.GetProductRequest, catalogProductServiceApi.GetProductResponse>(
    (request, done) => source.getProduct(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    catalogProductServiceApi.GetProductRequest.fromPartial({ productId: "current-backfill-product-message" })));
  const record: BackfillProductMessageRecord = {
    message: response.result?.message ?? "",
    code: response.product?.code ?? "",
    productId: text.normalize(response.product?.productId ?? ""),
    name: text.normalize(response.product?.name ?? ""),
  };
  await actOnBackfillProductMessage("webhook-delivery-validation", record, runtime);
}
