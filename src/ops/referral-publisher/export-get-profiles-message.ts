import * as bankingBankAccountQueryServiceApi from "../../../.cache/proto/acme/banking/v1/bank_account_query_service.js";
import * as personalizationProfileServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as sellersSellerCalculationServiceApi from "../../../.cache/proto/acme/sellers/v1/seller_calculation_service.js";
import * as webhooksWebhookDeliveryQueryServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportGetProfilesMessage keeps of each BatchGetProfiles response. */
interface ExportGetProfilesMessageRecord {
  message: string;
  correlationId: string;
  nextPageToken: string;
}

/** Where exportGetProfilesMessage hands each record. */
interface ExportGetProfilesMessageSink {
  send(record: ExportGetProfilesMessageRecord): Promise<void>;
}

/** Hands records to acme.sellers.v1.SellerCalculationService. */
class ExportGetProfilesMessageSellerCalculation implements ExportGetProfilesMessageSink {
  private readonly client: sellersSellerCalculationServiceApi.SellerCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sellersSellerCalculationServiceApi.SellerCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportGetProfilesMessageRecord): Promise<void> {
    await retry(() => call<sellersSellerCalculationServiceApi.CompareSellerOptionsRequest, sellersSellerCalculationServiceApi.CompareSellerOptionsResponse>(
      (request, done) => this.client.compareSellerOptions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      sellersSellerCalculationServiceApi.CompareSellerOptionsRequest.fromPartial({ sellerId: record.correlationId })));
  }
}

/** Hands records to acme.webhooks.v1.WebhookDeliveryQueryService. */
class ExportGetProfilesMessageWebhookDeliveryQuery implements ExportGetProfilesMessageSink {
  private readonly client: webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryQueryServiceApi.WebhookDeliveryQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportGetProfilesMessageRecord): Promise<void> {
    await call<webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesRequest, webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesResponse>(
      (request, done) => this.client.findWebhookDeliveries(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webhooksWebhookDeliveryQueryServiceApi.FindWebhookDeliveriesRequest.fromPartial({ page: { pageToken: record.nextPageToken }, orderBy: record.correlationId, filter: { query: record.message } }));
  }
}

/** Passes records to acme.banking.v1.BankAccountQueryService. */
class ExportGetProfilesMessageBankAccountQuery implements ExportGetProfilesMessageSink {
  private readonly client: bankingBankAccountQueryServiceApi.BankAccountQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new bankingBankAccountQueryServiceApi.BankAccountQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportGetProfilesMessageRecord): Promise<void> {
    await retry(() => call<bankingBankAccountQueryServiceApi.BrowseBankAccountsRequest, bankingBankAccountQueryServiceApi.BrowseBankAccountsResponse>(
      (request, done) => this.client.browseBankAccounts(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      bankingBankAccountQueryServiceApi.BrowseBankAccountsRequest.fromPartial({ orderBy: record.correlationId })));
  }
}

/** Only logs, for kinds no service takes yet. */
class ExportGetProfilesMessageLogOnly implements ExportGetProfilesMessageSink {
  async send(record: ExportGetProfilesMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchExportGetProfilesMessage(kind: string, record: ExportGetProfilesMessageRecord, runtime: Runtime): Promise<void> {
  let write = (item: ExportGetProfilesMessageRecord): Promise<void> => new ExportGetProfilesMessageLogOnly().send(item);
  switch (kind) {
    case "seller-calculation":
      write = (item) => new ExportGetProfilesMessageSellerCalculation(runtime).send(item);
      break;
    case "webhook-delivery-query":
      write = (item) => new ExportGetProfilesMessageWebhookDeliveryQuery(runtime).send(item);
      break;
    case "bank-account-query":
      write = (item) => new ExportGetProfilesMessageBankAccountQuery(runtime).send(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.personalization.v1.ProfileService/BatchGetProfiles and hands what it keeps to the sink of its
 * kind.
 */
export async function exportGetProfilesMessage(runtime: Runtime): Promise<void> {
  const source = new personalizationProfileServiceApi.ProfileServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<personalizationProfileServiceApi.BatchGetProfilesRequest, personalizationProfileServiceApi.BatchGetProfilesResponse>(
    (request, done) => source.batchGetProfiles(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    personalizationProfileServiceApi.BatchGetProfilesRequest.fromPartial({}));
  const record: ExportGetProfilesMessageRecord = {
    message: text.normalize(found.result?.message ?? ""),
    correlationId: found.result?.correlationId ?? "",
    nextPageToken: text.normalize(found.pageInfo?.nextPageToken ?? ""),
  };
  await dispatchExportGetProfilesMessage("webhook-delivery-query", record, runtime);
}
