import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationClaim } from "./escalation-claim.js";

test("EscalationClaim starts in created", () => {
  const item = newEscalationClaim("code-970", "title-537");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationClaim moves to published", () => {
  const item = newEscalationClaim("code-970", "title-537");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("EscalationClaim rejects moves from retired", () => {
  const item = newEscalationClaim("code-970", "title-537");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
