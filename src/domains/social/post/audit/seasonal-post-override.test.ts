import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPostOverride } from "./seasonal-post-override.js";

test("SeasonalPostOverride starts in open", () => {
  const item = newSeasonalPostOverride("code-240", "name-591");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPostOverride moves to in review", () => {
  const item = newSeasonalPostOverride("code-240", "name-591");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SeasonalPostOverride rejects moves from archived", () => {
  const item = newSeasonalPostOverride("code-240", "name-591");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
