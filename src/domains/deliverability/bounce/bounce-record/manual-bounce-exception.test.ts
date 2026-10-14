import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBounceException } from "./manual-bounce-exception.js";

test("ManualBounceException starts in idle", () => {
  const item = newManualBounceException("code-619", "title-615");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBounceException moves to warming", () => {
  const item = newManualBounceException("code-619", "title-615");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ManualBounceException rejects moves from stopped", () => {
  const item = newManualBounceException("code-619", "title-615");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
