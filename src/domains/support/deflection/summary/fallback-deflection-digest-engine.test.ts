import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackDeflectionDigestEngine } from "./fallback-deflection-digest-engine.js";
import { newFallbackDeflectionDigest } from "./fallback-deflection-digest.js";

test("FallbackDeflectionDigestEngine keeps results within bounds", () => {
  const engine = defaultFallbackDeflectionDigestEngine(flags.newRegistry());
  const item = newFallbackDeflectionDigest("code-584", "name-473");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
