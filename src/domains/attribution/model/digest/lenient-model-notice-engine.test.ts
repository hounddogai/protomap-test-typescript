import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientModelNoticeEngine } from "./lenient-model-notice-engine.js";
import { newLenientModelNotice } from "./lenient-model-notice.js";

test("LenientModelNoticeEngine keeps results within bounds", () => {
  const engine = defaultLenientModelNoticeEngine(flags.newRegistry());
  const item = newLenientModelNotice("code-735", "title-918");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
