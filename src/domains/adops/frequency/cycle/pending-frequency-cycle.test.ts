import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingFrequencyCycle } from "./pending-frequency-cycle.js";

test("PendingFrequencyCycle starts in draft", () => {
  const item = newPendingFrequencyCycle("code-844", "title-927");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingFrequencyCycle moves to pending", () => {
  const item = newPendingFrequencyCycle("code-844", "title-927");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PendingFrequencyCycle rejects moves from closed", () => {
  const item = newPendingFrequencyCycle("code-844", "title-927");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
