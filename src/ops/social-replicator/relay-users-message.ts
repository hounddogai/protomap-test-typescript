import * as bankingBankAccountServiceApi from "../../../.cache/proto/acme/banking/v1/bank_account_service.js";
import * as corporateeventsCorporateEventQueryServiceApi from "../../../.cache/proto/acme/corporateevents/v1/corporate_event_query_service.js";
import * as experimentsExposureLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_lifecycle_service.js";
import * as identityUserValidationServiceApi from "../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayUsersMessage keeps of each LintUsers response. */
interface RelayUsersMessageRecord {
  message: string;
  correlationId: string;
  referenceId: string;
}

/** Where relayUsersMessage hands each record. */
interface RelayUsersMessageTarget {
  deliver(record: RelayUsersMessageRecord): Promise<void>;
}

/** Passes records to acme.banking.v1.BankAccountService. */
class RelayUsersMessageBankAccount implements RelayUsersMessageTarget {
  private readonly client: bankingBankAccountServiceApi.BankAccountServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new bankingBankAccountServiceApi.BankAccountServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RelayUsersMessageRecord): Promise<void> {
    await call<bankingBankAccountServiceApi.CreateBankAccountRequest, bankingBankAccountServiceApi.CreateBankAccountResponse>(
      (request, done) => this.client.createBankAccount(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      bankingBankAccountServiceApi.CreateBankAccountRequest.fromPartial({ requestId: record.message, bankAccount: { currencyCode: record.correlationId } }));
  }
}

/** Writes records to acme.corporateevents.v1.CorporateEventQueryService. */
class RelayUsersMessageCorporateEventQuery implements RelayUsersMessageTarget {
  private readonly client: corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RelayUsersMessageRecord): Promise<void> {
    await retry(() => call<corporateeventsCorporateEventQueryServiceApi.SummarizeCorporateEventsRequest, corporateeventsCorporateEventQueryServiceApi.SummarizeCorporateEventsResponse>(
      (request, done) => this.client.summarizeCorporateEvents(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      corporateeventsCorporateEventQueryServiceApi.SummarizeCorporateEventsRequest.fromPartial({ details: { cron: record.referenceId, format: record.correlationId }, reason: record.message })));
  }
}

/** Passes records to acme.experiments.v1.ExposureLifecycleService. */
class RelayUsersMessageExposureLifecycle implements RelayUsersMessageTarget {
  private readonly client: experimentsExposureLifecycleServiceApi.ExposureLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExposureLifecycleServiceApi.ExposureLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RelayUsersMessageRecord): Promise<void> {
    await call<experimentsExposureLifecycleServiceApi.ActivateExposureRequest, experimentsExposureLifecycleServiceApi.ActivateExposureResponse>(
      (request, done) => this.client.activateExposure(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsExposureLifecycleServiceApi.ActivateExposureRequest.fromPartial({ exposureId: record.message, reason: record.correlationId, details: { reasonCode: record.referenceId } }));
  }
}

/** Reads acme.identity.v1.UserValidationService/LintUsers and hands what it keeps to the sink of its kind. */
export async function relayUsersMessage(runtime: Runtime): Promise<void> {
  const source = new identityUserValidationServiceApi.UserValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<identityUserValidationServiceApi.LintUsersRequest, identityUserValidationServiceApi.LintUsersResponse>(
    (request, done) => source.lintUsers(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    identityUserValidationServiceApi.LintUsersRequest.fromPartial({ userId: "default-relay-users-message" }));
  const entry: RelayUsersMessageRecord = {
    message: response.result?.message ?? "",
    correlationId: response.result?.correlationId ?? "",
    referenceId: response.outcome?.referenceId ?? "",
  };
  const sinks: RelayUsersMessageTarget[] = [
    new RelayUsersMessageBankAccount(runtime),
    new RelayUsersMessageCorporateEventQuery(runtime),
    new RelayUsersMessageExposureLifecycle(runtime),
  ];
  await sinks[1]!.deliver(entry);
}
