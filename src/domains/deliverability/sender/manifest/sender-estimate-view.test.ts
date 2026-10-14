import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderEstimateView, toSenderEstimateViews } from "./sender-estimate-view.js";
import { newSenderEstimate } from "./sender-estimate.js";

test("SenderEstimateView shows the status in capitals", () => {
  const item = newSenderEstimate("code-547", "label-170");
  const view = toSenderEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderEstimateViews([item, item]).length, 2, "views");
});
