import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyVariance } from "./frequency-variance.js";

test("FrequencyVariance starts in new", () => {
  const item = newFrequencyVariance("code-53", "name-945");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyVariance moves to running", () => {
  const item = newFrequencyVariance("code-53", "name-945");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("FrequencyVariance rejects moves from failed", () => {
  const item = newFrequencyVariance("code-53", "name-945");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
