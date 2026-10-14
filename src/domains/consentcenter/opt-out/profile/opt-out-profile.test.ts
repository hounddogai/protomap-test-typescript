import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutProfile } from "./opt-out-profile.js";

test("OptOutProfile starts in draft", () => {
  const item = newOptOutProfile("code-57", "title-7");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutProfile moves to active", () => {
  const item = newOptOutProfile("code-57", "title-7");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("OptOutProfile rejects moves from closed", () => {
  const item = newOptOutProfile("code-57", "title-7");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
