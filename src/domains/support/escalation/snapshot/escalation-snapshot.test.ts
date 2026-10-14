import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationSnapshot } from "./escalation-snapshot.js";

test("EscalationSnapshot starts in requested", () => {
  const item = newEscalationSnapshot("code-253", "title-272");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationSnapshot moves to revoked", () => {
  const item = newEscalationSnapshot("code-253", "title-272");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("EscalationSnapshot rejects moves from expired", () => {
  const item = newEscalationSnapshot("code-253", "title-272");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
