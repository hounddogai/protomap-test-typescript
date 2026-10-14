import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDeflectionScore } from "./scheduled-deflection-score.js";

test("ScheduledDeflectionScore starts in requested", () => {
  const item = newScheduledDeflectionScore("code-533", "label-303");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDeflectionScore moves to expired", () => {
  const item = newScheduledDeflectionScore("code-533", "label-303");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ScheduledDeflectionScore rejects moves from expired", () => {
  const item = newScheduledDeflectionScore("code-533", "label-303");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
