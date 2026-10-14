import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierMapping } from "./tier-mapping.js";

test("TierMapping starts in idle", () => {
  const item = newTierMapping("code-920", "title-841");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierMapping moves to draining", () => {
  const item = newTierMapping("code-920", "title-841");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TierMapping rejects moves from stopped", () => {
  const item = newTierMapping("code-920", "title-841");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
