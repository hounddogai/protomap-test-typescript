import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFrequencyBatch } from "./global-frequency-batch.js";

test("GlobalFrequencyBatch starts in draft", () => {
  const item = newGlobalFrequencyBatch("code-188", "name-11");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFrequencyBatch moves to suspended", () => {
  const item = newGlobalFrequencyBatch("code-188", "name-11");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("GlobalFrequencyBatch rejects moves from closed", () => {
  const item = newGlobalFrequencyBatch("code-188", "name-11");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
