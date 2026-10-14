import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDoubleOptInManifestEngine } from "./double-opt-in-manifest-engine.js";
import { newDoubleOptInManifest } from "./double-opt-in-manifest.js";

test("DoubleOptInManifestEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInManifestEngine(flags.newRegistry());
  const item = newDoubleOptInManifest("code-847", "name-885");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
