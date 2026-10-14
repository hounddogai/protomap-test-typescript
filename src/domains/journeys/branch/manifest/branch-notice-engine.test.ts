import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchNoticeEngine } from "./branch-notice-engine.js";
import { newBranchNotice } from "./branch-notice.js";

test("BranchNoticeEngine keeps results within bounds", () => {
  const engine = defaultBranchNoticeEngine();
  const item = newBranchNotice("code-295", "name-665");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
