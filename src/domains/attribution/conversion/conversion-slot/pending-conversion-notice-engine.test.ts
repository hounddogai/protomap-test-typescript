import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingConversionNoticeEngine } from "./pending-conversion-notice-engine.js";
import { newPendingConversionNotice } from "./pending-conversion-notice.js";

test("PendingConversionNoticeEngine keeps results within bounds", () => {
  const engine = defaultPendingConversionNoticeEngine(flags.newRegistry());
  const item = newPendingConversionNotice("code-123", "title-88");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
