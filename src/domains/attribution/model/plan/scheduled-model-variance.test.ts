import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledModelVariance } from "./scheduled-model-variance.js";

test("ScheduledModelVariance starts in new", () => {
  const item = newScheduledModelVariance("code-411", "name-327");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledModelVariance moves to queued", () => {
  const item = newScheduledModelVariance("code-411", "name-327");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ScheduledModelVariance rejects moves from failed", () => {
  const item = newScheduledModelVariance("code-411", "name-327");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
