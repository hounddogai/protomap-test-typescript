import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPostRule } from "./lenient-post-rule.js";

test("LenientPostRule starts in proposed", () => {
  const item = newLenientPostRule("code-278", "title-697");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPostRule moves to approved", () => {
  const item = newLenientPostRule("code-278", "title-697");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientPostRule rejects moves from withdrawn", () => {
  const item = newLenientPostRule("code-278", "title-697");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
