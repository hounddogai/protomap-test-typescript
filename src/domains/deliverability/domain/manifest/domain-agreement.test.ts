import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainAgreement } from "./domain-agreement.js";

test("DomainAgreement starts in new", () => {
  const item = newDomainAgreement("code-246", "name-340");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainAgreement moves to running", () => {
  const item = newDomainAgreement("code-246", "name-340");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DomainAgreement rejects moves from failed", () => {
  const item = newDomainAgreement("code-246", "name-340");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
