import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceBaselineView, toBounceBaselineViews } from "./bounce-baseline-view.js";
import { newBounceBaseline } from "./bounce-baseline.js";

test("BounceBaselineView shows the status in capitals", () => {
  const item = newBounceBaseline("code-465", "title-416");
  const view = toBounceBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceBaselineViews([item, item]).length, 2, "views");
});
