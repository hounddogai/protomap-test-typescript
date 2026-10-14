import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictMacroQuotaView, toStrictMacroQuotaViews } from "./strict-macro-quota-view.js";
import { newStrictMacroQuota } from "./strict-macro-quota.js";

test("StrictMacroQuotaView shows the status in capitals", () => {
  const item = newStrictMacroQuota("code-248", "label-796");
  const view = toStrictMacroQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictMacroQuotaViews([item, item]).length, 2, "views");
});
