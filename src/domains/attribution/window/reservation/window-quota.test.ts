import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowQuota } from "./window-quota.js";

test("WindowQuota starts in created", () => {
  const item = newWindowQuota("code-738", "title-660");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowQuota moves to validated", () => {
  const item = newWindowQuota("code-738", "title-660");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WindowQuota rejects moves from retired", () => {
  const item = newWindowQuota("code-738", "title-660");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
