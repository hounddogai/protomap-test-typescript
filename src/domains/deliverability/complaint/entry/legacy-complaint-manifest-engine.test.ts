import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyComplaintManifestEngine } from "./legacy-complaint-manifest-engine.js";
import { newLegacyComplaintManifest } from "./legacy-complaint-manifest.js";

test("LegacyComplaintManifestEngine keeps results within bounds", () => {
  const engine = defaultLegacyComplaintManifestEngine(flags.newRegistry());
  const item = newLegacyComplaintManifest("code-503", "title-477");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
