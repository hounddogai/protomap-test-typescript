import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientDeflectionManifestEngine } from "./lenient-deflection-manifest-engine.js";
import { newLenientDeflectionManifest } from "./lenient-deflection-manifest.js";

test("LenientDeflectionManifestEngine keeps results within bounds", () => {
  const engine = defaultLenientDeflectionManifestEngine(flags.newRegistry());
  const item = newLenientDeflectionManifest("code-44", "name-510");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
