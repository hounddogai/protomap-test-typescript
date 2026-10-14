import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultInsightProfileEngine } from "./default-insight-profile-engine.js";
import { newDefaultInsightProfile } from "./default-insight-profile.js";

test("DefaultInsightProfileEngine keeps results within bounds", () => {
  const engine = defaultDefaultInsightProfileEngine(flags.newRegistry());
  const item = newDefaultInsightProfile("code-646", "label-965");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
