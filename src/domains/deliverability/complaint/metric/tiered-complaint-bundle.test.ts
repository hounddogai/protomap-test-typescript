import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredComplaintBundle } from "./tiered-complaint-bundle.js";

test("TieredComplaintBundle starts in draft", () => {
  const item = newTieredComplaintBundle("code-669", "name-885");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredComplaintBundle moves to closed", () => {
  const item = newTieredComplaintBundle("code-669", "name-885");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("TieredComplaintBundle rejects moves from closed", () => {
  const item = newTieredComplaintBundle("code-669", "name-885");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
