import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCsatTemplate } from "./seasonal-csat-template.js";

test("SeasonalCsatTemplate starts in draft", () => {
  const item = newSeasonalCsatTemplate("code-683", "label-696");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCsatTemplate moves to pending", () => {
  const item = newSeasonalCsatTemplate("code-683", "label-696");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalCsatTemplate rejects moves from closed", () => {
  const item = newSeasonalCsatTemplate("code-683", "label-696");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
