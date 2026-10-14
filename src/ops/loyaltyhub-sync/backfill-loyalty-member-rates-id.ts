import * as experimentsVariantSyncServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as lendingLoanApplicationCalculationServiceApi from "../../../.cache/proto/acme/lending/v1/loan_application_calculation_service.js";
import * as loyaltyLoyaltyMemberCalculationServiceApi from "../../../.cache/proto/acme/loyalty/v1/loyalty_member_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillLoyaltyMemberRatesId keeps of each GetLoyaltyMemberRates response. */
interface BackfillLoyaltyMemberRatesIdRecord {
  loyaltyMemberId: string;
  status: string;
}

/** Where backfillLoyaltyMemberRatesId hands each record. */
interface BackfillLoyaltyMemberRatesIdSink {
  apply(record: BackfillLoyaltyMemberRatesIdRecord): Promise<void>;
}

/** Passes records to acme.lending.v1.LoanApplicationCalculationService. */
class BackfillLoyaltyMemberRatesIdLoanApplicationCalculation implements BackfillLoyaltyMemberRatesIdSink {
  private readonly client: lendingLoanApplicationCalculationServiceApi.LoanApplicationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new lendingLoanApplicationCalculationServiceApi.LoanApplicationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillLoyaltyMemberRatesIdRecord): Promise<void> {
    await call<lendingLoanApplicationCalculationServiceApi.QuoteLoanApplicationRequest, lendingLoanApplicationCalculationServiceApi.QuoteLoanApplicationResponse>(
      (request, done) => this.client.quoteLoanApplication(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      lendingLoanApplicationCalculationServiceApi.QuoteLoanApplicationRequest.fromPartial({ loanApplicationId: record.loyaltyMemberId }));
  }
}

/** Writes records to acme.experiments.v1.VariantSyncService. */
class BackfillLoyaltyMemberRatesIdVariantSync implements BackfillLoyaltyMemberRatesIdSink {
  private readonly client: experimentsVariantSyncServiceApi.VariantSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantSyncServiceApi.VariantSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillLoyaltyMemberRatesIdRecord): Promise<void> {
    await retry(() => call<experimentsVariantSyncServiceApi.SyncVariantsRequest, experimentsVariantSyncServiceApi.SyncVariantsResponse>(
      (request, done) => this.client.syncVariants(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsVariantSyncServiceApi.SyncVariantsRequest.fromPartial({ details: { resolution: record.loyaltyMemberId, checksum: record.status } })));
  }
}

/**
 * Reads acme.loyalty.v1.LoyaltyMemberCalculationService/GetLoyaltyMemberRates and hands what it keeps to the
 * sink of its kind.
 */
export async function backfillLoyaltyMemberRatesId(runtime: Runtime): Promise<void> {
  const origin = new loyaltyLoyaltyMemberCalculationServiceApi.LoyaltyMemberCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<loyaltyLoyaltyMemberCalculationServiceApi.GetLoyaltyMemberRatesRequest, loyaltyLoyaltyMemberCalculationServiceApi.GetLoyaltyMemberRatesResponse>(
    (request, done) => origin.getLoyaltyMemberRates(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    loyaltyLoyaltyMemberCalculationServiceApi.GetLoyaltyMemberRatesRequest.fromPartial({ loyaltyMemberId: "primary-backfill-loyalty-member-rates-id" }));
  const kept: BackfillLoyaltyMemberRatesIdRecord = {
    loyaltyMemberId: current.loyaltyMember?.loyaltyMemberId ?? "",
    status: current.result?.status ?? "",
  };
  const sinks: BackfillLoyaltyMemberRatesIdSink[] = [
    new BackfillLoyaltyMemberRatesIdLoanApplicationCalculation(runtime),
    new BackfillLoyaltyMemberRatesIdVariantSync(runtime),
  ];
  for (const sink of sinks) {
    await sink.apply(kept);
  }
}
