import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCreativeQuota } from "./seasonal-creative-quota.js";

test("SeasonalCreativeQuota starts in new", () => {
  const item = newSeasonalCreativeQuota("code-954", "label-339");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCreativeQuota moves to running", () => {
  const item = newSeasonalCreativeQuota("code-954", "label-339");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("SeasonalCreativeQuota rejects moves from failed", () => {
  const item = newSeasonalCreativeQuota("code-954", "label-339");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
