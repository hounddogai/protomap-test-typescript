import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackCohortRequest } from "./fallback-cohort-request.js";

test("FallbackCohortRequest starts in draft", () => {
  const item = newFallbackCohortRequest("code-63", "name-953");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackCohortRequest moves to pending", () => {
  const item = newFallbackCohortRequest("code-63", "name-953");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("FallbackCohortRequest rejects moves from closed", () => {
  const item = newFallbackCohortRequest("code-63", "name-953");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
