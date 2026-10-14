import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortLedger } from "./cohort-ledger.js";

test("CohortLedger starts in requested", () => {
  const item = newCohortLedger("code-261", "name-879");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortLedger moves to granted", () => {
  const item = newCohortLedger("code-261", "name-879");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CohortLedger rejects moves from expired", () => {
  const item = newCohortLedger("code-261", "name-879");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
