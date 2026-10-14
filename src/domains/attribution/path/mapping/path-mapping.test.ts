import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathMapping } from "./path-mapping.js";

test("PathMapping starts in idle", () => {
  const item = newPathMapping("code-135", "title-188");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathMapping moves to draining", () => {
  const item = newPathMapping("code-135", "title-188");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PathMapping rejects moves from stopped", () => {
  const item = newPathMapping("code-135", "title-188");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
