import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedConversionBundleEngine } from "./capped-conversion-bundle-engine.js";
import { newCappedConversionBundle } from "./capped-conversion-bundle.js";

test("CappedConversionBundleEngine keeps results within bounds", () => {
  const engine = defaultCappedConversionBundleEngine(flags.newRegistry());
  const item = newCappedConversionBundle("code-24", "label-562");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
