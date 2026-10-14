import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyLevelNoticeEngine } from "./legacy-level-notice-engine.js";
import { newLegacyLevelNotice } from "./legacy-level-notice.js";

test("LegacyLevelNoticeEngine keeps results within bounds", () => {
  const engine = defaultLegacyLevelNoticeEngine(flags.newRegistry());
  const item = newLegacyLevelNotice("code-861", "title-321");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
