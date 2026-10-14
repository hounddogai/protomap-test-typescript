import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFrequencyMapping } from "./strict-frequency-mapping.js";

test("StrictFrequencyMapping starts in draft", () => {
  const item = newStrictFrequencyMapping("code-956", "title-811");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFrequencyMapping moves to active", () => {
  const item = newStrictFrequencyMapping("code-956", "title-811");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("StrictFrequencyMapping rejects moves from closed", () => {
  const item = newStrictFrequencyMapping("code-956", "title-811");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
