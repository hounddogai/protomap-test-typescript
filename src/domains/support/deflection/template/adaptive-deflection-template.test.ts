import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDeflectionTemplate } from "./adaptive-deflection-template.js";

test("AdaptiveDeflectionTemplate starts in planned", () => {
  const item = newAdaptiveDeflectionTemplate("code-902", "title-794");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDeflectionTemplate moves to scheduled", () => {
  const item = newAdaptiveDeflectionTemplate("code-902", "title-794");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("AdaptiveDeflectionTemplate rejects moves from cancelled", () => {
  const item = newAdaptiveDeflectionTemplate("code-902", "title-794");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
