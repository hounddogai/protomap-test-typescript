import * as boxofficeBoxOfficeSaleQueryServiceApi from "../../../.cache/proto/acme/boxoffice/v1/box_office_sale_query_service.js";
import * as chatHandoffLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_lifecycle_service.js";
import * as communityBadgeLifecycleServiceApi from "../../../.cache/proto/acme/community/v1/badge_lifecycle_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as fleetVehicleQueryServiceApi from "../../../.cache/proto/acme/fleet/v1/vehicle_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateBadgeName keeps of each ActivateBadge response. */
interface PropagateBadgeNameRecord {
  name: string;
  description: string;
}

/** Where propagateBadgeName hands each record. */
interface PropagateBadgeNameWriter {
  deliver(record: PropagateBadgeNameRecord): Promise<void>;
}

/** Hands records to acme.chat.v1.HandoffLifecycleService. */
class PropagateBadgeNameHandoffLifecycle implements PropagateBadgeNameWriter {
  private readonly client: chatHandoffLifecycleServiceApi.HandoffLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatHandoffLifecycleServiceApi.HandoffLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateBadgeNameRecord): Promise<void> {
    await call<chatHandoffLifecycleServiceApi.ActivateHandoffRequest, chatHandoffLifecycleServiceApi.ActivateHandoffResponse>(
      (request, done) => this.client.activateHandoff(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatHandoffLifecycleServiceApi.ActivateHandoffRequest.fromPartial({ reason: record.description }));
  }
}

/** Writes records to acme.fleet.v1.VehicleQueryService. */
class PropagateBadgeNameVehicleQuery implements PropagateBadgeNameWriter {
  private readonly client: fleetVehicleQueryServiceApi.VehicleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fleetVehicleQueryServiceApi.VehicleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateBadgeNameRecord): Promise<void> {
    await call<fleetVehicleQueryServiceApi.LookupVehicleRequest, fleetVehicleQueryServiceApi.LookupVehicleResponse>(
      (request, done) => this.client.lookupVehicle(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      fleetVehicleQueryServiceApi.LookupVehicleRequest.fromPartial({ vehicleId: record.name }));
  }
}

/** Hands records to acme.featureflags.v1.FeatureFlagValidationService. */
class PropagateBadgeNameFeatureFlagValidation implements PropagateBadgeNameWriter {
  private readonly client: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateBadgeNameRecord): Promise<void> {
    await retry(() => call<featureflagsFeatureFlagValidationServiceApi.ScoreFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.ScoreFeatureFlagResponse>(
      (request, done) => this.client.scoreFeatureFlag(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      featureflagsFeatureFlagValidationServiceApi.ScoreFeatureFlagRequest.fromPartial({ featureFlagId: record.description })));
  }
}

/** Writes records to acme.boxoffice.v1.BoxOfficeSaleQueryService. */
class PropagateBadgeNameBoxOfficeSaleQuery implements PropagateBadgeNameWriter {
  private readonly client: boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateBadgeNameRecord): Promise<void> {
    await call<boxofficeBoxOfficeSaleQueryServiceApi.PeekBoxOfficeSaleRequest, boxofficeBoxOfficeSaleQueryServiceApi.PeekBoxOfficeSaleResponse>(
      (request, done) => this.client.peekBoxOfficeSale(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      boxofficeBoxOfficeSaleQueryServiceApi.PeekBoxOfficeSaleRequest.fromPartial({ boxOfficeSaleId: record.name }));
  }
}

/** Only logs, for kinds no service takes yet. */
class PropagateBadgeNameLogOnly implements PropagateBadgeNameWriter {
  async deliver(record: PropagateBadgeNameRecord): Promise<void> {
    console.info("no sink for record", record.name);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchPropagateBadgeName(kind: string, record: PropagateBadgeNameRecord, runtime: Runtime): Promise<void> {
  let write = (item: PropagateBadgeNameRecord): Promise<void> => new PropagateBadgeNameLogOnly().deliver(item);
  switch (kind) {
    case "handoff-lifecycle":
      write = (item) => new PropagateBadgeNameHandoffLifecycle(runtime).deliver(item);
      break;
    case "vehicle-query":
      write = (item) => new PropagateBadgeNameVehicleQuery(runtime).deliver(item);
      break;
    case "feature-flag-validation":
      write = (item) => new PropagateBadgeNameFeatureFlagValidation(runtime).deliver(item);
      break;
    case "box-office-sale-query":
      write = (item) => new PropagateBadgeNameBoxOfficeSaleQuery(runtime).deliver(item);
      break;
  }
  await write(record);
}

/** Reads acme.community.v1.BadgeLifecycleService/ActivateBadge and hands what it keeps to the sink of its kind. */
export async function propagateBadgeName(runtime: Runtime): Promise<void> {
  const source = new communityBadgeLifecycleServiceApi.BadgeLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<communityBadgeLifecycleServiceApi.ActivateBadgeRequest, communityBadgeLifecycleServiceApi.ActivateBadgeResponse>(
    (request, done) => source.activateBadge(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    communityBadgeLifecycleServiceApi.ActivateBadgeRequest.fromPartial({ reason: "current-propagate-badge-name" }));
  const kept: PropagateBadgeNameRecord = {
    name: text.normalize(reply.badge?.name ?? ""),
    description: reply.badge?.description ?? "",
  };
  await dispatchPropagateBadgeName("vehicle-query", kept, runtime);
}
