import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalDeflectionDigestEngine } from "./seasonal-deflection-digest-engine.js";
import { newSeasonalDeflectionDigest } from "./seasonal-deflection-digest.js";

test("SeasonalDeflectionDigestEngine keeps results within bounds", () => {
  const engine = defaultSeasonalDeflectionDigestEngine(flags.newRegistry());
  const item = newSeasonalDeflectionDigest("code-768", "label-761");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
