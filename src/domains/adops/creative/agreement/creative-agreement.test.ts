import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeAgreement } from "./creative-agreement.js";

test("CreativeAgreement starts in draft", () => {
  const item = newCreativeAgreement("code-660", "name-463");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeAgreement moves to pending", () => {
  const item = newCreativeAgreement("code-660", "name-463");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CreativeAgreement rejects moves from closed", () => {
  const item = newCreativeAgreement("code-660", "name-463");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
