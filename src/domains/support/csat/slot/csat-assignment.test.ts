import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatAssignment } from "./csat-assignment.js";

test("CsatAssignment starts in open", () => {
  const item = newCsatAssignment("code-610", "name-971");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatAssignment moves to in review", () => {
  const item = newCsatAssignment("code-610", "name-971");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CsatAssignment rejects moves from archived", () => {
  const item = newCsatAssignment("code-610", "name-971");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
