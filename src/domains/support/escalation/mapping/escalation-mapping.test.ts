import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationMapping } from "./escalation-mapping.js";

test("EscalationMapping starts in proposed", () => {
  const item = newEscalationMapping("code-581", "title-143");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationMapping moves to rejected", () => {
  const item = newEscalationMapping("code-581", "title-143");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("EscalationMapping rejects moves from withdrawn", () => {
  const item = newEscalationMapping("code-581", "title-143");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
