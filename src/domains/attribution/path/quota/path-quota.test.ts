import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathQuota } from "./path-quota.js";

test("PathQuota starts in new", () => {
  const item = newPathQuota("code-653", "label-840");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathQuota moves to queued", () => {
  const item = newPathQuota("code-653", "label-840");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PathQuota rejects moves from failed", () => {
  const item = newPathQuota("code-653", "label-840");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
