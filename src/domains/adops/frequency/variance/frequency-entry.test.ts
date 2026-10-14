import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyEntry } from "./frequency-entry.js";

test("FrequencyEntry starts in created", () => {
  const item = newFrequencyEntry("code-426", "label-314");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyEntry moves to published", () => {
  const item = newFrequencyEntry("code-426", "label-314");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("FrequencyEntry rejects moves from retired", () => {
  const item = newFrequencyEntry("code-426", "label-314");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
