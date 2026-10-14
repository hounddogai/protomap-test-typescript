import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPlacementDigest } from "./lenient-placement-digest.js";

test("LenientPlacementDigest starts in planned", () => {
  const item = newLenientPlacementDigest("code-82", "label-639");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPlacementDigest moves to scheduled", () => {
  const item = newLenientPlacementDigest("code-82", "label-639");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientPlacementDigest rejects moves from cancelled", () => {
  const item = newLenientPlacementDigest("code-82", "label-639");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
