import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveEnrollmentQuotaView, toAdaptiveEnrollmentQuotaViews } from "./adaptive-enrollment-quota-view.js";
import { newAdaptiveEnrollmentQuota } from "./adaptive-enrollment-quota.js";

test("AdaptiveEnrollmentQuotaView shows the status in capitals", () => {
  const item = newAdaptiveEnrollmentQuota("code-718", "name-333");
  const view = toAdaptiveEnrollmentQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveEnrollmentQuotaViews([item, item]).length, 2, "views");
});
