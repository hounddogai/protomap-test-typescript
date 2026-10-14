import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryMacroQuotaView, toPrimaryMacroQuotaViews } from "./primary-macro-quota-view.js";
import { newPrimaryMacroQuota } from "./primary-macro-quota.js";

test("PrimaryMacroQuotaView shows the status in capitals", () => {
  const item = newPrimaryMacroQuota("code-733", "name-255");
  const view = toPrimaryMacroQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryMacroQuotaViews([item, item]).length, 2, "views");
});
