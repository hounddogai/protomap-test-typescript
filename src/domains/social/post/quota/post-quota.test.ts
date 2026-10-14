import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostQuota } from "./post-quota.js";

test("PostQuota starts in draft", () => {
  const item = newPostQuota("code-876", "label-63");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostQuota moves to suspended", () => {
  const item = newPostQuota("code-876", "label-63");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PostQuota rejects moves from closed", () => {
  const item = newPostQuota("code-876", "label-63");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
