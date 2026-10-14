import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingFrequencyTarget } from "./pending-frequency-target.js";

test("PendingFrequencyTarget starts in created", () => {
  const item = newPendingFrequencyTarget("code-210", "title-50");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingFrequencyTarget moves to published", () => {
  const item = newPendingFrequencyTarget("code-210", "title-50");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingFrequencyTarget rejects moves from retired", () => {
  const item = newPendingFrequencyTarget("code-210", "title-50");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
