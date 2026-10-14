import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictFunnelBundleEngine } from "./strict-funnel-bundle-engine.js";
import { newStrictFunnelBundle } from "./strict-funnel-bundle.js";

test("StrictFunnelBundleEngine keeps results within bounds", () => {
  const engine = defaultStrictFunnelBundleEngine(flags.newRegistry());
  const item = newStrictFunnelBundle("code-41", "title-577");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
