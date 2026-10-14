import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPlacementProfile } from "./regional-placement-profile.js";

test("RegionalPlacementProfile starts in idle", () => {
  const item = newRegionalPlacementProfile("code-97", "title-361");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPlacementProfile moves to draining", () => {
  const item = newRegionalPlacementProfile("code-97", "title-361");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RegionalPlacementProfile rejects moves from stopped", () => {
  const item = newRegionalPlacementProfile("code-97", "title-361");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
