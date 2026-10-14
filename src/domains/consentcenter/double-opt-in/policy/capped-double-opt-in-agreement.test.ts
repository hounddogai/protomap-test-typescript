import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedDoubleOptInAgreement } from "./capped-double-opt-in-agreement.js";

test("CappedDoubleOptInAgreement starts in created", () => {
  const item = newCappedDoubleOptInAgreement("code-109", "title-70");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedDoubleOptInAgreement moves to validated", () => {
  const item = newCappedDoubleOptInAgreement("code-109", "title-70");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CappedDoubleOptInAgreement rejects moves from retired", () => {
  const item = newCappedDoubleOptInAgreement("code-109", "title-70");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
