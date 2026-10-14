import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelOverride } from "./model-override.js";

test("ModelOverride starts in proposed", () => {
  const item = newModelOverride("code-925", "title-99");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelOverride moves to withdrawn", () => {
  const item = newModelOverride("code-925", "title-99");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ModelOverride rejects moves from withdrawn", () => {
  const item = newModelOverride("code-925", "title-99");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
