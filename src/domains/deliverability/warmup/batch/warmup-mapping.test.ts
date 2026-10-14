import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupMapping } from "./warmup-mapping.js";

test("WarmupMapping starts in created", () => {
  const item = newWarmupMapping("code-107", "label-796");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupMapping moves to published", () => {
  const item = newWarmupMapping("code-107", "label-796");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WarmupMapping rejects moves from retired", () => {
  const item = newWarmupMapping("code-107", "label-796");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
