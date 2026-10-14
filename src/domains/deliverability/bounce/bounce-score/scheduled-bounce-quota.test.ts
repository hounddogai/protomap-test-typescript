import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledBounceQuota } from "./scheduled-bounce-quota.js";

test("ScheduledBounceQuota starts in requested", () => {
  const item = newScheduledBounceQuota("code-663", "label-647");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledBounceQuota moves to granted", () => {
  const item = newScheduledBounceQuota("code-663", "label-647");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledBounceQuota rejects moves from expired", () => {
  const item = newScheduledBounceQuota("code-663", "label-647");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
