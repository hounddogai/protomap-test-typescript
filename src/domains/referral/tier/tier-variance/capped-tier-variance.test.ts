import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedTierVariance } from "./capped-tier-variance.js";

test("CappedTierVariance starts in draft", () => {
  const item = newCappedTierVariance("code-736", "title-167");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedTierVariance moves to suspended", () => {
  const item = newCappedTierVariance("code-736", "title-167");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("CappedTierVariance rejects moves from closed", () => {
  const item = newCappedTierVariance("code-736", "title-167");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
