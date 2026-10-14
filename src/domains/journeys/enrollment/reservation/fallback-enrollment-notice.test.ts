import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackEnrollmentNotice } from "./fallback-enrollment-notice.js";

test("FallbackEnrollmentNotice starts in open", () => {
  const item = newFallbackEnrollmentNotice("code-975", "title-167");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackEnrollmentNotice moves to resolved", () => {
  const item = newFallbackEnrollmentNotice("code-975", "title-167");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FallbackEnrollmentNotice rejects moves from archived", () => {
  const item = newFallbackEnrollmentNotice("code-975", "title-167");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
