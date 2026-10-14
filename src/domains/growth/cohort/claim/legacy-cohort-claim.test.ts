import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCohortClaim } from "./legacy-cohort-claim.js";

test("LegacyCohortClaim starts in created", () => {
  const item = newLegacyCohortClaim("code-193", "title-630");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCohortClaim moves to validated", () => {
  const item = newLegacyCohortClaim("code-193", "title-630");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyCohortClaim rejects moves from retired", () => {
  const item = newLegacyCohortClaim("code-193", "title-630");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
