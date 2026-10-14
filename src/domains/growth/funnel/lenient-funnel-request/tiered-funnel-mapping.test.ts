import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredFunnelMapping } from "./tiered-funnel-mapping.js";

test("TieredFunnelMapping starts in created", () => {
  const item = newTieredFunnelMapping("code-397", "name-951");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredFunnelMapping moves to published", () => {
  const item = newTieredFunnelMapping("code-397", "name-951");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredFunnelMapping rejects moves from retired", () => {
  const item = newTieredFunnelMapping("code-397", "name-951");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
