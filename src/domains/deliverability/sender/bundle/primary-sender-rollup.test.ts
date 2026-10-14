import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySenderRollup } from "./primary-sender-rollup.js";

test("PrimarySenderRollup starts in idle", () => {
  const item = newPrimarySenderRollup("code-145", "name-779");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySenderRollup moves to stopped", () => {
  const item = newPrimarySenderRollup("code-145", "name-779");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("PrimarySenderRollup rejects moves from stopped", () => {
  const item = newPrimarySenderRollup("code-145", "name-779");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
