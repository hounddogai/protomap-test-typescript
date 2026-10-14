import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightWindow } from "./insight-window.js";

test("InsightWindow starts in open", () => {
  const item = newInsightWindow("code-763", "title-118");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightWindow moves to reopened", () => {
  const item = newInsightWindow("code-763", "title-118");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("InsightWindow rejects moves from archived", () => {
  const item = newInsightWindow("code-763", "title-118");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
