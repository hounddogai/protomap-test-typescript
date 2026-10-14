import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledMacroQuotaEngine } from "./scheduled-macro-quota-engine.js";
import { newScheduledMacroQuota } from "./scheduled-macro-quota.js";

test("ScheduledMacroQuotaEngine keeps results within bounds", () => {
  const engine = defaultScheduledMacroQuotaEngine(flags.newRegistry());
  const item = newScheduledMacroQuota("code-484", "title-137");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
