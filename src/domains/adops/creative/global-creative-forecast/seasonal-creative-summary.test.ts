import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCreativeSummary } from "./seasonal-creative-summary.js";

test("SeasonalCreativeSummary starts in open", () => {
  const item = newSeasonalCreativeSummary("code-990", "title-223");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCreativeSummary moves to archived", () => {
  const item = newSeasonalCreativeSummary("code-990", "title-223");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("SeasonalCreativeSummary rejects moves from archived", () => {
  const item = newSeasonalCreativeSummary("code-990", "title-223");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
