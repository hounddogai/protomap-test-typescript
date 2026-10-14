import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPlacementEntry } from "./global-placement-entry.js";

test("GlobalPlacementEntry starts in draft", () => {
  const item = newGlobalPlacementEntry("code-154", "title-306");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPlacementEntry moves to active", () => {
  const item = newGlobalPlacementEntry("code-154", "title-306");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("GlobalPlacementEntry rejects moves from closed", () => {
  const item = newGlobalPlacementEntry("code-154", "title-306");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
