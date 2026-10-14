import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPostRule } from "./strict-post-rule.js";

test("StrictPostRule starts in created", () => {
  const item = newStrictPostRule("code-108", "title-108");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPostRule moves to validated", () => {
  const item = newStrictPostRule("code-108", "title-108");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StrictPostRule rejects moves from retired", () => {
  const item = newStrictPostRule("code-108", "title-108");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
