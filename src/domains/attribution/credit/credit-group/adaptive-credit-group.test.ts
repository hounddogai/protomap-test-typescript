import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCreditGroup } from "./adaptive-credit-group.js";

test("AdaptiveCreditGroup starts in planned", () => {
  const item = newAdaptiveCreditGroup("code-324", "title-286");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCreditGroup moves to scheduled", () => {
  const item = newAdaptiveCreditGroup("code-324", "title-286");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("AdaptiveCreditGroup rejects moves from cancelled", () => {
  const item = newAdaptiveCreditGroup("code-324", "title-286");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
