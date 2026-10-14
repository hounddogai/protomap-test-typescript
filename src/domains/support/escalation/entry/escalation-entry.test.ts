import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationEntry } from "./escalation-entry.js";

test("EscalationEntry starts in proposed", () => {
  const item = newEscalationEntry("code-927", "name-789");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationEntry moves to approved", () => {
  const item = newEscalationEntry("code-927", "name-789");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("EscalationEntry rejects moves from withdrawn", () => {
  const item = newEscalationEntry("code-927", "name-789");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
