import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveNudgeMapping } from "./adaptive-nudge-mapping.js";

test("AdaptiveNudgeMapping starts in new", () => {
  const item = newAdaptiveNudgeMapping("code-601", "name-824");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveNudgeMapping moves to queued", () => {
  const item = newAdaptiveNudgeMapping("code-601", "name-824");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveNudgeMapping rejects moves from failed", () => {
  const item = newAdaptiveNudgeMapping("code-601", "name-824");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
