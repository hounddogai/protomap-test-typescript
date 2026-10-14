import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalReplyTarget } from "./seasonal-reply-target.js";

test("SeasonalReplyTarget starts in draft", () => {
  const item = newSeasonalReplyTarget("code-567", "label-571");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalReplyTarget moves to closed", () => {
  const item = newSeasonalReplyTarget("code-567", "label-571");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("SeasonalReplyTarget rejects moves from closed", () => {
  const item = newSeasonalReplyTarget("code-567", "label-571");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
