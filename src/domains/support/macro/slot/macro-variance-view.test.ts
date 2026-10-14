import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroVarianceView, toMacroVarianceViews } from "./macro-variance-view.js";
import { newMacroVariance } from "./macro-variance.js";

test("MacroVarianceView shows the status in capitals", () => {
  const item = newMacroVariance("code-744", "label-758");
  const view = toMacroVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroVarianceViews([item, item]).length, 2, "views");
});
