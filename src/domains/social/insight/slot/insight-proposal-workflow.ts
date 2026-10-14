import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InsightProposalEngine, defaultInsightProposalEngine } from "./insight-proposal-engine.js";
import { InsightProposalValidator, defaultInsightProposalValidator } from "./insight-proposal-rules.js";
import { InsightProposalStore } from "./insight-proposal-store.js";

/** Moves insight proposals through their life cycle and keeps a journal of what it did. */
export class InsightProposalService {
  store: InsightProposalStore;
  validator: InsightProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightProposalEngine;

  constructor(
    store: InsightProposalStore,
    validator: InsightProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightProposalEngine,
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
      throw new Error(`insight proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight proposal ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newInsightProposalService(store: InsightProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): InsightProposalService {
  return new InsightProposalService(
    store,
    defaultInsightProposalValidator(),
    clockValue,
    [],
    defaultInsightProposalEngine(flagsValue),
  );
}
