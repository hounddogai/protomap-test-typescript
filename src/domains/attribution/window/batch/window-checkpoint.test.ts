import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowCheckpoint } from "./window-checkpoint.js";

test("WindowCheckpoint starts in proposed", () => {
  const item = newWindowCheckpoint("code-795", "label-604");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowCheckpoint moves to approved", () => {
  const item = newWindowCheckpoint("code-795", "label-604");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WindowCheckpoint rejects moves from withdrawn", () => {
  const item = newWindowCheckpoint("code-795", "label-604");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
