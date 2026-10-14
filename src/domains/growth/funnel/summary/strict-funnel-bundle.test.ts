import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFunnelBundle } from "./strict-funnel-bundle.js";

test("StrictFunnelBundle starts in created", () => {
  const item = newStrictFunnelBundle("code-41", "title-577");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFunnelBundle moves to published", () => {
  const item = newStrictFunnelBundle("code-41", "title-577");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("StrictFunnelBundle rejects moves from retired", () => {
  const item = newStrictFunnelBundle("code-41", "title-577");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
