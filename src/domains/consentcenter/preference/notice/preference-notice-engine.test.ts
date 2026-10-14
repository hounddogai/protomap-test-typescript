import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceNoticeEngine } from "./preference-notice-engine.js";
import { newPreferenceNotice } from "./preference-notice.js";

test("PreferenceNoticeEngine keeps results within bounds", () => {
  const engine = defaultPreferenceNoticeEngine(flags.newRegistry());
  const item = newPreferenceNotice("code-291", "name-475");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
