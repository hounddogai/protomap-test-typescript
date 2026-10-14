import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionOverrideEngine } from "./conversion-override-engine.js";
import { newConversionOverride } from "./conversion-override.js";

test("ConversionOverrideEngine keeps results within bounds", () => {
  const engine = defaultConversionOverrideEngine(flags.newRegistry());
  const item = newConversionOverride("code-965", "title-902");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
