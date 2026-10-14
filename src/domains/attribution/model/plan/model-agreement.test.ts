import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelAgreement } from "./model-agreement.js";

test("ModelAgreement starts in open", () => {
  const item = newModelAgreement("code-583", "title-98");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelAgreement moves to in review", () => {
  const item = newModelAgreement("code-583", "title-98");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ModelAgreement rejects moves from archived", () => {
  const item = newModelAgreement("code-583", "title-98");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
