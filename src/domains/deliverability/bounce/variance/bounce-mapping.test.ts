import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceMapping } from "./bounce-mapping.js";

test("BounceMapping starts in planned", () => {
  const item = newBounceMapping("code-377", "name-122");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceMapping moves to completed", () => {
  const item = newBounceMapping("code-377", "name-122");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("BounceMapping rejects moves from cancelled", () => {
  const item = newBounceMapping("code-377", "name-122");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
