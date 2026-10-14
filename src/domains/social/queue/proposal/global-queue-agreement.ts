import * as text from "../../../../kit/text.js";

/** Where a global queue agreement is in its life cycle. */
export type GlobalQueueAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global queue agreement as the queue team keeps it. */
export class GlobalQueueAgreement {
  code: string;
  label: string;
  clicks: number;
  locale: string;
  ratio: number;
  archived: boolean;
  tags: string[];
  status: GlobalQueueAgreementStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    locale: string,
    ratio: number,
    archived: boolean,
    tags: string[],
    status: GlobalQueueAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.locale = locale;
    this.ratio = ratio;
    this.archived = archived;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalQueueAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalQueueAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global queue agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.clicks - this.ratio) * 100) / 100;
  }

  copy(): GlobalQueueAgreement {
    return new GlobalQueueAgreement(
      this.code,
      this.label,
      this.clicks,
      this.locale,
      this.ratio,
      this.archived,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global queue agreement in status proposed. */
export function newGlobalQueueAgreement(code: string, label: string): GlobalQueueAgreement {
  return new GlobalQueueAgreement(code, label, 0, "", 0, false, [], "proposed");
}
