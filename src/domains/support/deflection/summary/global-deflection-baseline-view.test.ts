import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalDeflectionBaselineView,
  toGlobalDeflectionBaselineViews,
} from "./global-deflection-baseline-view.js";
import { newGlobalDeflectionBaseline } from "./global-deflection-baseline.js";

test("GlobalDeflectionBaselineView shows the status in capitals", () => {
  const item = newGlobalDeflectionBaseline("code-735", "label-547");
  const view = toGlobalDeflectionBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalDeflectionBaselineViews([item, item]).length, 2, "views");
});
