import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStepNoticeEngine } from "./step-notice-engine.js";
import { newStepNotice } from "./step-notice.js";

test("StepNoticeEngine keeps results within bounds", () => {
  const engine = defaultStepNoticeEngine();
  const item = newStepNotice("code-137", "name-166");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
