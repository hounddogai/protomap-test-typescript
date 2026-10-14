import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyTier } from "./frequency-tier.js";

test("FrequencyTier starts in open", () => {
  const item = newFrequencyTier("code-333", "label-73");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyTier moves to archived", () => {
  const item = newFrequencyTier("code-333", "label-73");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("FrequencyTier rejects moves from archived", () => {
  const item = newFrequencyTier("code-333", "label-73");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
