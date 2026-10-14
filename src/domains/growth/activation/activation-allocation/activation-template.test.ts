import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationTemplate } from "./activation-template.js";

test("ActivationTemplate starts in new", () => {
  const item = newActivationTemplate("code-198", "name-829");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationTemplate moves to queued", () => {
  const item = newActivationTemplate("code-198", "name-829");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ActivationTemplate rejects moves from failed", () => {
  const item = newActivationTemplate("code-198", "name-829");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
