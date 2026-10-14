import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionQuota } from "./deflection-quota.js";

test("DeflectionQuota starts in new", () => {
  const item = newDeflectionQuota("code-342", "title-974");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionQuota moves to failed", () => {
  const item = newDeflectionQuota("code-342", "title-974");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("DeflectionQuota rejects moves from failed", () => {
  const item = newDeflectionQuota("code-342", "title-974");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
