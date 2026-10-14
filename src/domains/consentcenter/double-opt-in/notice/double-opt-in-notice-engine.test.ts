import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDoubleOptInNoticeEngine } from "./double-opt-in-notice-engine.js";
import { newDoubleOptInNotice } from "./double-opt-in-notice.js";

test("DoubleOptInNoticeEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInNoticeEngine(flags.newRegistry());
  const item = newDoubleOptInNotice("code-702", "title-342");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
