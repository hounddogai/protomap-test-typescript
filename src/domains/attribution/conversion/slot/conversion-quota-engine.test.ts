import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionQuotaEngine } from "./conversion-quota-engine.js";
import { newConversionQuota } from "./conversion-quota.js";

test("ConversionQuotaEngine keeps results within bounds", () => {
  const engine = defaultConversionQuotaEngine(flags.newRegistry());
  const item = newConversionQuota("code-711", "name-72");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
