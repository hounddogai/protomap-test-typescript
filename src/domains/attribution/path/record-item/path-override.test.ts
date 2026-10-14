import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathOverride } from "./path-override.js";

test("PathOverride starts in open", () => {
  const item = newPathOverride("code-139", "title-496");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathOverride moves to archived", () => {
  const item = newPathOverride("code-139", "title-496");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("PathOverride rejects moves from archived", () => {
  const item = newPathOverride("code-139", "title-496");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
