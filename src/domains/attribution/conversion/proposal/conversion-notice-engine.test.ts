import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConversionNoticeEngine } from "./conversion-notice-engine.js";
import { newConversionNotice } from "./conversion-notice.js";

test("ConversionNoticeEngine keeps results within bounds", () => {
  const engine = defaultConversionNoticeEngine();
  const item = newConversionNotice("code-87", "label-355");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
