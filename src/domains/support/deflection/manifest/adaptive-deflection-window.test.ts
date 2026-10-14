import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDeflectionWindow } from "./adaptive-deflection-window.js";

test("AdaptiveDeflectionWindow starts in open", () => {
  const item = newAdaptiveDeflectionWindow("code-854", "title-588");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDeflectionWindow moves to reopened", () => {
  const item = newAdaptiveDeflectionWindow("code-854", "title-588");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("AdaptiveDeflectionWindow rejects moves from archived", () => {
  const item = newAdaptiveDeflectionWindow("code-854", "title-588");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
