import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeWindow } from "./creative-window.js";

test("CreativeWindow starts in proposed", () => {
  const item = newCreativeWindow("code-276", "title-133");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeWindow moves to rejected", () => {
  const item = newCreativeWindow("code-276", "title-133");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("CreativeWindow rejects moves from withdrawn", () => {
  const item = newCreativeWindow("code-276", "title-133");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
