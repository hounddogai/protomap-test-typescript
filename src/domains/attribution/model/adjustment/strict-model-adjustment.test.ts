import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictModelAdjustment } from "./strict-model-adjustment.js";

test("StrictModelAdjustment starts in draft", () => {
  const item = newStrictModelAdjustment("code-734", "name-576");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictModelAdjustment moves to pending", () => {
  const item = newStrictModelAdjustment("code-734", "name-576");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StrictModelAdjustment rejects moves from closed", () => {
  const item = newStrictModelAdjustment("code-734", "name-576");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
