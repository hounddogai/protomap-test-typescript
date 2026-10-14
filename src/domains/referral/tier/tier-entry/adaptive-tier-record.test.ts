import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveTierRecord } from "./adaptive-tier-record.js";

test("AdaptiveTierRecord starts in open", () => {
  const item = newAdaptiveTierRecord("code-97", "title-101");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveTierRecord moves to in review", () => {
  const item = newAdaptiveTierRecord("code-97", "title-101");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("AdaptiveTierRecord rejects moves from archived", () => {
  const item = newAdaptiveTierRecord("code-97", "title-101");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
