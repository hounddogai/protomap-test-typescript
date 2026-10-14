import * as clock from "../../../../kit/clock.js";
import { ActivationPlanEngine, defaultActivationPlanEngine } from "./activation-plan-engine.js";
import { ActivationPlanValidator, defaultActivationPlanValidator } from "./activation-plan-rules.js";
import { ActivationPlanStore } from "./activation-plan-store.js";

/** Moves activation plans through their life cycle and keeps a journal of what it did. */
export class ActivationPlanDesk {
  store: ActivationPlanStore;
  validator: ActivationPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationPlanEngine;

  constructor(
    store: ActivationPlanStore,
    validator: ActivationPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationPlanEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation plan ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newActivationPlanDesk(store: ActivationPlanStore, clockValue: clock.Clock): ActivationPlanDesk {
  return new ActivationPlanDesk(store, defaultActivationPlanValidator(), clockValue, [], defaultActivationPlanEngine());
}
