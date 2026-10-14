import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelThreshold } from "./model-threshold.js";

test("ModelThreshold starts in new", () => {
  const item = newModelThreshold("code-797", "label-321");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelThreshold moves to done", () => {
  const item = newModelThreshold("code-797", "label-321");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ModelThreshold rejects moves from failed", () => {
  const item = newModelThreshold("code-797", "label-321");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
