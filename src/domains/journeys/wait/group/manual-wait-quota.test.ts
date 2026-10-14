import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualWaitQuota } from "./manual-wait-quota.js";

test("ManualWaitQuota starts in created", () => {
  const item = newManualWaitQuota("code-623", "name-833");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualWaitQuota moves to published", () => {
  const item = newManualWaitQuota("code-623", "name-833");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ManualWaitQuota rejects moves from retired", () => {
  const item = newManualWaitQuota("code-623", "name-833");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
