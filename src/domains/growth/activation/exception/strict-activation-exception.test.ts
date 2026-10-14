import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictActivationException } from "./strict-activation-exception.js";

test("StrictActivationException starts in idle", () => {
  const item = newStrictActivationException("code-594", "name-517");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictActivationException moves to warming", () => {
  const item = newStrictActivationException("code-594", "name-517");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("StrictActivationException rejects moves from stopped", () => {
  const item = newStrictActivationException("code-594", "name-517");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
