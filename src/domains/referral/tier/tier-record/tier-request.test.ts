import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierRequest } from "./tier-request.js";

test("TierRequest starts in idle", () => {
  const item = newTierRequest("code-963", "name-754");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierRequest moves to warming", () => {
  const item = newTierRequest("code-963", "name-754");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TierRequest rejects moves from stopped", () => {
  const item = newTierRequest("code-963", "name-754");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
