import * as clock from "../../../../kit/clock.js";
import {
  SeasonalInsightAssignmentEngine,
  defaultSeasonalInsightAssignmentEngine,
} from "./seasonal-insight-assignment-engine.js";
import {
  SeasonalInsightAssignmentValidator,
  defaultSeasonalInsightAssignmentValidator,
} from "./seasonal-insight-assignment-rules.js";
import { SeasonalInsightAssignmentStore } from "./seasonal-insight-assignment-store.js";

/** Moves seasonal insight assignments through their life cycle and keeps a journal of what it did. */
export class SeasonalInsightAssignmentService {
  store: SeasonalInsightAssignmentStore;
  validator: SeasonalInsightAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalInsightAssignmentEngine;

  constructor(
    store: SeasonalInsightAssignmentStore,
    validator: SeasonalInsightAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalInsightAssignmentEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal insight assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal insight assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal insight assignment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalInsightAssignmentService(store: SeasonalInsightAssignmentStore, clockValue: clock.Clock): SeasonalInsightAssignmentService {
  return new SeasonalInsightAssignmentService(
    store,
    defaultSeasonalInsightAssignmentValidator(),
    clockValue,
    [],
    defaultSeasonalInsightAssignmentEngine(),
  );
}
