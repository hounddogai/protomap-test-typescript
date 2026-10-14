import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelNoticeEngine } from "./level-notice-engine.js";
import { newLevelNotice } from "./level-notice.js";

test("LevelNoticeEngine keeps results within bounds", () => {
  const engine = defaultLevelNoticeEngine();
  const item = newLevelNotice("code-167", "label-448");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
