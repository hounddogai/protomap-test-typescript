import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackSuppressionGroupView,
  toFallbackSuppressionGroupViews,
} from "./fallback-suppression-group-view.js";
import { newFallbackSuppressionGroup } from "./fallback-suppression-group.js";

test("FallbackSuppressionGroupView shows the status in capitals", () => {
  const item = newFallbackSuppressionGroup("code-866", "label-571");
  const view = toFallbackSuppressionGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSuppressionGroupViews([item, item]).length, 2, "views");
});
