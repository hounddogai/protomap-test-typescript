import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostForecast } from "./post-forecast.js";

test("PostForecast starts in new", () => {
  const item = newPostForecast("code-50", "label-496");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostForecast moves to done", () => {
  const item = newPostForecast("code-50", "label-496");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PostForecast rejects moves from failed", () => {
  const item = newPostForecast("code-50", "label-496");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
