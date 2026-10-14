import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingReputationRequest } from "./rolling-reputation-request.js";

test("RollingReputationRequest starts in created", () => {
  const item = newRollingReputationRequest("code-2", "label-816");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingReputationRequest moves to published", () => {
  const item = newRollingReputationRequest("code-2", "label-816");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RollingReputationRequest rejects moves from retired", () => {
  const item = newRollingReputationRequest("code-2", "label-816");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
