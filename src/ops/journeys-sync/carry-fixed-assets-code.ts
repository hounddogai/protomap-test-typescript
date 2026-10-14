import * as assetsFixedAssetCalculationServiceApi from "../../../.cache/proto/acme/assets/v1/fixed_asset_calculation_service.js";
import * as communityModerationCalculationServiceApi from "../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import * as patientappPatientHomeServiceApi from "../../../.cache/proto/acme/patientapp/v1/patient_home_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryFixedAssetsCode keeps of each RecalculateFixedAssets response. */
interface CarryFixedAssetsCodeRecord {
  code: string;
  currencyCode: string;
  status: string;
  name: string;
}

/** Where carryFixedAssetsCode hands each record. */
interface CarryFixedAssetsCodeTarget {
  write(record: CarryFixedAssetsCodeRecord): Promise<void>;
}

/** Hands records to acme.community.v1.ModerationCalculationService. */
class CarryFixedAssetsCodeModerationCalculation implements CarryFixedAssetsCodeTarget {
  private readonly client: communityModerationCalculationServiceApi.ModerationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityModerationCalculationServiceApi.ModerationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryFixedAssetsCodeRecord): Promise<void> {
    await retry(() => call<communityModerationCalculationServiceApi.EstimateModerationRequest, communityModerationCalculationServiceApi.EstimateModerationResponse>(
      (request, done) => this.client.estimateModeration(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      communityModerationCalculationServiceApi.EstimateModerationRequest.fromPartial({ details: { currencyCode: record.currencyCode } })));
  }
}

/** Passes records to acme.media.v1.MediaAssetApprovalService. */
class CarryFixedAssetsCodeMediaAssetApproval implements CarryFixedAssetsCodeTarget {
  private readonly client: mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryFixedAssetsCodeRecord): Promise<void> {
    await call<mediaMediaAssetApprovalServiceApi.EscalateMediaAssetRequest, mediaMediaAssetApprovalServiceApi.EscalateMediaAssetResponse>(
      (request, done) => this.client.escalateMediaAsset(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaMediaAssetApprovalServiceApi.EscalateMediaAssetRequest.fromPartial({ mediaAsset: { mediaAssetId: record.name, name: record.currencyCode }, details: { approverEmail: record.status } }));
  }
}

/** Hands records to acme.featureflags.v1.FeatureFlagQueryService. */
class CarryFixedAssetsCodeFeatureFlagQuery implements CarryFixedAssetsCodeTarget {
  private readonly client: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryFixedAssetsCodeRecord): Promise<void> {
    await call<featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsResponse>(
      (request, done) => this.client.browseFeatureFlags(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest.fromPartial({ filter: { region: record.status }, orderBy: record.currencyCode }));
  }
}

/** Sends records to acme.patientapp.v1.PatientHomeService. */
class CarryFixedAssetsCodePatientHome implements CarryFixedAssetsCodeTarget {
  private readonly client: patientappPatientHomeServiceApi.PatientHomeServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new patientappPatientHomeServiceApi.PatientHomeServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryFixedAssetsCodeRecord): Promise<void> {
    await retry(() => call<patientappPatientHomeServiceApi.CreatePatientHomeRequest, patientappPatientHomeServiceApi.CreatePatientHomeResponse>(
      (request, done) => this.client.createPatientHome(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      patientappPatientHomeServiceApi.CreatePatientHomeRequest.fromPartial({ patientHome: { subject: record.name }, requestId: record.status })));
  }
}

/**
 * Reads acme.assets.v1.FixedAssetCalculationService/RecalculateFixedAssets and hands what it keeps to the
 * sink of its kind.
 */
export async function carryFixedAssetsCode(runtime: Runtime): Promise<void> {
  const source = new assetsFixedAssetCalculationServiceApi.FixedAssetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<assetsFixedAssetCalculationServiceApi.RecalculateFixedAssetsRequest, assetsFixedAssetCalculationServiceApi.RecalculateFixedAssetsResponse>(
    (request, done) => source.recalculateFixedAssets(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    assetsFixedAssetCalculationServiceApi.RecalculateFixedAssetsRequest.fromPartial({ reason: "primary-carry-fixed-assets-code" })));
  const entry: CarryFixedAssetsCodeRecord = {
    code: response.fixedAsset?.code ?? "",
    currencyCode: text.normalize(response.breakdown?.currencyCode ?? ""),
    status: response.result?.status ?? "",
    name: text.normalize(response.fixedAsset?.name ?? ""),
  };
  const sinks = new Map<string, CarryFixedAssetsCodeTarget>();
  sinks.set("moderation-calculation", new CarryFixedAssetsCodeModerationCalculation(runtime));
  sinks.set("media-asset-approval", new CarryFixedAssetsCodeMediaAssetApproval(runtime));
  sinks.set("feature-flag-query", new CarryFixedAssetsCodeFeatureFlagQuery(runtime));
  sinks.set("patient-home", new CarryFixedAssetsCodePatientHome(runtime));
  await sinks.get("media-asset-approval")!.write(entry);
}
