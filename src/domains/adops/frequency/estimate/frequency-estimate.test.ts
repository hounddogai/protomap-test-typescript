import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyEstimate } from "./frequency-estimate.js";

test("FrequencyEstimate starts in planned", () => {
  const item = newFrequencyEstimate("code-998", "label-730");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyEstimate moves to completed", () => {
  const item = newFrequencyEstimate("code-998", "label-730");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("FrequencyEstimate rejects moves from cancelled", () => {
  const item = newFrequencyEstimate("code-998", "label-730");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
