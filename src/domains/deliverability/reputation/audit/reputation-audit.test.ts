import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationAudit } from "./reputation-audit.js";

test("ReputationAudit starts in requested", () => {
  const item = newReputationAudit("code-593", "name-624");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationAudit moves to granted", () => {
  const item = newReputationAudit("code-593", "name-624");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ReputationAudit rejects moves from expired", () => {
  const item = newReputationAudit("code-593", "name-624");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
