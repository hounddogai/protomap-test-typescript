import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInBaselineView, toDoubleOptInBaselineViews } from "./double-opt-in-baseline-view.js";
import { newDoubleOptInBaseline } from "./double-opt-in-baseline.js";

test("DoubleOptInBaselineView shows the status in capitals", () => {
  const item = newDoubleOptInBaseline("code-612", "title-98");
  const view = toDoubleOptInBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInBaselineViews([item, item]).length, 2, "views");
});
