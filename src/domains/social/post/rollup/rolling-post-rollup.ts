import * as text from "../../../../kit/text.js";

/** Where a rolling post rollup is in its life cycle. */
export type RollingPostRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One rolling post rollup, with what the planners need to act on it. */
export class RollingPostRollup {
  code: string;
  label: string;
  archived: boolean;
  weight: number;
  updatedAt: number;
  channel: string;
  locale: string;
  status: RollingPostRollupStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    weight: number,
    updatedAt: number,
    channel: string,
    locale: string,
    status: RollingPostRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.weight = weight;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingPostRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPostRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling post rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.weight + this.updatedAt) * 100) / 100;
  }

  copy(): RollingPostRollup {
    return new RollingPostRollup(
      this.code,
      this.label,
      this.archived,
      this.weight,
      this.updatedAt,
      this.channel,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling post rollup in status idle. */
export function newRollingPostRollup(code: string, label: string): RollingPostRollup {
  return new RollingPostRollup(code, label, false, 0, 0, "", "", "idle");
}
