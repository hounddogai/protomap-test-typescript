import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaOverrideView, toSlaOverrideViews } from "./sla-override-view.js";
import { newSlaOverride } from "./sla-override.js";

test("SlaOverrideView shows the status in capitals", () => {
  const item = newSlaOverride("code-862", "name-482");
  const view = toSlaOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaOverrideViews([item, item]).length, 2, "views");
});
