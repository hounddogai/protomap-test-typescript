import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackSlaTierView, toFallbackSlaTierViews } from "./fallback-sla-tier-view.js";
import { newFallbackSlaTier } from "./fallback-sla-tier.js";

test("FallbackSlaTierView shows the status in capitals", () => {
  const item = newFallbackSlaTier("code-159", "name-235");
  const view = toFallbackSlaTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSlaTierViews([item, item]).length, 2, "views");
});
