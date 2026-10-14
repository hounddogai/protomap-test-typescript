import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathEntryEngine } from "./path-entry-engine.js";
import { newPathEntry } from "./path-entry.js";

test("PathEntryEngine keeps results within bounds", () => {
  const engine = defaultPathEntryEngine(flags.newRegistry());
  const item = newPathEntry("code-631", "title-602");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
