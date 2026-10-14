import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionManifestEngine } from "./deflection-manifest-engine.js";
import { newDeflectionManifest } from "./deflection-manifest.js";

test("DeflectionManifestEngine keeps results within bounds", () => {
  const engine = defaultDeflectionManifestEngine(flags.newRegistry());
  const item = newDeflectionManifest("code-907", "name-43");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
