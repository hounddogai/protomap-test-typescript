import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveComplaintBundle } from "./adaptive-complaint-bundle.js";

test("AdaptiveComplaintBundle starts in open", () => {
  const item = newAdaptiveComplaintBundle("code-51", "name-419");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveComplaintBundle moves to resolved", () => {
  const item = newAdaptiveComplaintBundle("code-51", "name-419");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("AdaptiveComplaintBundle rejects moves from archived", () => {
  const item = newAdaptiveComplaintBundle("code-51", "name-419");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
