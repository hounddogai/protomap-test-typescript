import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCreativeEstimate } from "./strict-creative-estimate.js";

test("StrictCreativeEstimate starts in new", () => {
  const item = newStrictCreativeEstimate("code-497", "name-448");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCreativeEstimate moves to queued", () => {
  const item = newStrictCreativeEstimate("code-497", "name-448");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictCreativeEstimate rejects moves from failed", () => {
  const item = newStrictCreativeEstimate("code-497", "name-448");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
