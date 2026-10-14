import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathQuotaEngine } from "./path-quota-engine.js";
import { newPathQuota } from "./path-quota.js";

test("PathQuotaEngine keeps results within bounds", () => {
  const engine = defaultPathQuotaEngine(flags.newRegistry());
  const item = newPathQuota("code-653", "label-840");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
