import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimarySenderRollupView, toPrimarySenderRollupViews } from "./primary-sender-rollup-view.js";
import { newPrimarySenderRollup } from "./primary-sender-rollup.js";

test("PrimarySenderRollupView shows the status in capitals", () => {
  const item = newPrimarySenderRollup("code-145", "name-779");
  const view = toPrimarySenderRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySenderRollupViews([item, item]).length, 2, "views");
});
