import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictDoubleOptInException } from "./strict-double-opt-in-exception.js";

test("StrictDoubleOptInException starts in idle", () => {
  const item = newStrictDoubleOptInException("code-595", "title-502");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictDoubleOptInException moves to ready", () => {
  const item = newStrictDoubleOptInException("code-595", "title-502");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("StrictDoubleOptInException rejects moves from stopped", () => {
  const item = newStrictDoubleOptInException("code-595", "title-502");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
