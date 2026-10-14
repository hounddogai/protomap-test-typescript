import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CsatMilestoneEngine, defaultCsatMilestoneEngine } from "./csat-milestone-engine.js";
import { CsatMilestoneValidator, defaultCsatMilestoneValidator } from "./csat-milestone-rules.js";
import { CsatMilestoneStore } from "./csat-milestone-store.js";

/** Moves csat milestones through their life cycle and keeps a journal of what it did. */
export class CsatMilestoneService {
  store: CsatMilestoneStore;
  validator: CsatMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CsatMilestoneEngine;

  constructor(
    store: CsatMilestoneStore,
    validator: CsatMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CsatMilestoneEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat milestone ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCsatMilestoneService(store: CsatMilestoneStore, clockValue: clock.Clock, flagsValue: flags.Registry): CsatMilestoneService {
  return new CsatMilestoneService(
    store,
    defaultCsatMilestoneValidator(),
    clockValue,
    [],
    defaultCsatMilestoneEngine(flagsValue),
  );
}
