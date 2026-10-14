import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeRequest } from "./creative-request.js";

test("CreativeRequest starts in proposed", () => {
  const item = newCreativeRequest("code-985", "name-605");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeRequest moves to rejected", () => {
  const item = newCreativeRequest("code-985", "name-605");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("CreativeRequest rejects moves from withdrawn", () => {
  const item = newCreativeRequest("code-985", "name-605");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
