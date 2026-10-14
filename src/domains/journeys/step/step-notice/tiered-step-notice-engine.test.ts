import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredStepNoticeEngine } from "./tiered-step-notice-engine.js";
import { newTieredStepNotice } from "./tiered-step-notice.js";

test("TieredStepNoticeEngine keeps results within bounds", () => {
  const engine = defaultTieredStepNoticeEngine();
  const item = newTieredStepNotice("code-998", "title-677");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
