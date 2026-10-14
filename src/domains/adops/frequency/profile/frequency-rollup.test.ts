import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyRollup } from "./frequency-rollup.js";

test("FrequencyRollup starts in planned", () => {
  const item = newFrequencyRollup("code-130", "name-815");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyRollup moves to cancelled", () => {
  const item = newFrequencyRollup("code-130", "name-815");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("FrequencyRollup rejects moves from cancelled", () => {
  const item = newFrequencyRollup("code-130", "name-815");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
