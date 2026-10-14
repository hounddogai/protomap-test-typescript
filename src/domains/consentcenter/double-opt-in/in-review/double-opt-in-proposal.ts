import * as text from "../../../../kit/text.js";

/** Where a double opt in proposal is in its life cycle. */
export type DoubleOptInProposalStatus = "new" | "queued" | "running" | "done" | "failed";

/** One double opt in proposal, with what the planners need to act on it. */
export class DoubleOptInProposal {
  code: string;
  title: string;
  durationMinutes: number;
  tags: string[];
  openRate: number;
  conversionRate: number;
  impressions: number;
  priority: number;
  status: DoubleOptInProposalStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    tags: string[],
    openRate: number,
    conversionRate: number,
    impressions: number,
    priority: number,
    status: DoubleOptInProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.tags = tags;
    this.openRate = openRate;
    this.conversionRate = conversionRate;
    this.impressions = impressions;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DoubleOptInProposalStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DoubleOptInProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.impressions + this.conversionRate) * 100) / 100;
  }

  copy(): DoubleOptInProposal {
    return new DoubleOptInProposal(
      this.code,
      this.title,
      this.durationMinutes,
      this.tags,
      this.openRate,
      this.conversionRate,
      this.impressions,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a double opt in proposal in status new. */
export function newDoubleOptInProposal(code: string, title: string): DoubleOptInProposal {
  return new DoubleOptInProposal(code, title, 0, [], 0, 0, 0, 0, "new");
}
