import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointOverride } from "./touchpoint-override.js";

test("TouchpointOverride starts in created", () => {
  const item = newTouchpointOverride("code-211", "label-742");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointOverride moves to validated", () => {
  const item = newTouchpointOverride("code-211", "label-742");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TouchpointOverride rejects moves from retired", () => {
  const item = newTouchpointOverride("code-211", "label-742");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
