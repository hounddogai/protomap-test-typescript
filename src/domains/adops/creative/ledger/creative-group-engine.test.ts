import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreativeGroupEngine } from "./creative-group-engine.js";
import { newCreativeGroup } from "./creative-group.js";

test("CreativeGroupEngine keeps results within bounds", () => {
  const engine = defaultCreativeGroupEngine(flags.newRegistry());
  const item = newCreativeGroup("code-97", "title-599");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
