import * as featureflagsFeatureFlagServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as fulfillmentFulfillmentServiceApi from "../../../.cache/proto/acme/fulfillment/v1/fulfillment_service.js";
import * as labelingLabelingTaskCalculationServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_calculation_service.js";
import * as notificationsDeliveryAttemptAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_admin_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateGetFulfillmentsToken keeps of each BatchGetFulfillments response. */
interface PropagateGetFulfillmentsTokenRecord {
  nextPageToken: string;
  status: string;
  message: string;
  correlationId: string;
}

/** Where propagateGetFulfillmentsToken hands each record. */
interface PropagateGetFulfillmentsTokenDestination {
  write(record: PropagateGetFulfillmentsTokenRecord): Promise<void>;
}

/** Writes records to acme.labeling.v1.LabelingTaskCalculationService. */
class PropagateGetFulfillmentsTokenLabelingTaskCalculation implements PropagateGetFulfillmentsTokenDestination {
  private readonly client: labelingLabelingTaskCalculationServiceApi.LabelingTaskCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new labelingLabelingTaskCalculationServiceApi.LabelingTaskCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateGetFulfillmentsTokenRecord): Promise<void> {
    await retry(() => call<labelingLabelingTaskCalculationServiceApi.ExplainLabelingTaskCalculationRequest, labelingLabelingTaskCalculationServiceApi.ExplainLabelingTaskCalculationResponse>(
      (request, done) => this.client.explainLabelingTaskCalculation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      labelingLabelingTaskCalculationServiceApi.ExplainLabelingTaskCalculationRequest.fromPartial({ reason: record.correlationId, labelingTask: { labelingTaskId: record.nextPageToken } })));
  }
}

/** Passes records to acme.featureflags.v1.FeatureFlagService. */
class PropagateGetFulfillmentsTokenFeatureFlag implements PropagateGetFulfillmentsTokenDestination {
  private readonly client: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateGetFulfillmentsTokenRecord): Promise<void> {
    await retry(() => call<featureflagsFeatureFlagServiceApi.GetFeatureFlagRequest, featureflagsFeatureFlagServiceApi.GetFeatureFlagResponse>(
      (request, done) => this.client.getFeatureFlag(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      featureflagsFeatureFlagServiceApi.GetFeatureFlagRequest.fromPartial({ featureFlagId: record.correlationId })));
  }
}

/** Passes records to acme.notifications.v1.DeliveryAttemptAdminService. */
class PropagateGetFulfillmentsTokenDeliveryAttemptAdmin implements PropagateGetFulfillmentsTokenDestination {
  private readonly client: notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateGetFulfillmentsTokenRecord): Promise<void> {
    await call<notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptResponse>(
      (request, done) => this.client.transferDeliveryAttempt(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsDeliveryAttemptAdminServiceApi.TransferDeliveryAttemptRequest.fromPartial({ reason: record.nextPageToken, details: { reasonCode: record.correlationId } }));
  }
}

/**
 * Reads acme.fulfillment.v1.FulfillmentService/BatchGetFulfillments and hands what it keeps to the sink of
 * its kind.
 */
export async function propagateGetFulfillmentsToken(runtime: Runtime): Promise<void> {
  const origin = new fulfillmentFulfillmentServiceApi.FulfillmentServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<fulfillmentFulfillmentServiceApi.BatchGetFulfillmentsRequest, fulfillmentFulfillmentServiceApi.BatchGetFulfillmentsResponse>(
    (request, done) => origin.batchGetFulfillments(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    fulfillmentFulfillmentServiceApi.BatchGetFulfillmentsRequest.fromPartial({}));
  const kept: PropagateGetFulfillmentsTokenRecord = {
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
    status: text.normalize(current.result?.status ?? ""),
    message: text.normalize(current.result?.message ?? ""),
    correlationId: current.result?.correlationId ?? "",
  };
  const entries: Array<{ kind: string; sink: PropagateGetFulfillmentsTokenDestination }> = [
    { kind: "labeling-task-calculation", sink: new PropagateGetFulfillmentsTokenLabelingTaskCalculation(runtime) },
    { kind: "feature-flag", sink: new PropagateGetFulfillmentsTokenFeatureFlag(runtime) },
    { kind: "delivery-attempt-admin", sink: new PropagateGetFulfillmentsTokenDeliveryAttemptAdmin(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "feature-flag") continue;
    await entry.sink.write(kept);
  }
}
