import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionForecast } from "./mention-forecast.js";

test("MentionForecast starts in proposed", () => {
  const item = newMentionForecast("code-960", "name-759");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionForecast moves to rejected", () => {
  const item = newMentionForecast("code-960", "name-759");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("MentionForecast rejects moves from withdrawn", () => {
  const item = newMentionForecast("code-960", "name-759");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
