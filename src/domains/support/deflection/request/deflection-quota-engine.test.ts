import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionQuotaEngine } from "./deflection-quota-engine.js";
import { newDeflectionQuota } from "./deflection-quota.js";

test("DeflectionQuotaEngine keeps results within bounds", () => {
  const engine = defaultDeflectionQuotaEngine(flags.newRegistry());
  const item = newDeflectionQuota("code-342", "title-974");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
