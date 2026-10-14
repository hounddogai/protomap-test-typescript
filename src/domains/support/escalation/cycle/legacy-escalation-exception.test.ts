import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyEscalationException } from "./legacy-escalation-exception.js";

test("LegacyEscalationException starts in proposed", () => {
  const item = newLegacyEscalationException("code-597", "title-379");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyEscalationException moves to rejected", () => {
  const item = newLegacyEscalationException("code-597", "title-379");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LegacyEscalationException rejects moves from withdrawn", () => {
  const item = newLegacyEscalationException("code-597", "title-379");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
