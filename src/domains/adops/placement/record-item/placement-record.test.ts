import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementRecord } from "./placement-record.js";

test("PlacementRecord starts in requested", () => {
  const item = newPlacementRecord("code-429", "name-207");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementRecord moves to granted", () => {
  const item = newPlacementRecord("code-429", "name-207");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PlacementRecord rejects moves from expired", () => {
  const item = newPlacementRecord("code-429", "name-207");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
