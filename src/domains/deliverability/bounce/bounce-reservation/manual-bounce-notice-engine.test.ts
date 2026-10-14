import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualBounceNoticeEngine } from "./manual-bounce-notice-engine.js";
import { newManualBounceNotice } from "./manual-bounce-notice.js";

test("ManualBounceNoticeEngine keeps results within bounds", () => {
  const engine = defaultManualBounceNoticeEngine();
  const item = newManualBounceNotice("code-135", "title-747");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
