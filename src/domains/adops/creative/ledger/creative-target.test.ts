import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeTarget } from "./creative-target.js";

test("CreativeTarget starts in requested", () => {
  const item = newCreativeTarget("code-227", "label-265");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeTarget moves to granted", () => {
  const item = newCreativeTarget("code-227", "label-265");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CreativeTarget rejects moves from expired", () => {
  const item = newCreativeTarget("code-227", "label-265");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
