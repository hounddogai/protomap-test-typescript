import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutVarianceView, toOptOutVarianceViews } from "./opt-out-variance-view.js";
import { newOptOutVariance } from "./opt-out-variance.js";

test("OptOutVarianceView shows the status in capitals", () => {
  const item = newOptOutVariance("code-4", "name-425");
  const view = toOptOutVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutVarianceViews([item, item]).length, 2, "views");
});
