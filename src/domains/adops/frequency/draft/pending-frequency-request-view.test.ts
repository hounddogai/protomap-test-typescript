import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingFrequencyRequestView, toPendingFrequencyRequestViews } from "./pending-frequency-request-view.js";
import { newPendingFrequencyRequest } from "./pending-frequency-request.js";

test("PendingFrequencyRequestView shows the status in capitals", () => {
  const item = newPendingFrequencyRequest("code-160", "label-522");
  const view = toPendingFrequencyRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingFrequencyRequestViews([item, item]).length, 2, "views");
});
