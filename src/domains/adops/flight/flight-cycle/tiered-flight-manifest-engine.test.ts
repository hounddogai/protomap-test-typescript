import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredFlightManifestEngine } from "./tiered-flight-manifest-engine.js";
import { newTieredFlightManifest } from "./tiered-flight-manifest.js";

test("TieredFlightManifestEngine keeps results within bounds", () => {
  const engine = defaultTieredFlightManifestEngine(flags.newRegistry());
  const item = newTieredFlightManifest("code-716", "name-203");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
