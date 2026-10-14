import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSlaBaseline } from "./rolling-sla-baseline.js";

test("RollingSlaBaseline starts in proposed", () => {
  const item = newRollingSlaBaseline("code-317", "name-623");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSlaBaseline moves to withdrawn", () => {
  const item = newRollingSlaBaseline("code-317", "name-623");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RollingSlaBaseline rejects moves from withdrawn", () => {
  const item = newRollingSlaBaseline("code-317", "name-623");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
