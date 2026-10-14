import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowBundleEngine } from "./window-bundle-engine.js";
import { newWindowBundle } from "./window-bundle.js";

test("WindowBundleEngine keeps results within bounds", () => {
  const engine = defaultWindowBundleEngine(flags.newRegistry());
  const item = newWindowBundle("code-805", "name-702");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
