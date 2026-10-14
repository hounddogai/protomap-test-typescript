import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingQuotaView, toPacingQuotaViews } from "./pacing-quota-view.js";
import { newPacingQuota } from "./pacing-quota.js";

test("PacingQuotaView shows the status in capitals", () => {
  const item = newPacingQuota("code-288", "label-166");
  const view = toPacingQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingQuotaViews([item, item]).length, 2, "views");
});
