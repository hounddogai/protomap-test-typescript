import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryMacroQuota } from "./primary-macro-quota.js";

test("PrimaryMacroQuota starts in new", () => {
  const item = newPrimaryMacroQuota("code-733", "name-255");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryMacroQuota moves to done", () => {
  const item = newPrimaryMacroQuota("code-733", "name-255");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PrimaryMacroQuota rejects moves from failed", () => {
  const item = newPrimaryMacroQuota("code-733", "name-255");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
