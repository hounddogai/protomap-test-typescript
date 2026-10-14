import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFrequencySnapshot } from "./default-frequency-snapshot.js";

test("DefaultFrequencySnapshot starts in planned", () => {
  const item = newDefaultFrequencySnapshot("code-960", "name-763");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFrequencySnapshot moves to scheduled", () => {
  const item = newDefaultFrequencySnapshot("code-960", "name-763");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DefaultFrequencySnapshot rejects moves from cancelled", () => {
  const item = newDefaultFrequencySnapshot("code-960", "name-763");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
