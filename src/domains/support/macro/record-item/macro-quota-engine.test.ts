import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroQuotaEngine } from "./macro-quota-engine.js";
import { newMacroQuota } from "./macro-quota.js";

test("MacroQuotaEngine keeps results within bounds", () => {
  const engine = defaultMacroQuotaEngine(flags.newRegistry());
  const item = newMacroQuota("code-486", "name-538");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
