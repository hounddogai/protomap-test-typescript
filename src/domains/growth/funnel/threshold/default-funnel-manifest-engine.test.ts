import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultFunnelManifestEngine } from "./default-funnel-manifest-engine.js";
import { newDefaultFunnelManifest } from "./default-funnel-manifest.js";

test("DefaultFunnelManifestEngine keeps results within bounds", () => {
  const engine = defaultDefaultFunnelManifestEngine(flags.newRegistry());
  const item = newDefaultFunnelManifest("code-506", "name-603");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
