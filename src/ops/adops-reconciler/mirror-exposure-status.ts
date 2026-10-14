import * as experimentsExposureLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_lifecycle_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as messagingParticipantApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_approval_service.js";
import * as payrollPayRunServiceApi from "../../../.cache/proto/acme/payroll/v1/pay_run_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorExposureStatus keeps of each ExpireExposure response. */
interface MirrorExposureStatusRecord {
  status: string;
  message: string;
  correlationId: string;
}

/** Where mirrorExposureStatus hands each record. */
interface MirrorExposureStatusSink {
  deliver(record: MirrorExposureStatusRecord): Promise<void>;
}

/** Passes records to acme.localization.v1.TranslationKeyApprovalService. */
class MirrorExposureStatusTranslationKeyApproval implements MirrorExposureStatusSink {
  private readonly client: localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorExposureStatusRecord): Promise<void> {
    await call<localizationTranslationKeyApprovalServiceApi.GetTranslationKeyApprovalStatusRequest, localizationTranslationKeyApprovalServiceApi.GetTranslationKeyApprovalStatusResponse>(
      (request, done) => this.client.getTranslationKeyApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationTranslationKeyApprovalServiceApi.GetTranslationKeyApprovalStatusRequest.fromPartial({ translationKeyId: record.message }));
  }
}

/** Sends records to acme.messaging.v1.ParticipantApprovalService. */
class MirrorExposureStatusParticipantApproval implements MirrorExposureStatusSink {
  private readonly client: messagingParticipantApprovalServiceApi.ParticipantApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingParticipantApprovalServiceApi.ParticipantApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorExposureStatusRecord): Promise<void> {
    await retry(() => call<messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest, messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse>(
      (request, done) => this.client.commentParticipantApproval(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest.fromPartial({ participant: { participantId: record.status } })));
  }
}

/** Writes records to acme.payroll.v1.PayRunService. */
class MirrorExposureStatusPayRun implements MirrorExposureStatusSink {
  private readonly client: payrollPayRunServiceApi.PayRunServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new payrollPayRunServiceApi.PayRunServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorExposureStatusRecord): Promise<void> {
    await call<payrollPayRunServiceApi.CreatePayRunRequest, payrollPayRunServiceApi.CreatePayRunResponse>(
      (request, done) => this.client.createPayRun(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      payrollPayRunServiceApi.CreatePayRunRequest.fromPartial({ payRun: { notes: record.status } }));
  }
}

/**
 * Reads acme.experiments.v1.ExposureLifecycleService/ExpireExposure and hands what it keeps to the sink of
 * its kind.
 */
export async function mirrorExposureStatus(runtime: Runtime): Promise<void> {
  const source = new experimentsExposureLifecycleServiceApi.ExposureLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<experimentsExposureLifecycleServiceApi.ExpireExposureRequest, experimentsExposureLifecycleServiceApi.ExpireExposureResponse>(
    (request, done) => source.expireExposure(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    experimentsExposureLifecycleServiceApi.ExpireExposureRequest.fromPartial({ reason: "current-mirror-exposure-status" })));
  const row: MirrorExposureStatusRecord = {
    status: found.outcome?.status ?? "",
    message: text.normalize(found.outcome?.message ?? ""),
    correlationId: text.normalize(found.result?.correlationId ?? ""),
  };
  const entries: Array<{ kind: string; sink: MirrorExposureStatusSink }> = [
    { kind: "translation-key-approval", sink: new MirrorExposureStatusTranslationKeyApproval(runtime) },
    { kind: "participant-approval", sink: new MirrorExposureStatusParticipantApproval(runtime) },
    { kind: "pay-run", sink: new MirrorExposureStatusPayRun(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "pay-run") continue;
    await entry.sink.deliver(row);
  }
}
