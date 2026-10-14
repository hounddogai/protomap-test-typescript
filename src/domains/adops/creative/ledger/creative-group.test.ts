import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeGroup } from "./creative-group.js";

test("CreativeGroup starts in idle", () => {
  const item = newCreativeGroup("code-97", "title-599");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeGroup moves to warming", () => {
  const item = newCreativeGroup("code-97", "title-599");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CreativeGroup rejects moves from stopped", () => {
  const item = newCreativeGroup("code-97", "title-599");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
