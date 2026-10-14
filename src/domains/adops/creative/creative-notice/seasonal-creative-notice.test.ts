import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCreativeNotice } from "./seasonal-creative-notice.js";

test("SeasonalCreativeNotice starts in proposed", () => {
  const item = newSeasonalCreativeNotice("code-661", "name-557");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCreativeNotice moves to rejected", () => {
  const item = newSeasonalCreativeNotice("code-661", "name-557");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SeasonalCreativeNotice rejects moves from withdrawn", () => {
  const item = newSeasonalCreativeNotice("code-661", "name-557");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
