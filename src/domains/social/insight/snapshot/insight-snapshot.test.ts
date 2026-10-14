import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightSnapshot } from "./insight-snapshot.js";

test("InsightSnapshot starts in draft", () => {
  const item = newInsightSnapshot("code-53", "name-185");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightSnapshot moves to closed", () => {
  const item = newInsightSnapshot("code-53", "name-185");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("InsightSnapshot rejects moves from closed", () => {
  const item = newInsightSnapshot("code-53", "name-185");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
