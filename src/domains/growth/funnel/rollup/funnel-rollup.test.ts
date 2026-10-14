import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelRollup } from "./funnel-rollup.js";

test("FunnelRollup starts in draft", () => {
  const item = newFunnelRollup("code-493", "name-488");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelRollup moves to closed", () => {
  const item = newFunnelRollup("code-493", "name-488");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("FunnelRollup rejects moves from closed", () => {
  const item = newFunnelRollup("code-493", "name-488");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
