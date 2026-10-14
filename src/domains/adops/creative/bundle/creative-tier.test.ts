import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeTier } from "./creative-tier.js";

test("CreativeTier starts in new", () => {
  const item = newCreativeTier("code-874", "name-811");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeTier moves to queued", () => {
  const item = newCreativeTier("code-874", "name-811");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CreativeTier rejects moves from failed", () => {
  const item = newCreativeTier("code-874", "name-811");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
