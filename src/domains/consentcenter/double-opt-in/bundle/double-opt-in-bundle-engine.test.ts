import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDoubleOptInBundleEngine } from "./double-opt-in-bundle-engine.js";
import { newDoubleOptInBundle } from "./double-opt-in-bundle.js";

test("DoubleOptInBundleEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInBundleEngine(flags.newRegistry());
  const item = newDoubleOptInBundle("code-220", "name-707");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
