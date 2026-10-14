import * as clock from "../../../../kit/clock.js";
import { FunnelQuotaEngine, defaultFunnelQuotaEngine } from "./funnel-quota-engine.js";
import { FunnelQuotaValidator, defaultFunnelQuotaValidator } from "./funnel-quota-rules.js";
import { FunnelQuotaStore } from "./funnel-quota-store.js";

/** Moves funnel quotas through their life cycle and keeps a journal of what it did. */
export class FunnelQuotaWorkflow {
  store: FunnelQuotaStore;
  validator: FunnelQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FunnelQuotaEngine;

  constructor(
    store: FunnelQuotaStore,
    validator: FunnelQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FunnelQuotaEngine,
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
      throw new Error(`funnel quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel quota ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newFunnelQuotaWorkflow(store: FunnelQuotaStore, clockValue: clock.Clock): FunnelQuotaWorkflow {
  return new FunnelQuotaWorkflow(store, defaultFunnelQuotaValidator(), clockValue, [], defaultFunnelQuotaEngine());
}
