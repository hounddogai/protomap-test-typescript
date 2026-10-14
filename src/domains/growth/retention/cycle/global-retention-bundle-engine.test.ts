import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalRetentionBundleEngine } from "./global-retention-bundle-engine.js";
import { newGlobalRetentionBundle } from "./global-retention-bundle.js";

test("GlobalRetentionBundleEngine keeps results within bounds", () => {
  const engine = defaultGlobalRetentionBundleEngine(flags.newRegistry());
  const item = newGlobalRetentionBundle("code-807", "name-185");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
