import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveComplaintMapping } from "./adaptive-complaint-mapping.js";

test("AdaptiveComplaintMapping starts in requested", () => {
  const item = newAdaptiveComplaintMapping("code-812", "title-202");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveComplaintMapping moves to expired", () => {
  const item = newAdaptiveComplaintMapping("code-812", "title-202");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("AdaptiveComplaintMapping rejects moves from expired", () => {
  const item = newAdaptiveComplaintMapping("code-812", "title-202");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
