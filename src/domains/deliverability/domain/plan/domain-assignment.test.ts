import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainAssignment } from "./domain-assignment.js";

test("DomainAssignment starts in open", () => {
  const item = newDomainAssignment("code-792", "label-259");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainAssignment moves to reopened", () => {
  const item = newDomainAssignment("code-792", "label-259");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("DomainAssignment rejects moves from archived", () => {
  const item = newDomainAssignment("code-792", "label-259");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
