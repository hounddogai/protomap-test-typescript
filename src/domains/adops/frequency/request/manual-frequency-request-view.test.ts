import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualFrequencyRequestView, toManualFrequencyRequestViews } from "./manual-frequency-request-view.js";
import { newManualFrequencyRequest } from "./manual-frequency-request.js";

test("ManualFrequencyRequestView shows the status in capitals", () => {
  const item = newManualFrequencyRequest("code-183", "name-861");
  const view = toManualFrequencyRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualFrequencyRequestViews([item, item]).length, 2, "views");
});
