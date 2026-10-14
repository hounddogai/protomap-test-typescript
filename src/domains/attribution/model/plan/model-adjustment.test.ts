import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelAdjustment } from "./model-adjustment.js";

test("ModelAdjustment starts in open", () => {
  const item = newModelAdjustment("code-708", "label-25");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelAdjustment moves to archived", () => {
  const item = newModelAdjustment("code-708", "label-25");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("ModelAdjustment rejects moves from archived", () => {
  const item = newModelAdjustment("code-708", "label-25");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
