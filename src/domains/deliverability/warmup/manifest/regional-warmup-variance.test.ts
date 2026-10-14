import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalWarmupVariance } from "./regional-warmup-variance.js";

test("RegionalWarmupVariance starts in draft", () => {
  const item = newRegionalWarmupVariance("code-962", "title-880");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalWarmupVariance moves to pending", () => {
  const item = newRegionalWarmupVariance("code-962", "title-880");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RegionalWarmupVariance rejects moves from closed", () => {
  const item = newRegionalWarmupVariance("code-962", "title-880");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
