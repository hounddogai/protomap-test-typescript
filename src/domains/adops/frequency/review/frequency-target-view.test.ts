import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyTargetView, toFrequencyTargetViews } from "./frequency-target-view.js";
import { newFrequencyTarget } from "./frequency-target.js";

test("FrequencyTargetView shows the status in capitals", () => {
  const item = newFrequencyTarget("code-970", "name-329");
  const view = toFrequencyTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyTargetViews([item, item]).length, 2, "views");
});
