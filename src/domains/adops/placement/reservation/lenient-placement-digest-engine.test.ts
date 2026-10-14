import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientPlacementDigestEngine } from "./lenient-placement-digest-engine.js";
import { newLenientPlacementDigest } from "./lenient-placement-digest.js";

test("LenientPlacementDigestEngine keeps results within bounds", () => {
  const engine = defaultLenientPlacementDigestEngine(flags.newRegistry());
  const item = newLenientPlacementDigest("code-82", "label-639");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
