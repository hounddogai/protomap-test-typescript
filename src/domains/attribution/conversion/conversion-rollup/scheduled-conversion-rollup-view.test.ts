import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledConversionRollupView,
  toScheduledConversionRollupViews,
} from "./scheduled-conversion-rollup-view.js";
import { newScheduledConversionRollup } from "./scheduled-conversion-rollup.js";

test("ScheduledConversionRollupView shows the status in capitals", () => {
  const item = newScheduledConversionRollup("code-520", "name-669");
  const view = toScheduledConversionRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledConversionRollupViews([item, item]).length, 2, "views");
});
