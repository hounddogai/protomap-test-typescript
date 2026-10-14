import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatTier } from "./csat-tier.js";

test("CsatTier starts in draft", () => {
  const item = newCsatTier("code-759", "title-401");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatTier moves to closed", () => {
  const item = newCsatTier("code-759", "title-401");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("CsatTier rejects moves from closed", () => {
  const item = newCsatTier("code-759", "title-401");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
