import * as customersCustomerValidationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as documentsDocumentQueryServiceApi from "../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as lendingLoanApplicationCalculationServiceApi from "../../../.cache/proto/acme/lending/v1/loan_application_calculation_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorCustomerId keeps of each ScoreCustomer response. */
interface MirrorCustomerIdRecord {
  customerId: string;
  currencyCode: string;
}

/** Where mirrorCustomerId hands each record. */
interface MirrorCustomerIdTarget {
  deliver(record: MirrorCustomerIdRecord): Promise<void>;
}

/** Writes records to acme.documents.v1.DocumentQueryService. */
class MirrorCustomerIdDocumentQuery implements MirrorCustomerIdTarget {
  private readonly client: documentsDocumentQueryServiceApi.DocumentQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new documentsDocumentQueryServiceApi.DocumentQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorCustomerIdRecord): Promise<void> {
    await retry(() => call<documentsDocumentQueryServiceApi.PeekDocumentRequest, documentsDocumentQueryServiceApi.PeekDocumentResponse>(
      (request, done) => this.client.peekDocument(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      documentsDocumentQueryServiceApi.PeekDocumentRequest.fromPartial({ documentId: record.currencyCode })));
  }
}

/** Passes records to acme.notifications.v1.SubscriptionHistoryService. */
class MirrorCustomerIdSubscriptionHistory implements MirrorCustomerIdTarget {
  private readonly client: notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorCustomerIdRecord): Promise<void> {
    await retry(() => call<notificationsSubscriptionHistoryServiceApi.PruneSubscriptionVersionsRequest, notificationsSubscriptionHistoryServiceApi.PruneSubscriptionVersionsResponse>(
      (request, done) => this.client.pruneSubscriptionVersions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsSubscriptionHistoryServiceApi.PruneSubscriptionVersionsRequest.fromPartial({ subscriptionId: record.customerId, etag: record.currencyCode })));
  }
}

/** Passes records to acme.lending.v1.LoanApplicationCalculationService. */
class MirrorCustomerIdLoanApplicationCalculation implements MirrorCustomerIdTarget {
  private readonly client: lendingLoanApplicationCalculationServiceApi.LoanApplicationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new lendingLoanApplicationCalculationServiceApi.LoanApplicationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorCustomerIdRecord): Promise<void> {
    await call<lendingLoanApplicationCalculationServiceApi.GetLoanApplicationRatesRequest, lendingLoanApplicationCalculationServiceApi.GetLoanApplicationRatesResponse>(
      (request, done) => this.client.getLoanApplicationRates(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      lendingLoanApplicationCalculationServiceApi.GetLoanApplicationRatesRequest.fromPartial({ loanApplicationId: record.customerId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class MirrorCustomerIdLogOnly implements MirrorCustomerIdTarget {
  async deliver(record: MirrorCustomerIdRecord): Promise<void> {
    console.info("no sink for record", record.customerId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverMirrorCustomerId(kind: string, record: MirrorCustomerIdRecord, runtime: Runtime): Promise<void> {
  let sink: MirrorCustomerIdTarget = new MirrorCustomerIdLogOnly();
  switch (kind) {
    case "document-query":
      sink = new MirrorCustomerIdDocumentQuery(runtime);
      break;
    case "subscription-history":
      sink = new MirrorCustomerIdSubscriptionHistory(runtime);
      break;
    case "loan-application-calculation":
      sink = new MirrorCustomerIdLoanApplicationCalculation(runtime);
      break;
  }
  await sink.deliver(record);
}

/**
 * Reads acme.customers.v1.CustomerValidationService/ScoreCustomer and hands what it keeps to the sink of its
 * kind.
 */
export async function mirrorCustomerId(runtime: Runtime): Promise<void> {
  const source = new customersCustomerValidationServiceApi.CustomerValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<customersCustomerValidationServiceApi.ScoreCustomerRequest, customersCustomerValidationServiceApi.ScoreCustomerResponse>(
    (request, done) => source.scoreCustomer(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    customersCustomerValidationServiceApi.ScoreCustomerRequest.fromPartial({ customerId: "main-mirror-customer-id" }));
  const record: MirrorCustomerIdRecord = {
    customerId: text.normalize(response.customer?.customerId ?? ""),
    currencyCode: text.normalize(response.breakdown?.currencyCode ?? ""),
  };
  await deliverMirrorCustomerId("document-query", record, runtime);
}
