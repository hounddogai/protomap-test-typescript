import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroQuotaView, toMacroQuotaViews } from "./macro-quota-view.js";
import { newMacroQuota } from "./macro-quota.js";

test("MacroQuotaView shows the status in capitals", () => {
  const item = newMacroQuota("code-486", "name-538");
  const view = toMacroQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroQuotaViews([item, item]).length, 2, "views");
});
