import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitCycle } from "./wait-cycle.js";

test("WaitCycle starts in requested", () => {
  const item = newWaitCycle("code-394", "title-998");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitCycle moves to granted", () => {
  const item = newWaitCycle("code-394", "title-998");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WaitCycle rejects moves from expired", () => {
  const item = newWaitCycle("code-394", "title-998");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
