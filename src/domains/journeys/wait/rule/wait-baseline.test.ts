import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitBaseline } from "./wait-baseline.js";

test("WaitBaseline starts in created", () => {
  const item = newWaitBaseline("code-269", "label-565");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitBaseline moves to published", () => {
  const item = newWaitBaseline("code-269", "label-565");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WaitBaseline rejects moves from retired", () => {
  const item = newWaitBaseline("code-269", "label-565");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
