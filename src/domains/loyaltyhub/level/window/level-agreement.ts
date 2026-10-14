import * as text from "../../../../kit/text.js";

/** Where a level agreement is in its life cycle. */
export type LevelAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a level agreement and its current status. */
export class LevelAgreement {
  code: string;
  label: string;
  batchSize: number;
  title: string;
  tags: string[];
  ratio: number;
  priority: number;
  frequencyCap: number;
  attempts: number;
  unit: string;
  createdAt: number;
  status: LevelAgreementStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    title: string,
    tags: string[],
    ratio: number,
    priority: number,
    frequencyCap: number,
    attempts: number,
    unit: string,
    createdAt: number,
    status: LevelAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.title = title;
    this.tags = tags;
    this.ratio = ratio;
    this.priority = priority;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
    this.unit = unit;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LevelAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"level agreement"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round(this.ratio * this.attempts * 100) / 100;
  }

  copy(): LevelAgreement {
    return new LevelAgreement(
      this.code,
      this.label,
      this.batchSize,
      this.title,
      this.tags,
      this.ratio,
      this.priority,
      this.frequencyCap,
      this.attempts,
      this.unit,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a level agreement in status open. */
export function newLevelAgreement(code: string, label: string): LevelAgreement {
  return new LevelAgreement(code, label, 0, "", [], 0, 0, 0, 0, "", 0, "open");
}
