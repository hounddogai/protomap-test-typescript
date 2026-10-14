import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBranchBundle } from "./seasonal-branch-bundle.js";

test("SeasonalBranchBundle starts in idle", () => {
  const item = newSeasonalBranchBundle("code-265", "label-831");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBranchBundle moves to warming", () => {
  const item = newSeasonalBranchBundle("code-265", "label-831");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("SeasonalBranchBundle rejects moves from stopped", () => {
  const item = newSeasonalBranchBundle("code-265", "label-831");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
