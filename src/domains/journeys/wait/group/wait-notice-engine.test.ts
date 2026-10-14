import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitNoticeEngine } from "./wait-notice-engine.js";
import { newWaitNotice } from "./wait-notice.js";

test("WaitNoticeEngine keeps results within bounds", () => {
  const engine = defaultWaitNoticeEngine();
  const item = newWaitNotice("code-544", "name-412");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
