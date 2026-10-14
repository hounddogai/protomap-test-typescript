import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientWaitBaselineView, toLenientWaitBaselineViews } from "./lenient-wait-baseline-view.js";
import { newLenientWaitBaseline } from "./lenient-wait-baseline.js";

test("LenientWaitBaselineView shows the status in capitals", () => {
  const item = newLenientWaitBaseline("code-200", "title-461");
  const view = toLenientWaitBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientWaitBaselineViews([item, item]).length, 2, "views");
});
