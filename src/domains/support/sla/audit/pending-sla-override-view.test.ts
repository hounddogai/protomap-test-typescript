import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingSlaOverrideView, toPendingSlaOverrideViews } from "./pending-sla-override-view.js";
import { newPendingSlaOverride } from "./pending-sla-override.js";

test("PendingSlaOverrideView shows the status in capitals", () => {
  const item = newPendingSlaOverride("code-486", "name-764");
  const view = toPendingSlaOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSlaOverrideViews([item, item]).length, 2, "views");
});
