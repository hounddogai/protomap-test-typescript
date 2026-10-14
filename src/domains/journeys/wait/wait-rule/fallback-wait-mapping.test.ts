import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackWaitMapping } from "./fallback-wait-mapping.js";

test("FallbackWaitMapping starts in proposed", () => {
  const item = newFallbackWaitMapping("code-742", "label-654");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackWaitMapping moves to approved", () => {
  const item = newFallbackWaitMapping("code-742", "label-654");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FallbackWaitMapping rejects moves from withdrawn", () => {
  const item = newFallbackWaitMapping("code-742", "label-654");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
