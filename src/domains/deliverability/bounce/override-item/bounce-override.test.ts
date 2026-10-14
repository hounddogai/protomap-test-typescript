import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceOverride } from "./bounce-override.js";

test("BounceOverride starts in created", () => {
  const item = newBounceOverride("code-546", "title-899");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceOverride moves to validated", () => {
  const item = newBounceOverride("code-546", "title-899");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BounceOverride rejects moves from retired", () => {
  const item = newBounceOverride("code-546", "title-899");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
