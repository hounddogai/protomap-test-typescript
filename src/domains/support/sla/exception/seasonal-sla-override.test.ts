import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSlaOverride } from "./seasonal-sla-override.js";

test("SeasonalSlaOverride starts in draft", () => {
  const item = newSeasonalSlaOverride("code-432", "label-164");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSlaOverride moves to active", () => {
  const item = newSeasonalSlaOverride("code-432", "label-164");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("SeasonalSlaOverride rejects moves from closed", () => {
  const item = newSeasonalSlaOverride("code-432", "label-164");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
