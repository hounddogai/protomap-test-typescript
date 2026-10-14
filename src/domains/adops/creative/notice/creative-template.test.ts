import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeTemplate } from "./creative-template.js";

test("CreativeTemplate starts in open", () => {
  const item = newCreativeTemplate("code-756", "name-322");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeTemplate moves to resolved", () => {
  const item = newCreativeTemplate("code-756", "name-322");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CreativeTemplate rejects moves from archived", () => {
  const item = newCreativeTemplate("code-756", "name-322");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
