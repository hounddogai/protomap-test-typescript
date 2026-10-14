import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPostRollup } from "./tiered-post-rollup.js";

test("TieredPostRollup starts in proposed", () => {
  const item = newTieredPostRollup("code-481", "name-952");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPostRollup moves to approved", () => {
  const item = newTieredPostRollup("code-481", "name-952");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredPostRollup rejects moves from withdrawn", () => {
  const item = newTieredPostRollup("code-481", "name-952");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
