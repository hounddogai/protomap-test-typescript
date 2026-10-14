import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFrequencyRollup } from "./strict-frequency-rollup.js";

test("StrictFrequencyRollup starts in proposed", () => {
  const item = newStrictFrequencyRollup("code-676", "label-172");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFrequencyRollup moves to rejected", () => {
  const item = newStrictFrequencyRollup("code-676", "label-172");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("StrictFrequencyRollup rejects moves from withdrawn", () => {
  const item = newStrictFrequencyRollup("code-676", "label-172");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
