import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutCycle } from "./opt-out-cycle.js";

test("OptOutCycle starts in requested", () => {
  const item = newOptOutCycle("code-349", "title-617");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutCycle moves to granted", () => {
  const item = newOptOutCycle("code-349", "title-617");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("OptOutCycle rejects moves from expired", () => {
  const item = newOptOutCycle("code-349", "title-617");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
