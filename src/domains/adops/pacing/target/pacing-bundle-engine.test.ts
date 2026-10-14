import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingBundleEngine } from "./pacing-bundle-engine.js";
import { newPacingBundle } from "./pacing-bundle.js";

test("PacingBundleEngine keeps results within bounds", () => {
  const engine = defaultPacingBundleEngine(flags.newRegistry());
  const item = newPacingBundle("code-694", "label-822");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
