import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationPolicy } from "./activation-policy.js";

test("ActivationPolicy starts in created", () => {
  const item = newActivationPolicy("code-608", "title-941");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationPolicy moves to published", () => {
  const item = newActivationPolicy("code-608", "title-941");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ActivationPolicy rejects moves from retired", () => {
  const item = newActivationPolicy("code-608", "title-941");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
