import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictTouchpointNoticeEngine } from "./strict-touchpoint-notice-engine.js";
import { newStrictTouchpointNotice } from "./strict-touchpoint-notice.js";

test("StrictTouchpointNoticeEngine keeps results within bounds", () => {
  const engine = defaultStrictTouchpointNoticeEngine();
  const item = newStrictTouchpointNotice("code-530", "label-646");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
