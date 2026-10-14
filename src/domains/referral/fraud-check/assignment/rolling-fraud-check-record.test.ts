import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFraudCheckRecord } from "./rolling-fraud-check-record.js";

test("RollingFraudCheckRecord starts in requested", () => {
  const item = newRollingFraudCheckRecord("code-697", "title-815");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFraudCheckRecord moves to revoked", () => {
  const item = newRollingFraudCheckRecord("code-697", "title-815");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RollingFraudCheckRecord rejects moves from expired", () => {
  const item = newRollingFraudCheckRecord("code-697", "title-815");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
