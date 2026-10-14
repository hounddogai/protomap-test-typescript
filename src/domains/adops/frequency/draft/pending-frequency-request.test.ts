import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingFrequencyRequest } from "./pending-frequency-request.js";

test("PendingFrequencyRequest starts in requested", () => {
  const item = newPendingFrequencyRequest("code-160", "label-522");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingFrequencyRequest moves to expired", () => {
  const item = newPendingFrequencyRequest("code-160", "label-522");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("PendingFrequencyRequest rejects moves from expired", () => {
  const item = newPendingFrequencyRequest("code-160", "label-522");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
