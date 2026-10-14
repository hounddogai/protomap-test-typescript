import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFlightAgreement } from "./primary-flight-agreement.js";

test("PrimaryFlightAgreement starts in created", () => {
  const item = newPrimaryFlightAgreement("code-860", "name-536");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFlightAgreement moves to published", () => {
  const item = newPrimaryFlightAgreement("code-860", "name-536");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PrimaryFlightAgreement rejects moves from retired", () => {
  const item = newPrimaryFlightAgreement("code-860", "name-536");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
