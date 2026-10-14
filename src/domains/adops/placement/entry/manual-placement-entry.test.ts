import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPlacementEntry } from "./manual-placement-entry.js";

test("ManualPlacementEntry starts in open", () => {
  const item = newManualPlacementEntry("code-369", "title-761");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPlacementEntry moves to resolved", () => {
  const item = newManualPlacementEntry("code-369", "title-761");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ManualPlacementEntry rejects moves from archived", () => {
  const item = newManualPlacementEntry("code-369", "title-761");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
