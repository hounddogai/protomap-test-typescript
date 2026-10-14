import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSlaTier } from "./lenient-sla-tier.js";

test("LenientSlaTier starts in new", () => {
  const item = newLenientSlaTier("code-163", "label-711");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSlaTier moves to queued", () => {
  const item = newLenientSlaTier("code-163", "label-711");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientSlaTier rejects moves from failed", () => {
  const item = newLenientSlaTier("code-163", "label-711");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
