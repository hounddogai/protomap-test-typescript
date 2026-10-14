import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingDoubleOptInRollupView,
  toPendingDoubleOptInRollupViews,
} from "./pending-double-opt-in-rollup-view.js";
import { newPendingDoubleOptInRollup } from "./pending-double-opt-in-rollup.js";

test("PendingDoubleOptInRollupView shows the status in capitals", () => {
  const item = newPendingDoubleOptInRollup("code-326", "title-612");
  const view = toPendingDoubleOptInRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingDoubleOptInRollupViews([item, item]).length, 2, "views");
});
