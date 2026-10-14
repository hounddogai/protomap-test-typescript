import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledMacroQuotaView, toScheduledMacroQuotaViews } from "./scheduled-macro-quota-view.js";
import { newScheduledMacroQuota } from "./scheduled-macro-quota.js";

test("ScheduledMacroQuotaView shows the status in capitals", () => {
  const item = newScheduledMacroQuota("code-484", "title-137");
  const view = toScheduledMacroQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledMacroQuotaViews([item, item]).length, 2, "views");
});
