import * as communityPostValidationServiceApi from "../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as mediaTranscodeJobImportServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_import_service.js";
import * as seatingSeatMapQueryServiceApi from "../../../.cache/proto/acme/seating/v1/seat_map_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncPostRulesId keeps of each GetPostRules response. */
interface SyncPostRulesIdRecord {
  postId: string;
  correlationId: string;
}

/** Where syncPostRulesId hands each record. */
interface SyncPostRulesIdTarget {
  push(record: SyncPostRulesIdRecord): Promise<void>;
}

/** Hands records to acme.media.v1.TranscodeJobImportService. */
class SyncPostRulesIdTranscodeJobImport implements SyncPostRulesIdTarget {
  private readonly client: mediaTranscodeJobImportServiceApi.TranscodeJobImportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobImportServiceApi.TranscodeJobImportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SyncPostRulesIdRecord): Promise<void> {
    await call<mediaTranscodeJobImportServiceApi.ListTranscodeJobImportsRequest, mediaTranscodeJobImportServiceApi.ListTranscodeJobImportsResponse>(
      (request, done) => this.client.listTranscodeJobImports(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaTranscodeJobImportServiceApi.ListTranscodeJobImportsRequest.fromPartial({ filter: { ownerId: record.postId, region: record.correlationId } }));
  }
}

/** Sends records to acme.seating.v1.SeatMapQueryService. */
class SyncPostRulesIdSeatMapQuery implements SyncPostRulesIdTarget {
  private readonly client: seatingSeatMapQueryServiceApi.SeatMapQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new seatingSeatMapQueryServiceApi.SeatMapQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SyncPostRulesIdRecord): Promise<void> {
    await call<seatingSeatMapQueryServiceApi.FindSeatMapsRequest, seatingSeatMapQueryServiceApi.FindSeatMapsResponse>(
      (request, done) => this.client.findSeatMaps(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      seatingSeatMapQueryServiceApi.FindSeatMapsRequest.fromPartial({ filter: { region: record.postId }, page: { pageToken: record.correlationId } }));
  }
}

/** Reads acme.community.v1.PostValidationService/GetPostRules and hands what it keeps to the sink of its kind. */
export async function syncPostRulesId(runtime: Runtime): Promise<void> {
  const origin = new communityPostValidationServiceApi.PostValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<communityPostValidationServiceApi.GetPostRulesRequest, communityPostValidationServiceApi.GetPostRulesResponse>(
    (request, done) => origin.getPostRules(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    communityPostValidationServiceApi.GetPostRulesRequest.fromPartial({ postId: "live-sync-post-rules-id" }));
  const entry: SyncPostRulesIdRecord = {
    postId: text.normalize(reply.post?.postId ?? ""),
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
  };
  const registry: Record<string, SyncPostRulesIdTarget> = {};
  for (const entry of [
    { kind: "transcode-job-import", sink: new SyncPostRulesIdTranscodeJobImport(runtime) },
    { kind: "seat-map-query", sink: new SyncPostRulesIdSeatMapQuery(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["transcode-job-import"]!.push(entry);
}
