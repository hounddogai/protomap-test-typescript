import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyBatch } from "./frequency-batch.js";

test("FrequencyBatch starts in open", () => {
  const item = newFrequencyBatch("code-385", "label-91");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyBatch moves to in review", () => {
  const item = newFrequencyBatch("code-385", "label-91");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FrequencyBatch rejects moves from archived", () => {
  const item = newFrequencyBatch("code-385", "label-91");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
