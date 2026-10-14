import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyMapping } from "./frequency-mapping.js";

test("FrequencyMapping starts in created", () => {
  const item = newFrequencyMapping("code-192", "name-798");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyMapping moves to retired", () => {
  const item = newFrequencyMapping("code-192", "name-798");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("FrequencyMapping rejects moves from retired", () => {
  const item = newFrequencyMapping("code-192", "name-798");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
