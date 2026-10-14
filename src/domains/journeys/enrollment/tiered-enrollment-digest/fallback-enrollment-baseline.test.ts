import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackEnrollmentBaseline } from "./fallback-enrollment-baseline.js";

test("FallbackEnrollmentBaseline starts in created", () => {
  const item = newFallbackEnrollmentBaseline("code-919", "label-173");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackEnrollmentBaseline moves to validated", () => {
  const item = newFallbackEnrollmentBaseline("code-919", "label-173");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackEnrollmentBaseline rejects moves from retired", () => {
  const item = newFallbackEnrollmentBaseline("code-919", "label-173");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
