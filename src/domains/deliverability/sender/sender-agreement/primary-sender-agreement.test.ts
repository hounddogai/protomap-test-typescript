import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySenderAgreement } from "./primary-sender-agreement.js";

test("PrimarySenderAgreement starts in open", () => {
  const item = newPrimarySenderAgreement("code-690", "name-189");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySenderAgreement moves to reopened", () => {
  const item = newPrimarySenderAgreement("code-690", "name-189");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PrimarySenderAgreement rejects moves from archived", () => {
  const item = newPrimarySenderAgreement("code-690", "name-189");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
