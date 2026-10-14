import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictDeflectionOverride } from "./strict-deflection-override.js";

test("StrictDeflectionOverride starts in new", () => {
  const item = newStrictDeflectionOverride("code-322", "title-811");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictDeflectionOverride moves to queued", () => {
  const item = newStrictDeflectionOverride("code-322", "title-811");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictDeflectionOverride rejects moves from failed", () => {
  const item = newStrictDeflectionOverride("code-322", "title-811");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
