import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalInsightThreshold } from "./global-insight-threshold.js";

test("GlobalInsightThreshold starts in requested", () => {
  const item = newGlobalInsightThreshold("code-79", "title-115");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalInsightThreshold moves to revoked", () => {
  const item = newGlobalInsightThreshold("code-79", "title-115");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("GlobalInsightThreshold rejects moves from expired", () => {
  const item = newGlobalInsightThreshold("code-79", "title-115");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
