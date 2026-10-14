import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFraudCheckNoticeEngine } from "./fraud-check-notice-engine.js";
import { newFraudCheckNotice } from "./fraud-check-notice.js";

test("FraudCheckNoticeEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckNoticeEngine();
  const item = newFraudCheckNotice("code-685", "label-497");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
