import * as ledgerLedgerAccountQueryServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as secretsSecretQueryServiceApi from "../../../.cache/proto/acme/secrets/v1/secret_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copySecretsId keeps of each FindSecrets response. */
interface CopySecretsIdRecord {
  correlationId: string;
  message: string;
  status: string;
}

/** Where copySecretsId hands each record. */
interface CopySecretsIdWriter {
  deliver(record: CopySecretsIdRecord): Promise<void>;
}

/** Passes records to acme.ledger.v1.LedgerAccountQueryService. */
class CopySecretsIdLedgerAccountQuery implements CopySecretsIdWriter {
  private readonly client: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopySecretsIdRecord): Promise<void> {
    await call<ledgerLedgerAccountQueryServiceApi.LookupLedgerAccountRequest, ledgerLedgerAccountQueryServiceApi.LookupLedgerAccountResponse>(
      (request, done) => this.client.lookupLedgerAccount(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      ledgerLedgerAccountQueryServiceApi.LookupLedgerAccountRequest.fromPartial({ ledgerAccountId: record.status }));
  }
}

/** Passes records to acme.personalization.v1.RecommendationQueryService. */
class CopySecretsIdRecommendationQuery implements CopySecretsIdWriter {
  private readonly client: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopySecretsIdRecord): Promise<void> {
    await call<personalizationRecommendationQueryServiceApi.SummarizeRecommendationsRequest, personalizationRecommendationQueryServiceApi.SummarizeRecommendationsResponse>(
      (request, done) => this.client.summarizeRecommendations(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      personalizationRecommendationQueryServiceApi.SummarizeRecommendationsRequest.fromPartial({ reason: record.status, details: { cron: record.message }, recommendationId: record.correlationId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CopySecretsIdLogOnly implements CopySecretsIdWriter {
  async deliver(record: CopySecretsIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchCopySecretsId(kind: string, record: CopySecretsIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: CopySecretsIdRecord): Promise<void> => new CopySecretsIdLogOnly().deliver(item);
  switch (kind) {
    case "ledger-account-query":
      write = (item) => new CopySecretsIdLedgerAccountQuery(runtime).deliver(item);
      break;
    case "recommendation-query":
      write = (item) => new CopySecretsIdRecommendationQuery(runtime).deliver(item);
      break;
  }
  await write(record);
}

/** Reads acme.secrets.v1.SecretQueryService/FindSecrets and hands what it keeps to the sink of its kind. */
export async function copySecretsId(runtime: Runtime): Promise<void> {
  const source = new secretsSecretQueryServiceApi.SecretQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<secretsSecretQueryServiceApi.FindSecretsRequest, secretsSecretQueryServiceApi.FindSecretsResponse>(
    (request, done) => source.findSecrets(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    secretsSecretQueryServiceApi.FindSecretsRequest.fromPartial({ orderBy: "primary-copy-secrets-id" }));
  const kept: CopySecretsIdRecord = {
    correlationId: current.result?.correlationId ?? "",
    message: current.result?.message ?? "",
    status: current.result?.status ?? "",
  };
  await dispatchCopySecretsId("ledger-account-query", kept, runtime);
}
