import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultInsightProfile } from "./default-insight-profile.js";

test("DefaultInsightProfile starts in planned", () => {
  const item = newDefaultInsightProfile("code-646", "label-965");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultInsightProfile moves to in progress", () => {
  const item = newDefaultInsightProfile("code-646", "label-965");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DefaultInsightProfile rejects moves from cancelled", () => {
  const item = newDefaultInsightProfile("code-646", "label-965");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
