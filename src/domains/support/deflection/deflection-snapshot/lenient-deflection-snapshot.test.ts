import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDeflectionSnapshot } from "./lenient-deflection-snapshot.js";

test("LenientDeflectionSnapshot starts in draft", () => {
  const item = newLenientDeflectionSnapshot("code-344", "label-600");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDeflectionSnapshot moves to active", () => {
  const item = newLenientDeflectionSnapshot("code-344", "label-600");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LenientDeflectionSnapshot rejects moves from closed", () => {
  const item = newLenientDeflectionSnapshot("code-344", "label-600");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
