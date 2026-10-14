import * as text from "../../../../kit/text.js";

/** Where a weighted opt out agreement is in its life cycle. */
export type WeightedOptOutAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted opt out agreement as the opt out team keeps it. */
export class WeightedOptOutAgreement {
  code: string;
  title: string;
  channel: string;
  tags: string[];
  label: string;
  score: number;
  status: WeightedOptOutAgreementStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    tags: string[],
    label: string,
    score: number,
    status: WeightedOptOutAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.tags = tags;
    this.label = label;
    this.score = score;
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

  canMoveTo(next: WeightedOptOutAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WeightedOptOutAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted opt out agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): WeightedOptOutAgreement {
    return new WeightedOptOutAgreement(
      this.code,
      this.title,
      this.channel,
      this.tags,
      this.label,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted opt out agreement in status open. */
export function newWeightedOptOutAgreement(code: string, title: string): WeightedOptOutAgreement {
  return new WeightedOptOutAgreement(code, title, "", [], "", 0, "open");
}
