import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSuppressionRecord } from "./global-suppression-record.js";

test("GlobalSuppressionRecord starts in planned", () => {
  const item = newGlobalSuppressionRecord("code-170", "name-528");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSuppressionRecord moves to in progress", () => {
  const item = newGlobalSuppressionRecord("code-170", "name-528");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("GlobalSuppressionRecord rejects moves from cancelled", () => {
  const item = newGlobalSuppressionRecord("code-170", "name-528");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
