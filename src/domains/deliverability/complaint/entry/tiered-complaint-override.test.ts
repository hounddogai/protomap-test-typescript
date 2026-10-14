import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredComplaintOverride } from "./tiered-complaint-override.js";

test("TieredComplaintOverride starts in new", () => {
  const item = newTieredComplaintOverride("code-332", "name-50");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredComplaintOverride moves to queued", () => {
  const item = newTieredComplaintOverride("code-332", "name-50");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredComplaintOverride rejects moves from failed", () => {
  const item = newTieredComplaintOverride("code-332", "name-50");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
