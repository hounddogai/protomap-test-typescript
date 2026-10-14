import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeThreshold } from "./creative-threshold.js";

test("CreativeThreshold starts in draft", () => {
  const item = newCreativeThreshold("code-97", "title-803");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeThreshold moves to active", () => {
  const item = newCreativeThreshold("code-97", "title-803");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("CreativeThreshold rejects moves from closed", () => {
  const item = newCreativeThreshold("code-97", "title-803");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
