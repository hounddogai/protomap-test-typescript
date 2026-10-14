import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderThresholdView, toSenderThresholdViews } from "./sender-threshold-view.js";
import { newSenderThreshold } from "./sender-threshold.js";

test("SenderThresholdView shows the status in capitals", () => {
  const item = newSenderThreshold("code-612", "title-99");
  const view = toSenderThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderThresholdViews([item, item]).length, 2, "views");
});
