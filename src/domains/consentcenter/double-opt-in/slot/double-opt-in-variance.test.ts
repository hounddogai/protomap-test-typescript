import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInVariance } from "./double-opt-in-variance.js";

test("DoubleOptInVariance starts in planned", () => {
  const item = newDoubleOptInVariance("code-910", "title-565");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInVariance moves to in progress", () => {
  const item = newDoubleOptInVariance("code-910", "title-565");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DoubleOptInVariance rejects moves from cancelled", () => {
  const item = newDoubleOptInVariance("code-910", "title-565");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
