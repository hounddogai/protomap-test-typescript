import * as catalogProductServiceApi from "../../../.cache/proto/acme/catalog/v1/product_service.js";
import * as messagingChannelLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_lifecycle_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportProductStatus keeps of each CreateProduct response. */
interface ExportProductStatusRecord {
  status: string;
  message: string;
  code: string;
}

/** Where exportProductStatus hands each record. */
interface ExportProductStatusDestination {
  send(record: ExportProductStatusRecord): Promise<void>;
}

/** Sends records to acme.messaging.v1.ChannelLifecycleService. */
class ExportProductStatusChannelLifecycle implements ExportProductStatusDestination {
  private readonly client: messagingChannelLifecycleServiceApi.ChannelLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChannelLifecycleServiceApi.ChannelLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportProductStatusRecord): Promise<void> {
    await retry(() => call<messagingChannelLifecycleServiceApi.SuspendChannelRequest, messagingChannelLifecycleServiceApi.SuspendChannelResponse>(
      (request, done) => this.client.suspendChannel(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingChannelLifecycleServiceApi.SuspendChannelRequest.fromPartial({ details: { reasonCode: record.message }, channelId: record.status, reason: record.code })));
  }
}

/** Hands records to acme.webhooks.v1.WebhookDeliveryValidationService. */
class ExportProductStatusWebhookDeliveryValidation implements ExportProductStatusDestination {
  private readonly client: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportProductStatusRecord): Promise<void> {
    await retry(() => call<webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest, webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryResponse>(
      (request, done) => this.client.validateWebhookDelivery(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookDeliveryValidationServiceApi.ValidateWebhookDeliveryRequest.fromPartial({ webhookDelivery: { source: record.code } })));
  }
}

/** Reads acme.catalog.v1.ProductService/CreateProduct and hands what it keeps to the sink of its kind. */
export async function exportProductStatus(runtime: Runtime): Promise<void> {
  const source = new catalogProductServiceApi.ProductServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<catalogProductServiceApi.CreateProductRequest, catalogProductServiceApi.CreateProductResponse>(
    (request, done) => source.createProduct(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    catalogProductServiceApi.CreateProductRequest.fromPartial({ requestId: "main-export-product-status" }));
  const record: ExportProductStatusRecord = {
    status: reply.result?.status ?? "",
    message: reply.result?.message ?? "",
    code: reply.product?.code ?? "",
  };
  const sinks: ExportProductStatusDestination[] = [
    new ExportProductStatusChannelLifecycle(runtime),
    new ExportProductStatusWebhookDeliveryValidation(runtime),
  ];
  await sinks[0]!.send(record);
}
