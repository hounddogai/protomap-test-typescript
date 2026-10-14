import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackNudgeEntry } from "./fallback-nudge-entry.js";

test("FallbackNudgeEntry starts in open", () => {
  const item = newFallbackNudgeEntry("code-607", "title-836");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackNudgeEntry moves to in review", () => {
  const item = newFallbackNudgeEntry("code-607", "title-836");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackNudgeEntry rejects moves from archived", () => {
  const item = newFallbackNudgeEntry("code-607", "title-836");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
