import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatWindow } from "./csat-window.js";

test("CsatWindow starts in proposed", () => {
  const item = newCsatWindow("code-19", "name-503");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatWindow moves to rejected", () => {
  const item = newCsatWindow("code-19", "name-503");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("CsatWindow rejects moves from withdrawn", () => {
  const item = newCsatWindow("code-19", "name-503");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
