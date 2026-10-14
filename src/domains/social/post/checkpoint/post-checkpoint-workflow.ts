import * as clock from "../../../../kit/clock.js";
import { PostCheckpointEngine, defaultPostCheckpointEngine } from "./post-checkpoint-engine.js";
import { PostCheckpointValidator, defaultPostCheckpointValidator } from "./post-checkpoint-rules.js";
import { PostCheckpointStore } from "./post-checkpoint-store.js";

/** Moves post checkpoints through their life cycle and keeps a journal of what it did. */
export class PostCheckpointCoordinator {
  store: PostCheckpointStore;
  validator: PostCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PostCheckpointEngine;

  constructor(
    store: PostCheckpointStore,
    validator: PostCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PostCheckpointEngine,
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
      throw new Error(`post checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post checkpoint ${code} not found`);
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

export function newPostCheckpointCoordinator(store: PostCheckpointStore, clockValue: clock.Clock): PostCheckpointCoordinator {
  return new PostCheckpointCoordinator(
    store,
    defaultPostCheckpointValidator(),
    clockValue,
    [],
    defaultPostCheckpointEngine(),
  );
}
