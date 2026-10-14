import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFrequencyCycle } from "./default-frequency-cycle.js";

test("DefaultFrequencyCycle starts in new", () => {
  const item = newDefaultFrequencyCycle("code-764", "title-906");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFrequencyCycle moves to queued", () => {
  const item = newDefaultFrequencyCycle("code-764", "title-906");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("DefaultFrequencyCycle rejects moves from failed", () => {
  const item = newDefaultFrequencyCycle("code-764", "title-906");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
