import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInWindow } from "./double-opt-in-window.js";

test("DoubleOptInWindow starts in created", () => {
  const item = newDoubleOptInWindow("code-593", "title-141");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInWindow moves to validated", () => {
  const item = newDoubleOptInWindow("code-593", "title-141");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DoubleOptInWindow rejects moves from retired", () => {
  const item = newDoubleOptInWindow("code-593", "title-141");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
