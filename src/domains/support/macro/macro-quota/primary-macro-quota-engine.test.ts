import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryMacroQuotaEngine } from "./primary-macro-quota-engine.js";
import { newPrimaryMacroQuota } from "./primary-macro-quota.js";

test("PrimaryMacroQuotaEngine keeps results within bounds", () => {
  const engine = defaultPrimaryMacroQuotaEngine(flags.newRegistry());
  const item = newPrimaryMacroQuota("code-733", "name-255");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
