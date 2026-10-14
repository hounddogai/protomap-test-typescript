import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedOptOutRequest } from "./capped-opt-out-request.js";

test("CappedOptOutRequest starts in idle", () => {
  const item = newCappedOptOutRequest("code-949", "title-342");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedOptOutRequest moves to warming", () => {
  const item = newCappedOptOutRequest("code-949", "title-342");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedOptOutRequest rejects moves from stopped", () => {
  const item = newCappedOptOutRequest("code-949", "title-342");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
