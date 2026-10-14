import * as configurationConfigSetCalculationServiceApi from "../../../.cache/proto/acme/configuration/v1/config_set_calculation_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as formsFormFieldValidationServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as notificationsNotificationAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_admin_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncConfigSetId keeps of each QuoteConfigSet response. */
interface SyncConfigSetIdRecord {
  correlationId: string;
  message: string;
  parentId: string;
  status: string;
}

/** Where syncConfigSetId hands each record. */
interface SyncConfigSetIdTarget {
  apply(record: SyncConfigSetIdRecord): Promise<void>;
}

/** Passes records to acme.notifications.v1.NotificationAdminService. */
class SyncConfigSetIdNotificationAdmin implements SyncConfigSetIdTarget {
  private readonly client: notificationsNotificationAdminServiceApi.NotificationAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationAdminServiceApi.NotificationAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncConfigSetIdRecord): Promise<void> {
    await retry(() => call<notificationsNotificationAdminServiceApi.RestoreNotificationRequest, notificationsNotificationAdminServiceApi.RestoreNotificationResponse>(
      (request, done) => this.client.restoreNotification(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsNotificationAdminServiceApi.RestoreNotificationRequest.fromPartial({ details: { reasonCode: record.message } })));
  }
}

/** Passes records to acme.featureflags.v1.FeatureFlagQueryService. */
class SyncConfigSetIdFeatureFlagQuery implements SyncConfigSetIdTarget {
  private readonly client: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncConfigSetIdRecord): Promise<void> {
    await retry(() => call<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse>(
      (request, done) => this.client.countFeatureFlags(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest.fromPartial({ page: { pageToken: record.status } })));
  }
}

/** Hands records to acme.forms.v1.FormFieldValidationService. */
class SyncConfigSetIdFormFieldValidation implements SyncConfigSetIdTarget {
  private readonly client: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormFieldValidationServiceApi.FormFieldValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncConfigSetIdRecord): Promise<void> {
    await call<formsFormFieldValidationServiceApi.GetFormFieldRulesRequest, formsFormFieldValidationServiceApi.GetFormFieldRulesResponse>(
      (request, done) => this.client.getFormFieldRules(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      formsFormFieldValidationServiceApi.GetFormFieldRulesRequest.fromPartial({ formFieldId: record.correlationId }));
  }
}

/**
 * Reads acme.configuration.v1.ConfigSetCalculationService/QuoteConfigSet and hands what it keeps to the sink
 * of its kind.
 */
export async function syncConfigSetId(runtime: Runtime): Promise<void> {
  const reader = new configurationConfigSetCalculationServiceApi.ConfigSetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<configurationConfigSetCalculationServiceApi.QuoteConfigSetRequest, configurationConfigSetCalculationServiceApi.QuoteConfigSetResponse>(
    (request, done) => reader.quoteConfigSet(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    configurationConfigSetCalculationServiceApi.QuoteConfigSetRequest.fromPartial({ reason: "primary-sync-config-set-id" }));
  const record: SyncConfigSetIdRecord = {
    correlationId: response.result?.correlationId ?? "",
    message: response.result?.message ?? "",
    parentId: response.configSet?.parentId ?? "",
    status: response.result?.status ?? "",
  };
  const sinks: SyncConfigSetIdTarget[] = [
    new SyncConfigSetIdNotificationAdmin(runtime),
    new SyncConfigSetIdFeatureFlagQuery(runtime),
    new SyncConfigSetIdFormFieldValidation(runtime),
  ];
  await sinks[0]!.apply(record);
}
