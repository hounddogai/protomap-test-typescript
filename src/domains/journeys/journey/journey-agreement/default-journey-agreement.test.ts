import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultJourneyAgreement } from "./default-journey-agreement.js";

test("DefaultJourneyAgreement starts in created", () => {
  const item = newDefaultJourneyAgreement("code-406", "name-938");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultJourneyAgreement moves to validated", () => {
  const item = newDefaultJourneyAgreement("code-406", "name-938");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DefaultJourneyAgreement rejects moves from retired", () => {
  const item = newDefaultJourneyAgreement("code-406", "name-938");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
