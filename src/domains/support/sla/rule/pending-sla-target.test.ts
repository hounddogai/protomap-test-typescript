import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSlaTarget } from "./pending-sla-target.js";

test("PendingSlaTarget starts in open", () => {
  const item = newPendingSlaTarget("code-563", "label-937");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSlaTarget moves to archived", () => {
  const item = newPendingSlaTarget("code-563", "label-937");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("PendingSlaTarget rejects moves from archived", () => {
  const item = newPendingSlaTarget("code-563", "label-937");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
