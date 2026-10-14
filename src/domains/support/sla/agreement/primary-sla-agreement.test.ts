import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySlaAgreement } from "./primary-sla-agreement.js";

test("PrimarySlaAgreement starts in created", () => {
  const item = newPrimarySlaAgreement("code-457", "title-144");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySlaAgreement moves to published", () => {
  const item = newPrimarySlaAgreement("code-457", "title-144");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PrimarySlaAgreement rejects moves from retired", () => {
  const item = newPrimarySlaAgreement("code-457", "title-144");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
