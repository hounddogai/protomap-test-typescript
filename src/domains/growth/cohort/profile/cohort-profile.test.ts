import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortProfile } from "./cohort-profile.js";

test("CohortProfile starts in created", () => {
  const item = newCohortProfile("code-786", "title-724");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortProfile moves to validated", () => {
  const item = newCohortProfile("code-786", "title-724");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CohortProfile rejects moves from retired", () => {
  const item = newCohortProfile("code-786", "title-724");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
