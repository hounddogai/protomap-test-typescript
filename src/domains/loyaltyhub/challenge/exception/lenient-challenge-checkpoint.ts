import * as text from "../../../../kit/text.js";

/** Where a lenient challenge checkpoint is in its life cycle. */
export type LenientChallengeCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient challenge checkpoint and its current status. */
export class LenientChallengeCheckpoint {
  code: string;
  label: string;
  locale: string;
  tags: string[];
  maximum: number;
  unit: string;
  source: string;
  status: LenientChallengeCheckpointStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    tags: string[],
    maximum: number,
    unit: string,
    source: string,
    status: LenientChallengeCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.tags = tags;
    this.maximum = maximum;
    this.unit = unit;
    this.source = source;
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

  canMoveTo(next: LenientChallengeCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientChallengeCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient challenge checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient challenge checkpoint"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): LenientChallengeCheckpoint {
    return new LenientChallengeCheckpoint(
      this.code,
      this.label,
      this.locale,
      this.tags,
      this.maximum,
      this.unit,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient challenge checkpoint in status idle. */
export function newLenientChallengeCheckpoint(code: string, label: string): LenientChallengeCheckpoint {
  return new LenientChallengeCheckpoint(code, label, "", [], 0, "", "", "idle");
}
