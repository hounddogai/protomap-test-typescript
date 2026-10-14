import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultBounceException } from "./default-bounce-exception.js";

test("DefaultBounceException starts in proposed", () => {
  const item = newDefaultBounceException("code-614", "title-349");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultBounceException moves to rejected", () => {
  const item = newDefaultBounceException("code-614", "title-349");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("DefaultBounceException rejects moves from withdrawn", () => {
  const item = newDefaultBounceException("code-614", "title-349");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
