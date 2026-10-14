import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationVariance } from "./activation-variance.js";

test("ActivationVariance starts in draft", () => {
  const item = newActivationVariance("code-834", "name-355");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationVariance moves to suspended", () => {
  const item = newActivationVariance("code-834", "name-355");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ActivationVariance rejects moves from closed", () => {
  const item = newActivationVariance("code-834", "name-355");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
