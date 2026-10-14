import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeCycle } from "./creative-cycle.js";

test("CreativeCycle starts in new", () => {
  const item = newCreativeCycle("code-567", "name-906");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeCycle moves to queued", () => {
  const item = newCreativeCycle("code-567", "name-906");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CreativeCycle rejects moves from failed", () => {
  const item = newCreativeCycle("code-567", "name-906");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
