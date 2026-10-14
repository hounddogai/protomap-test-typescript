import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortOverride } from "./cohort-override.js";

test("CohortOverride starts in requested", () => {
  const item = newCohortOverride("code-455", "name-846");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortOverride moves to granted", () => {
  const item = newCohortOverride("code-455", "name-846");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CohortOverride rejects moves from expired", () => {
  const item = newCohortOverride("code-455", "name-846");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
