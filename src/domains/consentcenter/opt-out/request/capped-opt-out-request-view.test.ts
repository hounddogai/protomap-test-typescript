import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedOptOutRequestView, toCappedOptOutRequestViews } from "./capped-opt-out-request-view.js";
import { newCappedOptOutRequest } from "./capped-opt-out-request.js";

test("CappedOptOutRequestView shows the status in capitals", () => {
  const item = newCappedOptOutRequest("code-949", "title-342");
  const view = toCappedOptOutRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedOptOutRequestViews([item, item]).length, 2, "views");
});
