import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCreativeCycle } from "./adaptive-creative-cycle.js";

test("AdaptiveCreativeCycle starts in draft", () => {
  const item = newAdaptiveCreativeCycle("code-990", "name-762");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCreativeCycle moves to pending", () => {
  const item = newAdaptiveCreativeCycle("code-990", "name-762");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("AdaptiveCreativeCycle rejects moves from closed", () => {
  const item = newAdaptiveCreativeCycle("code-990", "name-762");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
