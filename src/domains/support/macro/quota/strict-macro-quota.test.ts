import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictMacroQuota } from "./strict-macro-quota.js";

test("StrictMacroQuota starts in requested", () => {
  const item = newStrictMacroQuota("code-248", "label-796");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictMacroQuota moves to granted", () => {
  const item = newStrictMacroQuota("code-248", "label-796");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictMacroQuota rejects moves from expired", () => {
  const item = newStrictMacroQuota("code-248", "label-796");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
