import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualConversionProfileEngine } from "./manual-conversion-profile-engine.js";
import { newManualConversionProfile } from "./manual-conversion-profile.js";

test("ManualConversionProfileEngine keeps results within bounds", () => {
  const engine = defaultManualConversionProfileEngine();
  const item = newManualConversionProfile("code-982", "name-611");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
