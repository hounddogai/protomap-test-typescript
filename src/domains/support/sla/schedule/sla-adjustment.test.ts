import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaAdjustment } from "./sla-adjustment.js";

test("SlaAdjustment starts in new", () => {
  const item = newSlaAdjustment("code-297", "title-291");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaAdjustment moves to queued", () => {
  const item = newSlaAdjustment("code-297", "title-291");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SlaAdjustment rejects moves from failed", () => {
  const item = newSlaAdjustment("code-297", "title-291");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
