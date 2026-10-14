import * as customersCustomerValidationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as warehousingWarehouseQueryServiceApi from "../../../.cache/proto/acme/warehousing/v1/warehouse_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorNotificationTemplateWatchersNumber keeps of each NotifyNotificationTemplateWatchers response. */
interface MirrorNotificationTemplateWatchersNumberRecord {
  number: string;
  correlationId: string;
}

/** Where mirrorNotificationTemplateWatchersNumber hands each record. */
interface MirrorNotificationTemplateWatchersNumberTarget {
  apply(record: MirrorNotificationTemplateWatchersNumberRecord): Promise<void>;
}

/** Hands records to acme.warehousing.v1.WarehouseQueryService. */
class MirrorNotificationTemplateWatchersNumberWarehouseQuery implements MirrorNotificationTemplateWatchersNumberTarget {
  private readonly client: warehousingWarehouseQueryServiceApi.WarehouseQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new warehousingWarehouseQueryServiceApi.WarehouseQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: MirrorNotificationTemplateWatchersNumberRecord): Promise<void> {
    await retry(() => call<warehousingWarehouseQueryServiceApi.LookupWarehouseRequest, warehousingWarehouseQueryServiceApi.LookupWarehouseResponse>(
      (request, done) => this.client.lookupWarehouse(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      warehousingWarehouseQueryServiceApi.LookupWarehouseRequest.fromPartial({ warehouseId: record.number })));
  }
}

/** Hands records to acme.customers.v1.CustomerValidationService. */
class MirrorNotificationTemplateWatchersNumberCustomerValidation implements MirrorNotificationTemplateWatchersNumberTarget {
  private readonly client: customersCustomerValidationServiceApi.CustomerValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersCustomerValidationServiceApi.CustomerValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: MirrorNotificationTemplateWatchersNumberRecord): Promise<void> {
    await call<customersCustomerValidationServiceApi.GetCustomerRulesRequest, customersCustomerValidationServiceApi.GetCustomerRulesResponse>(
      (request, done) => this.client.getCustomerRules(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      customersCustomerValidationServiceApi.GetCustomerRulesRequest.fromPartial({ customerId: record.correlationId }));
  }
}

/**
 * Reads acme.notifications.v1.NotificationTemplateNotificationService/NotifyNotificationTemplateWatchers and
 * hands what it keeps to the sink of its kind.
 */
export async function mirrorNotificationTemplateWatchersNumber(runtime: Runtime): Promise<void> {
  const origin = new notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest, notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse>(
    (request, done) => origin.notifyNotificationTemplateWatchers(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest.fromPartial({ reason: "primary-mirror-notification-template-watchers-number" })));
  const row: MirrorNotificationTemplateWatchersNumberRecord = {
    number: reply.notificationTemplate?.number ?? "",
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
  };
  const sinks = new Map<string, MirrorNotificationTemplateWatchersNumberTarget>([
    ["warehouse-query", new MirrorNotificationTemplateWatchersNumberWarehouseQuery(runtime)],
    ["customer-validation", new MirrorNotificationTemplateWatchersNumberCustomerValidation(runtime)],
  ]);
  const sink = sinks.get(process.env["MIRROR_NOTIFICATION_TEMPLATE_WATCHERS_NUMBER_TARGET"] ?? "");
  if (!sink) return;
  await sink.apply(row);
}
