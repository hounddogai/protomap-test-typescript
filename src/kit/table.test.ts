import assert from "node:assert/strict";
import { test } from "node:test";
import * as table from "./table.js";

test("Table rejects rows of the wrong width", () => {
  const grid = table.newTable("Totals", ["region", "total"]);
  assert.throws(() => grid.addRow(["north"]), Error, "short row");
  try {
    grid.addRow(["north", "12"]);
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(grid.csv(), "region,total\nnorth,12", "csv");
});
