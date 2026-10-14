import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalComplaintManifestEngine } from "./regional-complaint-manifest-engine.js";
import { newRegionalComplaintManifest } from "./regional-complaint-manifest.js";

test("RegionalComplaintManifestEngine keeps results within bounds", () => {
  const engine = defaultRegionalComplaintManifestEngine(flags.newRegistry());
  const item = newRegionalComplaintManifest("code-247", "label-241");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
