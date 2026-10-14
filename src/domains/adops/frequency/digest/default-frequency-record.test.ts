import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFrequencyRecord } from "./default-frequency-record.js";

test("DefaultFrequencyRecord starts in draft", () => {
  const item = newDefaultFrequencyRecord("code-320", "label-560");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFrequencyRecord moves to active", () => {
  const item = newDefaultFrequencyRecord("code-320", "label-560");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("DefaultFrequencyRecord rejects moves from closed", () => {
  const item = newDefaultFrequencyRecord("code-320", "label-560");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
