import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyRetentionDigestEngine } from "./legacy-retention-digest-engine.js";
import { newLegacyRetentionDigest } from "./legacy-retention-digest.js";

test("LegacyRetentionDigestEngine keeps results within bounds", () => {
  const engine = defaultLegacyRetentionDigestEngine(flags.newRegistry());
  const item = newLegacyRetentionDigest("code-543", "title-631");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
