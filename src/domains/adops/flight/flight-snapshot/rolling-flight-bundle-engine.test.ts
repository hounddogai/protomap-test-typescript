import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingFlightBundleEngine } from "./rolling-flight-bundle-engine.js";
import { newRollingFlightBundle } from "./rolling-flight-bundle.js";

test("RollingFlightBundleEngine keeps results within bounds", () => {
  const engine = defaultRollingFlightBundleEngine(flags.newRegistry());
  const item = newRollingFlightBundle("code-216", "name-782");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
