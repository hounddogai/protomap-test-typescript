import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeEstimate } from "./creative-estimate.js";

test("CreativeEstimate starts in draft", () => {
  const item = newCreativeEstimate("code-912", "label-763");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeEstimate moves to active", () => {
  const item = newCreativeEstimate("code-912", "label-763");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("CreativeEstimate rejects moves from closed", () => {
  const item = newCreativeEstimate("code-912", "label-763");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
