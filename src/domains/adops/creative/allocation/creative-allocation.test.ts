import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeAllocation } from "./creative-allocation.js";

test("CreativeAllocation starts in idle", () => {
  const item = newCreativeAllocation("code-999", "name-354");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeAllocation moves to draining", () => {
  const item = newCreativeAllocation("code-999", "name-354");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("CreativeAllocation rejects moves from stopped", () => {
  const item = newCreativeAllocation("code-999", "name-354");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
