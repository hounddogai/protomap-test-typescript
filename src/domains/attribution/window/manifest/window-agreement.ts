import * as text from "../../../../kit/text.js";

/** Where a window agreement is in its life cycle. */
export type WindowAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** One window agreement, with what the planners need to act on it. */
export class WindowAgreement {
  code: string;
  name: string;
  category: string;
  bid: number;
  title: string;
  visible: boolean;
  rate: number;
  campaignRef: string;
  batchSize: number;
  active: boolean;
  status: WindowAgreementStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    bid: number,
    title: string,
    visible: boolean,
    rate: number,
    campaignRef: string,
    batchSize: number,
    active: boolean,
    status: WindowAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.bid = bid;
    this.title = title;
    this.visible = visible;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.batchSize = batchSize;
    this.active = active;
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

  canMoveTo(next: WindowAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedTotal(): number {
    return Math.round(this.bid * this.batchSize * 100) / 100;
  }

  copy(): WindowAgreement {
    return new WindowAgreement(
      this.code,
      this.name,
      this.category,
      this.bid,
      this.title,
      this.visible,
      this.rate,
      this.campaignRef,
      this.batchSize,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a window agreement in status new. */
export function newWindowAgreement(code: string, name: string): WindowAgreement {
  return new WindowAgreement(code, name, "", 0, "", false, 0, "", 0, false, "new");
}
