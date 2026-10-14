import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalInsightGroup } from "./global-insight-group.js";

test("GlobalInsightGroup starts in requested", () => {
  const item = newGlobalInsightGroup("code-514", "label-229");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalInsightGroup moves to expired", () => {
  const item = newGlobalInsightGroup("code-514", "label-229");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("GlobalInsightGroup rejects moves from expired", () => {
  const item = newGlobalInsightGroup("code-514", "label-229");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
