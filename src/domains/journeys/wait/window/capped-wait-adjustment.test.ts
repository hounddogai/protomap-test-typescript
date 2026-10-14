import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedWaitAdjustment } from "./capped-wait-adjustment.js";

test("CappedWaitAdjustment starts in proposed", () => {
  const item = newCappedWaitAdjustment("code-817", "title-130");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedWaitAdjustment moves to approved", () => {
  const item = newCappedWaitAdjustment("code-817", "title-130");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedWaitAdjustment rejects moves from withdrawn", () => {
  const item = newCappedWaitAdjustment("code-817", "title-130");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
