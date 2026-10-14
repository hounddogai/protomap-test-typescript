import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelWindow } from "./funnel-window.js";

test("FunnelWindow starts in planned", () => {
  const item = newFunnelWindow("code-147", "name-997");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelWindow moves to in progress", () => {
  const item = newFunnelWindow("code-147", "name-997");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FunnelWindow rejects moves from cancelled", () => {
  const item = newFunnelWindow("code-147", "name-997");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
