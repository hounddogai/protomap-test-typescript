import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualReplyVariance } from "./manual-reply-variance.js";

test("ManualReplyVariance starts in planned", () => {
  const item = newManualReplyVariance("code-952", "label-267");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualReplyVariance moves to scheduled", () => {
  const item = newManualReplyVariance("code-952", "label-267");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ManualReplyVariance rejects moves from cancelled", () => {
  const item = newManualReplyVariance("code-952", "label-267");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
