import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCreativeCycle } from "./strict-creative-cycle.js";

test("StrictCreativeCycle starts in new", () => {
  const item = newStrictCreativeCycle("code-891", "title-516");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCreativeCycle moves to failed", () => {
  const item = newStrictCreativeCycle("code-891", "title-516");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("StrictCreativeCycle rejects moves from failed", () => {
  const item = newStrictCreativeCycle("code-891", "title-516");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
