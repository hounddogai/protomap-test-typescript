import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCohortClaim } from "./regional-cohort-claim.js";

test("RegionalCohortClaim starts in open", () => {
  const item = newRegionalCohortClaim("code-858", "title-911");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCohortClaim moves to reopened", () => {
  const item = newRegionalCohortClaim("code-858", "title-911");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RegionalCohortClaim rejects moves from archived", () => {
  const item = newRegionalCohortClaim("code-858", "title-911");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
