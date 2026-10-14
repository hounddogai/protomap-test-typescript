import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  DefaultEscalationScoreEngine,
  defaultDefaultEscalationScoreEngine,
} from "./default-escalation-score-engine.js";
import {
  DefaultEscalationScoreValidator,
  defaultDefaultEscalationScoreValidator,
} from "./default-escalation-score-rules.js";
import { DefaultEscalationScoreStore } from "./default-escalation-score-store.js";

/** Moves default escalation scores through their life cycle and keeps a journal of what it did. */
export class DefaultEscalationScoreCoordinator {
  store: DefaultEscalationScoreStore;
  validator: DefaultEscalationScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultEscalationScoreEngine;

  constructor(
    store: DefaultEscalationScoreStore,
    validator: DefaultEscalationScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultEscalationScoreEngine,
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
      throw new Error(`default escalation score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default escalation score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default escalation score ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newDefaultEscalationScoreCoordinator(store: DefaultEscalationScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultEscalationScoreCoordinator {
  return new DefaultEscalationScoreCoordinator(
    store,
    defaultDefaultEscalationScoreValidator(),
    clockValue,
    [],
    defaultDefaultEscalationScoreEngine(flagsValue),
  );
}
