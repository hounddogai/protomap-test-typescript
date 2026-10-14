import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultProofWindowEngine } from "./default-proof-window-engine.js";
import { newDefaultProofWindow } from "./default-proof-window.js";

test("DefaultProofWindowEngine keeps results within bounds", () => {
  const engine = defaultDefaultProofWindowEngine(flags.newRegistry());
  const item = newDefaultProofWindow("code-591", "name-814");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
