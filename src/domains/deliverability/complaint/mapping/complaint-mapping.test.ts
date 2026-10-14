import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintMapping } from "./complaint-mapping.js";

test("ComplaintMapping starts in draft", () => {
  const item = newComplaintMapping("code-566", "name-305");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintMapping moves to suspended", () => {
  const item = newComplaintMapping("code-566", "name-305");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ComplaintMapping rejects moves from closed", () => {
  const item = newComplaintMapping("code-566", "name-305");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
