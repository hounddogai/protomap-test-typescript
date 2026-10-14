import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowTier } from "./window-tier.js";

test("WindowTier starts in proposed", () => {
  const item = newWindowTier("code-875", "title-623");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowTier moves to approved", () => {
  const item = newWindowTier("code-875", "title-623");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WindowTier rejects moves from withdrawn", () => {
  const item = newWindowTier("code-875", "title-623");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
