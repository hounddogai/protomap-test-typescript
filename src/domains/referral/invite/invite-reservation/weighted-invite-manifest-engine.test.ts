import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedInviteManifestEngine } from "./weighted-invite-manifest-engine.js";
import { newWeightedInviteManifest } from "./weighted-invite-manifest.js";

test("WeightedInviteManifestEngine keeps results within bounds", () => {
  const engine = defaultWeightedInviteManifestEngine();
  const item = newWeightedInviteManifest("code-246", "name-349");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
