import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelDigestEngine } from "./funnel-digest-engine.js";
import { newFunnelDigest } from "./funnel-digest.js";

test("FunnelDigestEngine keeps results within bounds", () => {
  const engine = defaultFunnelDigestEngine(flags.newRegistry());
  const item = newFunnelDigest("code-850", "title-980");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
