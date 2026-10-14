import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeRollup } from "./creative-rollup.js";

test("CreativeRollup starts in proposed", () => {
  const item = newCreativeRollup("code-770", "title-438");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeRollup moves to approved", () => {
  const item = newCreativeRollup("code-770", "title-438");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CreativeRollup rejects moves from withdrawn", () => {
  const item = newCreativeRollup("code-770", "title-438");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
