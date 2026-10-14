import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionCycle } from "./retention-cycle.js";

test("RetentionCycle starts in requested", () => {
  const item = newRetentionCycle("code-941", "name-965");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionCycle moves to granted", () => {
  const item = newRetentionCycle("code-941", "name-965");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RetentionCycle rejects moves from expired", () => {
  const item = newRetentionCycle("code-941", "name-965");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
