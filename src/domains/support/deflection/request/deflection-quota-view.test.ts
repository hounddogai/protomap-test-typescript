import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionQuotaView, toDeflectionQuotaViews } from "./deflection-quota-view.js";
import { newDeflectionQuota } from "./deflection-quota.js";

test("DeflectionQuotaView shows the status in capitals", () => {
  const item = newDeflectionQuota("code-342", "title-974");
  const view = toDeflectionQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionQuotaViews([item, item]).length, 2, "views");
});
