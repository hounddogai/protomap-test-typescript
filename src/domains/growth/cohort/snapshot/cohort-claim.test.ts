import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortClaim } from "./cohort-claim.js";

test("CohortClaim starts in draft", () => {
  const item = newCohortClaim("code-995", "title-731");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortClaim moves to active", () => {
  const item = newCohortClaim("code-995", "title-731");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("CohortClaim rejects moves from closed", () => {
  const item = newCohortClaim("code-995", "title-731");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
