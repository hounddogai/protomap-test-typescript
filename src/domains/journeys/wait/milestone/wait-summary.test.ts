import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitSummary } from "./wait-summary.js";

test("WaitSummary starts in requested", () => {
  const item = newWaitSummary("code-221", "label-655");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitSummary moves to granted", () => {
  const item = newWaitSummary("code-221", "label-655");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WaitSummary rejects moves from expired", () => {
  const item = newWaitSummary("code-221", "label-655");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
