import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualWaitDigestEngine } from "./manual-wait-digest-engine.js";
import { newManualWaitDigest } from "./manual-wait-digest.js";

test("ManualWaitDigestEngine keeps results within bounds", () => {
  const engine = defaultManualWaitDigestEngine();
  const item = newManualWaitDigest("code-812", "label-527");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
