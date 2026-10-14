import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatAgreement } from "./csat-agreement.js";

test("CsatAgreement starts in requested", () => {
  const item = newCsatAgreement("code-115", "label-497");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatAgreement moves to granted", () => {
  const item = newCsatAgreement("code-115", "label-497");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CsatAgreement rejects moves from expired", () => {
  const item = newCsatAgreement("code-115", "label-497");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
