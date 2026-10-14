import * as clock from "../../../../kit/clock.js";
import { MacroScoreValidator, defaultMacroScoreValidator } from "./macro-score-rules.js";
import { MacroScoreStore } from "./macro-score-store.js";

/** Moves macro scores through their life cycle and keeps a journal of what it did. */
export class MacroScoreWorkflow {
  store: MacroScoreStore;
  validator: MacroScoreValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: MacroScoreStore, validator: MacroScoreValidator, clockValue: clock.Clock, journal: string[]) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newMacroScoreWorkflow(store: MacroScoreStore, clockValue: clock.Clock): MacroScoreWorkflow {
  return new MacroScoreWorkflow(store, defaultMacroScoreValidator(), clockValue, []);
}
