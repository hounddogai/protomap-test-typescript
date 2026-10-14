import * as clock from "../../../../kit/clock.js";
import { SlaPolicyEngine, defaultSlaPolicyEngine } from "./sla-policy-engine.js";
import { SlaPolicyValidator, defaultSlaPolicyValidator } from "./sla-policy-rules.js";
import { SlaPolicyStore } from "./sla-policy-store.js";

/** Moves sla policies through their life cycle and keeps a journal of what it did. */
export class SlaPolicyWorkflow {
  store: SlaPolicyStore;
  validator: SlaPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaPolicyEngine;

  constructor(
    store: SlaPolicyStore,
    validator: SlaPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaPolicyEngine,
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
      throw new Error(`sla policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla policy ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newSlaPolicyWorkflow(store: SlaPolicyStore, clockValue: clock.Clock): SlaPolicyWorkflow {
  return new SlaPolicyWorkflow(store, defaultSlaPolicyValidator(), clockValue, [], defaultSlaPolicyEngine());
}
