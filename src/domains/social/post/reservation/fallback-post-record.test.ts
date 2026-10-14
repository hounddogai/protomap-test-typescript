import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPostRecord } from "./fallback-post-record.js";

test("FallbackPostRecord starts in new", () => {
  const item = newFallbackPostRecord("code-6", "label-373");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPostRecord moves to done", () => {
  const item = newFallbackPostRecord("code-6", "label-373");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("FallbackPostRecord rejects moves from failed", () => {
  const item = newFallbackPostRecord("code-6", "label-373");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
