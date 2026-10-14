import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceSlot } from "./bounce-slot.js";

test("BounceSlot starts in proposed", () => {
  const item = newBounceSlot("code-224", "title-608");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceSlot moves to approved", () => {
  const item = newBounceSlot("code-224", "title-608");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BounceSlot rejects moves from withdrawn", () => {
  const item = newBounceSlot("code-224", "title-608");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
