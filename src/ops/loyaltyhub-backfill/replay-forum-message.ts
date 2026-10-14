import * as careplansCarePlanCalculationServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_calculation_service.js";
import * as communityForumApprovalServiceApi from "../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as keymanagementCryptoKeyQueryServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayForumMessage keeps of each EscalateForum response. */
interface ReplayForumMessageRecord {
  message: string;
  forumId: string;
  referenceId: string;
}

/** Where replayForumMessage hands each record. */
interface ReplayForumMessageSink {
  forward(record: ReplayForumMessageRecord): Promise<void>;
}

/** Hands records to acme.careplans.v1.CarePlanCalculationService. */
class ReplayForumMessageCarePlanCalculation implements ReplayForumMessageSink {
  private readonly client: careplansCarePlanCalculationServiceApi.CarePlanCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new careplansCarePlanCalculationServiceApi.CarePlanCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ReplayForumMessageRecord): Promise<void> {
    await retry(() => call<careplansCarePlanCalculationServiceApi.GetCarePlanRatesRequest, careplansCarePlanCalculationServiceApi.GetCarePlanRatesResponse>(
      (request, done) => this.client.getCarePlanRates(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      careplansCarePlanCalculationServiceApi.GetCarePlanRatesRequest.fromPartial({ carePlanId: record.message })));
  }
}

/** Sends records to acme.keymanagement.v1.CryptoKeyQueryService. */
class ReplayForumMessageCryptoKeyQuery implements ReplayForumMessageSink {
  private readonly client: keymanagementCryptoKeyQueryServiceApi.CryptoKeyQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new keymanagementCryptoKeyQueryServiceApi.CryptoKeyQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ReplayForumMessageRecord): Promise<void> {
    await call<keymanagementCryptoKeyQueryServiceApi.CountCryptoKeysRequest, keymanagementCryptoKeyQueryServiceApi.CountCryptoKeysResponse>(
      (request, done) => this.client.countCryptoKeys(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      keymanagementCryptoKeyQueryServiceApi.CountCryptoKeysRequest.fromPartial({ orderBy: record.message, page: { pageToken: record.referenceId } }));
  }
}

/** Reads acme.community.v1.ForumApprovalService/EscalateForum and hands what it keeps to the sink of its kind. */
export async function replayForumMessage(runtime: Runtime): Promise<void> {
  const reader = new communityForumApprovalServiceApi.ForumApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<communityForumApprovalServiceApi.EscalateForumRequest, communityForumApprovalServiceApi.EscalateForumResponse>(
    (request, done) => reader.escalateForum(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    communityForumApprovalServiceApi.EscalateForumRequest.fromPartial({ reason: "current-replay-forum-message" }));
  const entry: ReplayForumMessageRecord = {
    message: found.outcome?.message ?? "",
    forumId: found.forum?.forumId ?? "",
    referenceId: found.outcome?.referenceId ?? "",
  };
  const sinks: ReplayForumMessageSink[] = [
    new ReplayForumMessageCarePlanCalculation(runtime),
    new ReplayForumMessageCryptoKeyQuery(runtime),
  ];
  for (const sink of sinks) {
    await sink.forward(entry);
  }
}
