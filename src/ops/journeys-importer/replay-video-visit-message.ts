import * as authorizationAccessPolicyValidationServiceApi from "../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as boxofficeBoxOfficeSaleQueryServiceApi from "../../../.cache/proto/acme/boxoffice/v1/box_office_sale_query_service.js";
import * as telehealthVideoVisitServiceApi from "../../../.cache/proto/acme/telehealth/v1/video_visit_service.js";
import * as workplacesBuildingCalculationServiceApi from "../../../.cache/proto/acme/workplaces/v1/building_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayVideoVisitMessage keeps of each GetVideoVisit response. */
interface ReplayVideoVisitMessageRecord {
  message: string;
  title: string;
  correlationId: string;
}

/** Where replayVideoVisitMessage hands each record. */
interface ReplayVideoVisitMessageDestination {
  write(record: ReplayVideoVisitMessageRecord): Promise<void>;
}

/** Writes records to acme.authorization.v1.AccessPolicyValidationService. */
class ReplayVideoVisitMessageAccessPolicyValidation implements ReplayVideoVisitMessageDestination {
  private readonly client: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ReplayVideoVisitMessageRecord): Promise<void> {
    await call<authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyResponse>(
      (request, done) => this.client.scoreAccessPolicy(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      authorizationAccessPolicyValidationServiceApi.ScoreAccessPolicyRequest.fromPartial({ accessPolicy: { accessPolicyId: record.message, description: record.title } }));
  }
}

/** Hands records to acme.boxoffice.v1.BoxOfficeSaleQueryService. */
class ReplayVideoVisitMessageBoxOfficeSaleQuery implements ReplayVideoVisitMessageDestination {
  private readonly client: boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ReplayVideoVisitMessageRecord): Promise<void> {
    await call<boxofficeBoxOfficeSaleQueryServiceApi.BrowseBoxOfficeSalesRequest, boxofficeBoxOfficeSaleQueryServiceApi.BrowseBoxOfficeSalesResponse>(
      (request, done) => this.client.browseBoxOfficeSales(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      boxofficeBoxOfficeSaleQueryServiceApi.BrowseBoxOfficeSalesRequest.fromPartial({ orderBy: record.correlationId, filter: { region: record.message, query: record.title } }));
  }
}

/** Passes records to acme.workplaces.v1.BuildingCalculationService. */
class ReplayVideoVisitMessageBuildingCalculation implements ReplayVideoVisitMessageDestination {
  private readonly client: workplacesBuildingCalculationServiceApi.BuildingCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new workplacesBuildingCalculationServiceApi.BuildingCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ReplayVideoVisitMessageRecord): Promise<void> {
    await call<workplacesBuildingCalculationServiceApi.GetBuildingRatesRequest, workplacesBuildingCalculationServiceApi.GetBuildingRatesResponse>(
      (request, done) => this.client.getBuildingRates(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      workplacesBuildingCalculationServiceApi.GetBuildingRatesRequest.fromPartial({ buildingId: record.title }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ReplayVideoVisitMessageLogOnly implements ReplayVideoVisitMessageDestination {
  async write(record: ReplayVideoVisitMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchReplayVideoVisitMessage(kind: string, record: ReplayVideoVisitMessageRecord, runtime: Runtime): Promise<void> {
  let write = (item: ReplayVideoVisitMessageRecord): Promise<void> => new ReplayVideoVisitMessageLogOnly().write(item);
  switch (kind) {
    case "access-policy-validation":
      write = (item) => new ReplayVideoVisitMessageAccessPolicyValidation(runtime).write(item);
      break;
    case "box-office-sale-query":
      write = (item) => new ReplayVideoVisitMessageBoxOfficeSaleQuery(runtime).write(item);
      break;
    case "building-calculation":
      write = (item) => new ReplayVideoVisitMessageBuildingCalculation(runtime).write(item);
      break;
  }
  await write(record);
}

/** Reads acme.telehealth.v1.VideoVisitService/GetVideoVisit and hands what it keeps to the sink of its kind. */
export async function replayVideoVisitMessage(runtime: Runtime): Promise<void> {
  const reader = new telehealthVideoVisitServiceApi.VideoVisitServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<telehealthVideoVisitServiceApi.GetVideoVisitRequest, telehealthVideoVisitServiceApi.GetVideoVisitResponse>(
    (request, done) => reader.getVideoVisit(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    telehealthVideoVisitServiceApi.GetVideoVisitRequest.fromPartial({ videoVisitId: "current-replay-video-visit-message" }));
  const kept: ReplayVideoVisitMessageRecord = {
    message: reply.result?.message ?? "",
    title: text.normalize(reply.videoVisit?.title ?? ""),
    correlationId: reply.result?.correlationId ?? "",
  };
  await dispatchReplayVideoVisitMessage("box-office-sale-query", kept, runtime);
}
