import * as broadcastsBroadcastServiceApi from "../../../.cache/proto/acme/broadcasts/v1/broadcast_service.js";
import * as campaignsCampaignBudgetValidationServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_validation_service.js";
import * as configurationConfigSetCalculationServiceApi from "../../../.cache/proto/acme/configuration/v1/config_set_calculation_service.js";
import * as experimentsExposureValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as keymanagementCryptoKeyServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeCryptoKeyMessage keeps of each DeleteCryptoKey response. */
interface RouteCryptoKeyMessageRecord {
  message: string;
  status: string;
  correlationId: string;
}

/** Where routeCryptoKeyMessage hands each record. */
interface RouteCryptoKeyMessageSink {
  send(record: RouteCryptoKeyMessageRecord): Promise<void>;
}

/** Hands records to acme.campaigns.v1.CampaignBudgetValidationService. */
class RouteCryptoKeyMessageCampaignBudgetValidation implements RouteCryptoKeyMessageSink {
  private readonly client: campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteCryptoKeyMessageRecord): Promise<void> {
    await call<campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesRequest, campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesResponse>(
      (request, done) => this.client.getCampaignBudgetRules(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesRequest.fromPartial({ campaignBudgetId: record.status }));
  }
}

/** Hands records to acme.experiments.v1.ExposureValidationService. */
class RouteCryptoKeyMessageExposureValidation implements RouteCryptoKeyMessageSink {
  private readonly client: experimentsExposureValidationServiceApi.ExposureValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExposureValidationServiceApi.ExposureValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteCryptoKeyMessageRecord): Promise<void> {
    await call<experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest, experimentsExposureValidationServiceApi.CheckExposureEligibilityResponse>(
      (request, done) => this.client.checkExposureEligibility(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest.fromPartial({ exposure: { exposureId: record.correlationId, correlationId: record.message } }));
  }
}

/** Hands records to acme.configuration.v1.ConfigSetCalculationService. */
class RouteCryptoKeyMessageConfigSetCalculation implements RouteCryptoKeyMessageSink {
  private readonly client: configurationConfigSetCalculationServiceApi.ConfigSetCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new configurationConfigSetCalculationServiceApi.ConfigSetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteCryptoKeyMessageRecord): Promise<void> {
    await retry(() => call<configurationConfigSetCalculationServiceApi.SimulateConfigSetRequest, configurationConfigSetCalculationServiceApi.SimulateConfigSetResponse>(
      (request, done) => this.client.simulateConfigSet(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      configurationConfigSetCalculationServiceApi.SimulateConfigSetRequest.fromPartial({ configSetId: record.status, configSet: { parentId: record.correlationId } })));
  }
}

/** Hands records to acme.broadcasts.v1.BroadcastService. */
class RouteCryptoKeyMessageBroadcast implements RouteCryptoKeyMessageSink {
  private readonly client: broadcastsBroadcastServiceApi.BroadcastServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new broadcastsBroadcastServiceApi.BroadcastServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteCryptoKeyMessageRecord): Promise<void> {
    await call<broadcastsBroadcastServiceApi.UpdateBroadcastRequest, broadcastsBroadcastServiceApi.UpdateBroadcastResponse>(
      (request, done) => this.client.updateBroadcast(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      broadcastsBroadcastServiceApi.UpdateBroadcastRequest.fromPartial({ broadcast: { broadcastId: record.correlationId } }));
  }
}

/** Reads acme.keymanagement.v1.CryptoKeyService/DeleteCryptoKey and hands what it keeps to the sink of its kind. */
export async function routeCryptoKeyMessage(runtime: Runtime): Promise<void> {
  const reader = new keymanagementCryptoKeyServiceApi.CryptoKeyServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<keymanagementCryptoKeyServiceApi.DeleteCryptoKeyRequest, keymanagementCryptoKeyServiceApi.DeleteCryptoKeyResponse>(
    (request, done) => reader.deleteCryptoKey(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    keymanagementCryptoKeyServiceApi.DeleteCryptoKeyRequest.fromPartial({ cryptoKeyId: "current-route-crypto-key-message" }));
  const entry: RouteCryptoKeyMessageRecord = {
    message: current.result?.message ?? "",
    status: current.result?.status ?? "",
    correlationId: text.normalize(current.result?.correlationId ?? ""),
  };
  const sinks: RouteCryptoKeyMessageSink[] = [
    new RouteCryptoKeyMessageCampaignBudgetValidation(runtime),
    new RouteCryptoKeyMessageExposureValidation(runtime),
    new RouteCryptoKeyMessageConfigSetCalculation(runtime),
    new RouteCryptoKeyMessageBroadcast(runtime),
  ];
  await sinks[0]!.send(entry);
}
