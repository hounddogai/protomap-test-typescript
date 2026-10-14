import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalCreativeSummary } from "./global-creative-summary.js";

test("GlobalCreativeSummary starts in requested", () => {
  const item = newGlobalCreativeSummary("code-825", "label-187");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalCreativeSummary moves to granted", () => {
  const item = newGlobalCreativeSummary("code-825", "label-187");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("GlobalCreativeSummary rejects moves from expired", () => {
  const item = newGlobalCreativeSummary("code-825", "label-187");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
