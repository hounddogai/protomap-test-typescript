import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingMacroCycle } from "./rolling-macro-cycle.js";

test("RollingMacroCycle starts in draft", () => {
  const item = newRollingMacroCycle("code-273", "label-872");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingMacroCycle moves to active", () => {
  const item = newRollingMacroCycle("code-273", "label-872");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RollingMacroCycle rejects moves from closed", () => {
  const item = newRollingMacroCycle("code-273", "label-872");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
