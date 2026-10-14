import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaWindow } from "./sla-window.js";

test("SlaWindow starts in planned", () => {
  const item = newSlaWindow("code-699", "label-140");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaWindow moves to in progress", () => {
  const item = newSlaWindow("code-699", "label-140");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("SlaWindow rejects moves from cancelled", () => {
  const item = newSlaWindow("code-699", "label-140");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
