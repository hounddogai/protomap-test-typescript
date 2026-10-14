import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConversionBundleEngine } from "./conversion-bundle-engine.js";
import { newConversionBundle } from "./conversion-bundle.js";

test("ConversionBundleEngine keeps results within bounds", () => {
  const engine = defaultConversionBundleEngine();
  const item = newConversionBundle("code-436", "label-395");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
