import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWaitMapping } from "./lenient-wait-mapping.js";

test("LenientWaitMapping starts in created", () => {
  const item = newLenientWaitMapping("code-124", "name-729");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWaitMapping moves to published", () => {
  const item = newLenientWaitMapping("code-124", "name-729");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LenientWaitMapping rejects moves from retired", () => {
  const item = newLenientWaitMapping("code-124", "name-729");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
