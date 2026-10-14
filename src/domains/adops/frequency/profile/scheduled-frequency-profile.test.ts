import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFrequencyProfile } from "./scheduled-frequency-profile.js";

test("ScheduledFrequencyProfile starts in requested", () => {
  const item = newScheduledFrequencyProfile("code-870", "title-753");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFrequencyProfile moves to expired", () => {
  const item = newScheduledFrequencyProfile("code-870", "title-753");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ScheduledFrequencyProfile rejects moves from expired", () => {
  const item = newScheduledFrequencyProfile("code-870", "title-753");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
