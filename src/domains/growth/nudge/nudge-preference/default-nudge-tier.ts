import * as text from "../../../../kit/text.js";

/** Where a default nudge tier is in its life cycle. */
export type DefaultNudgeTierStatus = "created" | "validated" | "published" | "retired";

/** A default nudge tier as the nudge team keeps it. */
export class DefaultNudgeTier {
  code: string;
  label: string;
  maximum: number;
  ratio: number;
  channel: string;
  status: DefaultNudgeTierStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    ratio: number,
    channel: string,
    status: DefaultNudgeTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.ratio = ratio;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultNudgeTierStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultNudgeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default nudge tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.maximum + this.ratio) * 100) / 100;
  }

  copy(): DefaultNudgeTier {
    return new DefaultNudgeTier(this.code, this.label, this.maximum, this.ratio, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default nudge tier in status created. */
export function newDefaultNudgeTier(code: string, label: string): DefaultNudgeTier {
  return new DefaultNudgeTier(code, label, 0, 0, "", "created");
}
