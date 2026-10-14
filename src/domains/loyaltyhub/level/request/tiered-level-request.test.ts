import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredLevelRequest } from "./tiered-level-request.js";

test("TieredLevelRequest starts in draft", () => {
  const item = newTieredLevelRequest("code-343", "name-540");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredLevelRequest moves to suspended", () => {
  const item = newTieredLevelRequest("code-343", "name-540");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("TieredLevelRequest rejects moves from closed", () => {
  const item = newTieredLevelRequest("code-343", "name-540");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
