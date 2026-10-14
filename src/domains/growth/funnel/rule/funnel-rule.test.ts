import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelRule } from "./funnel-rule.js";

test("FunnelRule starts in requested", () => {
  const item = newFunnelRule("code-764", "title-520");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelRule moves to granted", () => {
  const item = newFunnelRule("code-764", "title-520");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FunnelRule rejects moves from expired", () => {
  const item = newFunnelRule("code-764", "title-520");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
