import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryComplaintMapping } from "./primary-complaint-mapping.js";

test("PrimaryComplaintMapping starts in open", () => {
  const item = newPrimaryComplaintMapping("code-121", "name-880");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryComplaintMapping moves to resolved", () => {
  const item = newPrimaryComplaintMapping("code-121", "name-880");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PrimaryComplaintMapping rejects moves from archived", () => {
  const item = newPrimaryComplaintMapping("code-121", "name-880");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
