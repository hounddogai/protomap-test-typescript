import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientModelNotice } from "./lenient-model-notice.js";

test("LenientModelNotice starts in created", () => {
  const item = newLenientModelNotice("code-735", "title-918");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientModelNotice moves to published", () => {
  const item = newLenientModelNotice("code-735", "title-918");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LenientModelNotice rejects moves from retired", () => {
  const item = newLenientModelNotice("code-735", "title-918");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
