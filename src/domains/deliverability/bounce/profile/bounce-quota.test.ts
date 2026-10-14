import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceQuota } from "./bounce-quota.js";

test("BounceQuota starts in proposed", () => {
  const item = newBounceQuota("code-565", "title-737");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceQuota moves to rejected", () => {
  const item = newBounceQuota("code-565", "title-737");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("BounceQuota rejects moves from withdrawn", () => {
  const item = newBounceQuota("code-565", "title-737");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
