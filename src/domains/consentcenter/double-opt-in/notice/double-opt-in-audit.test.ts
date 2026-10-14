import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInAudit } from "./double-opt-in-audit.js";

test("DoubleOptInAudit starts in requested", () => {
  const item = newDoubleOptInAudit("code-335", "label-429");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInAudit moves to revoked", () => {
  const item = newDoubleOptInAudit("code-335", "label-429");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("DoubleOptInAudit rejects moves from expired", () => {
  const item = newDoubleOptInAudit("code-335", "label-429");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
