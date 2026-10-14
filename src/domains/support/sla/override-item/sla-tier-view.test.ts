import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaTierView, toSlaTierViews } from "./sla-tier-view.js";
import { newSlaTier } from "./sla-tier.js";

test("SlaTierView shows the status in capitals", () => {
  const item = newSlaTier("code-814", "name-152");
  const view = toSlaTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaTierViews([item, item]).length, 2, "views");
});
