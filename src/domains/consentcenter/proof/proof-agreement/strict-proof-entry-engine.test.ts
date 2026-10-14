import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictProofEntryEngine } from "./strict-proof-entry-engine.js";
import { newStrictProofEntry } from "./strict-proof-entry.js";

test("StrictProofEntryEngine keeps results within bounds", () => {
  const engine = defaultStrictProofEntryEngine(flags.newRegistry());
  const item = newStrictProofEntry("code-243", "name-366");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
