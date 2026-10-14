import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentMapping } from "./enrollment-mapping.js";

test("EnrollmentMapping starts in proposed", () => {
  const item = newEnrollmentMapping("code-221", "title-213");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentMapping moves to rejected", () => {
  const item = newEnrollmentMapping("code-221", "title-213");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("EnrollmentMapping rejects moves from withdrawn", () => {
  const item = newEnrollmentMapping("code-221", "title-213");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
