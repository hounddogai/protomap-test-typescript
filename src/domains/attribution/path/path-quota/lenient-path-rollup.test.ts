import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPathRollup } from "./lenient-path-rollup.js";

test("LenientPathRollup starts in planned", () => {
  const item = newLenientPathRollup("code-120", "title-563");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPathRollup moves to scheduled", () => {
  const item = newLenientPathRollup("code-120", "title-563");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientPathRollup rejects moves from cancelled", () => {
  const item = newLenientPathRollup("code-120", "title-563");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
