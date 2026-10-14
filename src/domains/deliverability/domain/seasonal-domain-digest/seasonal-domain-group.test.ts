import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDomainGroup } from "./seasonal-domain-group.js";

test("SeasonalDomainGroup starts in idle", () => {
  const item = newSeasonalDomainGroup("code-733", "title-448");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDomainGroup moves to warming", () => {
  const item = newSeasonalDomainGroup("code-733", "title-448");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("SeasonalDomainGroup rejects moves from stopped", () => {
  const item = newSeasonalDomainGroup("code-733", "title-448");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
