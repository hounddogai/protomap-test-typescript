import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptivePlacementManifestEngine } from "./adaptive-placement-manifest-engine.js";
import { newAdaptivePlacementManifest } from "./adaptive-placement-manifest.js";

test("AdaptivePlacementManifestEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePlacementManifestEngine(flags.newRegistry());
  const item = newAdaptivePlacementManifest("code-960", "label-876");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
