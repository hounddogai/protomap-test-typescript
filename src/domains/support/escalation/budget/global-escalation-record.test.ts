import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalEscalationRecord } from "./global-escalation-record.js";

test("GlobalEscalationRecord starts in proposed", () => {
  const item = newGlobalEscalationRecord("code-413", "name-343");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalEscalationRecord moves to withdrawn", () => {
  const item = newGlobalEscalationRecord("code-413", "name-343");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("GlobalEscalationRecord rejects moves from withdrawn", () => {
  const item = newGlobalEscalationRecord("code-413", "name-343");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
