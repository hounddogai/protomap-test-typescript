import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveTierRequest } from "./adaptive-tier-request.js";

test("AdaptiveTierRequest starts in planned", () => {
  const item = newAdaptiveTierRequest("code-172", "title-822");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveTierRequest moves to completed", () => {
  const item = newAdaptiveTierRequest("code-172", "title-822");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("AdaptiveTierRequest rejects moves from cancelled", () => {
  const item = newAdaptiveTierRequest("code-172", "title-822");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
