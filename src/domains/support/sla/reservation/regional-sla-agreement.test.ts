import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSlaAgreement } from "./regional-sla-agreement.js";

test("RegionalSlaAgreement starts in open", () => {
  const item = newRegionalSlaAgreement("code-802", "title-545");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSlaAgreement moves to reopened", () => {
  const item = newRegionalSlaAgreement("code-802", "title-545");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RegionalSlaAgreement rejects moves from archived", () => {
  const item = newRegionalSlaAgreement("code-802", "title-545");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
