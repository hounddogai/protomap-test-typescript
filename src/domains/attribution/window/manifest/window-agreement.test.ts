import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowAgreement } from "./window-agreement.js";

test("WindowAgreement starts in new", () => {
  const item = newWindowAgreement("code-563", "name-152");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowAgreement moves to failed", () => {
  const item = newWindowAgreement("code-563", "name-152");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("WindowAgreement rejects moves from failed", () => {
  const item = newWindowAgreement("code-563", "name-152");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
