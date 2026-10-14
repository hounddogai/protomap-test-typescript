import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackConversionMapping } from "./fallback-conversion-mapping.js";

test("FallbackConversionMapping starts in new", () => {
  const item = newFallbackConversionMapping("code-577", "name-438");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackConversionMapping moves to queued", () => {
  const item = newFallbackConversionMapping("code-577", "name-438");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackConversionMapping rejects moves from failed", () => {
  const item = newFallbackConversionMapping("code-577", "name-438");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
