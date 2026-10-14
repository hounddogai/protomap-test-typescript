import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationEntryEngine } from "./reputation-entry-engine.js";
import { newReputationEntry } from "./reputation-entry.js";

test("ReputationEntryEngine keeps results within bounds", () => {
  const engine = defaultReputationEntryEngine(flags.newRegistry());
  const item = newReputationEntry("code-901", "label-279");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
