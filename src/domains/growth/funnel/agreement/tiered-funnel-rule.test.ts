import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredFunnelRule } from "./tiered-funnel-rule.js";

test("TieredFunnelRule starts in created", () => {
  const item = newTieredFunnelRule("code-701", "title-353");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredFunnelRule moves to published", () => {
  const item = newTieredFunnelRule("code-701", "title-353");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredFunnelRule rejects moves from retired", () => {
  const item = newTieredFunnelRule("code-701", "title-353");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
