import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveCreditNoticeEngine } from "./adaptive-credit-notice-engine.js";
import { newAdaptiveCreditNotice } from "./adaptive-credit-notice.js";

test("AdaptiveCreditNoticeEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveCreditNoticeEngine();
  const item = newAdaptiveCreditNotice("code-451", "title-88");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
