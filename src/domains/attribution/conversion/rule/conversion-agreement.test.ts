import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionAgreement } from "./conversion-agreement.js";

test("ConversionAgreement starts in open", () => {
  const item = newConversionAgreement("code-478", "name-911");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionAgreement moves to in review", () => {
  const item = newConversionAgreement("code-478", "name-911");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ConversionAgreement rejects moves from archived", () => {
  const item = newConversionAgreement("code-478", "name-911");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
