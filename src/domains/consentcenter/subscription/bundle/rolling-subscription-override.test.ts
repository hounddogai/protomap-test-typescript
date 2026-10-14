import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSubscriptionOverride } from "./rolling-subscription-override.js";

test("RollingSubscriptionOverride starts in new", () => {
  const item = newRollingSubscriptionOverride("code-585", "title-577");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSubscriptionOverride moves to done", () => {
  const item = newRollingSubscriptionOverride("code-585", "title-577");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("RollingSubscriptionOverride rejects moves from failed", () => {
  const item = newRollingSubscriptionOverride("code-585", "title-577");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
