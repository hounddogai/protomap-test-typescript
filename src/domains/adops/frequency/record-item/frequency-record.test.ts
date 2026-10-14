import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyRecord } from "./frequency-record.js";

test("FrequencyRecord starts in draft", () => {
  const item = newFrequencyRecord("code-462", "label-994");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyRecord moves to active", () => {
  const item = newFrequencyRecord("code-462", "label-994");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("FrequencyRecord rejects moves from closed", () => {
  const item = newFrequencyRecord("code-462", "label-994");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
