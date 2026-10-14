import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathAdjustment } from "./path-adjustment.js";

test("PathAdjustment starts in new", () => {
  const item = newPathAdjustment("code-862", "label-611");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathAdjustment moves to queued", () => {
  const item = newPathAdjustment("code-862", "label-611");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PathAdjustment rejects moves from failed", () => {
  const item = newPathAdjustment("code-862", "label-611");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
