import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientTierMapping } from "./lenient-tier-mapping.js";

test("LenientTierMapping starts in proposed", () => {
  const item = newLenientTierMapping("code-134", "title-341");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientTierMapping moves to approved", () => {
  const item = newLenientTierMapping("code-134", "title-341");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientTierMapping rejects moves from withdrawn", () => {
  const item = newLenientTierMapping("code-134", "title-341");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
