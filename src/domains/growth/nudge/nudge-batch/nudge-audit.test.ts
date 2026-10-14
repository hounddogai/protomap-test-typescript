import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeAudit } from "./nudge-audit.js";

test("NudgeAudit starts in requested", () => {
  const item = newNudgeAudit("code-292", "name-203");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeAudit moves to revoked", () => {
  const item = newNudgeAudit("code-292", "name-203");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("NudgeAudit rejects moves from expired", () => {
  const item = newNudgeAudit("code-292", "name-203");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
