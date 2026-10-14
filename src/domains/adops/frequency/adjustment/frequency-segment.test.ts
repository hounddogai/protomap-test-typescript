import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencySegment } from "./frequency-segment.js";

test("FrequencySegment starts in created", () => {
  const item = newFrequencySegment("code-490", "label-478");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencySegment moves to validated", () => {
  const item = newFrequencySegment("code-490", "label-478");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FrequencySegment rejects moves from retired", () => {
  const item = newFrequencySegment("code-490", "label-478");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
