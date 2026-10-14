import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultNudgeDigestEngine } from "./nudge-digest-engine.js";
import { newNudgeDigest } from "./nudge-digest.js";

test("NudgeDigestEngine keeps results within bounds", () => {
  const engine = defaultNudgeDigestEngine();
  const item = newNudgeDigest("code-921", "title-4");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
