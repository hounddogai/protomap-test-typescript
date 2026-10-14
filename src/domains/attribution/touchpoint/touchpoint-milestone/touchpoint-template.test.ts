import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointTemplate } from "./touchpoint-template.js";

test("TouchpointTemplate starts in created", () => {
  const item = newTouchpointTemplate("code-532", "name-582");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointTemplate moves to validated", () => {
  const item = newTouchpointTemplate("code-532", "name-582");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TouchpointTemplate rejects moves from retired", () => {
  const item = newTouchpointTemplate("code-532", "name-582");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
