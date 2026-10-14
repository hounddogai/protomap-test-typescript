import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeOverride } from "./creative-override.js";

test("CreativeOverride starts in draft", () => {
  const item = newCreativeOverride("code-948", "label-653");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeOverride moves to pending", () => {
  const item = newCreativeOverride("code-948", "label-653");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CreativeOverride rejects moves from closed", () => {
  const item = newCreativeOverride("code-948", "label-653");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
