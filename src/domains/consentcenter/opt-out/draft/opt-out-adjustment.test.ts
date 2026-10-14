import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutAdjustment } from "./opt-out-adjustment.js";

test("OptOutAdjustment starts in open", () => {
  const item = newOptOutAdjustment("code-807", "name-694");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutAdjustment moves to archived", () => {
  const item = newOptOutAdjustment("code-807", "name-694");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("OptOutAdjustment rejects moves from archived", () => {
  const item = newOptOutAdjustment("code-807", "name-694");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
