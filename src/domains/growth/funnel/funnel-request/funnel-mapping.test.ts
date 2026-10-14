import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelMapping } from "./funnel-mapping.js";

test("FunnelMapping starts in open", () => {
  const item = newFunnelMapping("code-86", "name-376");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelMapping moves to resolved", () => {
  const item = newFunnelMapping("code-86", "name-376");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FunnelMapping rejects moves from archived", () => {
  const item = newFunnelMapping("code-86", "name-376");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
