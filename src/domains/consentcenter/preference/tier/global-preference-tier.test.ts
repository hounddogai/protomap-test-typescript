import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPreferenceTier } from "./global-preference-tier.js";

test("GlobalPreferenceTier starts in draft", () => {
  const item = newGlobalPreferenceTier("code-309", "title-619");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPreferenceTier moves to suspended", () => {
  const item = newGlobalPreferenceTier("code-309", "title-619");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("GlobalPreferenceTier rejects moves from closed", () => {
  const item = newGlobalPreferenceTier("code-309", "title-619");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
