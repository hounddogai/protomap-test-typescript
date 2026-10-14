import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalDoubleOptInRollupView,
  toRegionalDoubleOptInRollupViews,
} from "./regional-double-opt-in-rollup-view.js";
import { newRegionalDoubleOptInRollup } from "./regional-double-opt-in-rollup.js";

test("RegionalDoubleOptInRollupView shows the status in capitals", () => {
  const item = newRegionalDoubleOptInRollup("code-675", "title-736");
  const view = toRegionalDoubleOptInRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalDoubleOptInRollupViews([item, item]).length, 2, "views");
});
