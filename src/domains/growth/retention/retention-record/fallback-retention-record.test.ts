import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackRetentionRecord } from "./fallback-retention-record.js";

test("FallbackRetentionRecord starts in open", () => {
  const item = newFallbackRetentionRecord("code-785", "name-732");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackRetentionRecord moves to in review", () => {
  const item = newFallbackRetentionRecord("code-785", "name-732");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackRetentionRecord rejects moves from archived", () => {
  const item = newFallbackRetentionRecord("code-785", "name-732");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
