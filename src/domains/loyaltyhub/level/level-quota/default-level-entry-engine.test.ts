import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultLevelEntryEngine } from "./default-level-entry-engine.js";
import { newDefaultLevelEntry } from "./default-level-entry.js";

test("DefaultLevelEntryEngine keeps results within bounds", () => {
  const engine = defaultDefaultLevelEntryEngine(flags.newRegistry());
  const item = newDefaultLevelEntry("code-768", "label-60");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
