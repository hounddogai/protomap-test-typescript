import * as text from "../../../../kit/text.js";

/** Where a domain estimate is in its life cycle. */
export type DomainEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One domain estimate, with what the planners need to act on it. */
export class DomainEstimate {
  code: string;
  label: string;
  revision: number;
  frequencyCap: number;
  visible: boolean;
  status: DomainEstimateStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    frequencyCap: number,
    visible: boolean,
    status: DomainEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DomainEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DomainEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"domain estimate"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.revision - this.frequencyCap) * 100) / 100;
  }

  copy(): DomainEstimate {
    return new DomainEstimate(this.code, this.label, this.revision, this.frequencyCap, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a domain estimate in status draft. */
export function newDomainEstimate(code: string, label: string): DomainEstimate {
  return new DomainEstimate(code, label, 0, 0, false, "draft");
}
